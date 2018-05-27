七、通信会话AioSession
===

> AioSession是smart-socket中最核心、复杂度最高的类

### 核心成员属性

| 属性名  | 类型 | 说明 |
|  ----  | ----| -----|
|NEXT_ID |static int|Session ID生成器|
|sessionId|final int|Session ID，值取自++NEXT_ID|
|status|byte|当前会话的状态，取值范围：SESSION_STATUS_CLOSED(1)，处于该状态的AioSession无法再进行读写操作；SESSION_STATUS_CLOSING(2)，AioSession状态从SESSION_STATUS_ENABLED到SESSION_STATUS_CLOSED的过渡状态。在SESSION_STATUS_CLOSING状态下，AioSession不接受新的读写请求，但会把缓存中待输出的数据进行写操作，输出完毕后更改状态至SESSION_STATUS_CLOSED；SESSION_STATUS_ENAB(3)，AioSessio的默认状态，表示当前会话状态可以进行正常的消息通信、协议编解码、业务处理业务处理|
|attachment|Object|附件对象|
|writeCacheQueue|ArrayBlockingQueue<ByteBuffer>|输出缓冲队列|
|serverFlowLimit|Boolean|限流标志，仅服务端有值，客户端为null|
|readCompletionHandler|ReadCompletionHandler|读回调|
|writeCompletionHandler|WriteCompletionHandler|写回调|
|channel|AsynchronousSocketChannel|当前AioSession映射的网络通道|
|semaphore|Semaphore|信号量，控制输出资源的竞争|
|ioServerConfig|IoServerConfig|AioQuickClient\AioQuickServer透传过来的配置项|

### 核心方法
| 方法名  | 说明 |
|  ----  | -----|
|AioSession(AsynchronousSocketChannel, IoServerConfig, ReadCompletionHandler, WriteCompletionHandler, boolean serverSession)|唯一的一个构造方法|
|void readFromChannel()|数据解码——>业务处理——>注册读事件|
|public void write(final ByteBuffer buffer)|将编码后的业务消息写入缓冲区，并触发`writeToChannel()`|
|void writeToChannel()|将缓冲区的数据写入至网络通道|
|public void close(boolean immediate)|关闭会话|

#### 1、构造方法
```
AioSession(AsynchronousSocketChannel channel, IoServerConfig<T> config, ReadCompletionHandler readCompletionHandler, WriteCompletionHandler writeCompletionHandler, boolean serverSession) {
        this.channel = channel;
        this.readCompletionHandler = readCompletionHandler;
        this.writeCompletionHandler = writeCompletionHandler;
        this.writeCacheQueue = new ArrayBlockingQueue<ByteBuffer>(config.getWriteQueueSize());
        this.ioServerConfig = config;
        this.serverFlowLimit = serverSession ? false : null;
        config.getProcessor().stateEvent(this, StateMachineEnum.NEW_SESSION, null);//触发状态机
        this.readBuffer = ByteBuffer.allocate(config.getReadBufferSize());
}
```
- 该构造方法是包可见的，所以只有smart-socket才可创建AioSession对象。对象的创建入口为`AioQuickServer`和`AioQuickClient`。
- 构造方法的5个入参分别代表，channe：当前连接通道对象；config：AioQuickServer/AioQuickClient服务器配置；readCompletionHandler/writeCompletionHandler：读写回调处理类；serverSession：true表示当前Session的由服务端创建，否则为客户端创建。
- writeCacheQueue，创建输出缓冲区。该缓冲区大小请设置一个合理的值，以免造成资源浪费。
- serverFlowLimit，流控标志。流控方案仅存在于服务端，所以只有AioQuickServer构建的AioSession对象会初始化该值。
- 触发状态机`StateMachineEnum.NEW_SESSION`

#### 2、readFromChannel()
readFromChannel是专门用于处理[读回调（ReadCompletionHandler）](http://smartsocket.mydoc.io?v=36765&t=229643)的接口，使**读监控->数据读取->协议解码->业务处理->继续读监控** 形成一个良性的运作状态。且具体实现分为三部分：
- 片段一    
解码已读取到数据，若解码成功则进行业务处理，直至当前剩余的数据无法解析成完整的业务消息为止。

```
T dataEntry;
while ((dataEntry = ioServerConfig.getProtocol().decode(readBuffer, this, eof)) != null) {
    //处理消息
    try {
        for (Filter<T> h : ioServerConfig.getFilters()) {
            h.processFilter(this, dataEntry);
        }
        ioServerConfig.getProcessor().process(this, dataEntry);
    } catch (Exception e) {
        logger.catching(e);
        for (Filter<T> h : ioServerConfig.getFilters()) {
            h.processFail(this, dataEntry, e);
        }
    }

}
```

- 片段二
通过**片段一**执行后的readBuffer有三种结果：1、数据刚好完全解析完，调用`clear()`重置；2、完成了解码操作，但还残留部分未解析的数据，则将剩余的数据转移至ByteBuffer的头部；3、原先已有的数据不满足解码条件，则恢复现场，继续读。
```
if (readBuffer.remaining() == 0) {
      readBuffer.clear();
} else if (readBuffer.position() > 0) {
      readBuffer.compact();
} else {
      readBuffer.position(readBuffer.limit());
      readBuffer.limit(readBuffer.capacity());
}
```

- 片段三
如果触发了流控条件，则设置流控标志`serverFlowLimit = true`。否则继续新一轮的读操作，一旦读取到数据，会由aioCompletionHandler再次触发`readFromChannel()`方法
```
if (serverFlowLimit != null && writeCacheQueue.size() > ioServerConfig.getFlowLimitLine()) {
     serverFlowLimit = true;
} else {
     continueRead();
}
```

#### 3、write(ByteBuffer buffer)
先将数据存入缓冲区`writeCacheQueue`。采取尝试获取信号量`semaphore`，获取成功触发通道的输出操作。此处之所以引入了信号量`semaphore`，是因为`writeToChannel()`可能由业务线程通过`write`调用，也有可能由`WriteCompletionHandler`的回调触发，如果不处理好同步控制，会出现`WritePendingException`。
```
public void write(final ByteBuffer buffer) throws IOException {
        if (isInvalid()) {
            return;
        }
        try {
            writeCacheQueue.put(buffer);
        } catch (InterruptedException e) {
            logger.error(e);
        }
        if (semaphore.tryAcquire()) {
            writeToChannel();
        }
    }
```

#### 4、writeToChannel
`wrtie`只是面向业务的输出行为，真正执行数据输出的是`writeToChannel`。个人认为该方法是整个`smart-socket`复杂度最高的代码，需要具备一定程度的线程同步知识才能完全理解代码意义。**执行`writeToChannel`之前，必须持有信号量`semaphore `**

- 片段一    
若前一次输出操作还残留部分数据，继续执行输出，否则释放其内存空间。
```
if (writeAttach.buffer != null && writeAttach.buffer.hasRemaining()) {
     continueWrite();
     return;
}
writeAttach.buffer = null;//释放对象
```
- 片段二    
判断当前是否存在待输出的数据，若已无可输出的数据，则释放信号量资源。但是在释放信号量之后的瞬间可能有新的数据进入缓冲区，因此需要再次争抢信号量资源并重新触发`writeToChannel`。
```
if (writeCacheQueue.isEmpty()) {
            semaphore.release();
            if (isInvalid()) {//此时可能是Closing或Closed状态
                close();
            } else if (writeCacheQueue.size() > 0 && semaphore.tryAcquire()) {
                writeToChannel();
            }
            return;
}
```

- 片段三    
压缩缓冲区中待输出的数据，且最大的压缩字节长度为**32*1024**
```
Iterator<ByteBuffer> iterable = writeCacheQueue.iterator();
int totalSize = 0;
while (iterable.hasNext() && totalSize <= MAX_WRITE_SIZE) {
       totalSize += iterable.next().remaining();
}
byte[] data = new byte[totalSize];
int index = 0;
while (index < data.length) {
       ByteBuffer srcBuffer = writeCacheQueue.poll();
       int remain = srcBuffer.remaining();
       srcBuffer.get(data, index, remain);
       index += remain;
}
```
- 片段四    
构建压缩后的ByteBuffer对象执行数据输出。
```
writeAttach.buffer = ByteBuffer.wrap(data);
continueWrite();
```

#### 5、tryReleaseFlowLimit
判断当前AioSession是否处理限流状态，若符合解除限流条件，则释放流控，并重新进行数据读取。处于限流状态的AioSession必然不存在读操作，所以此处可放心的执行`channel.read();`
```
if (serverFlowLimit != null && serverFlowLimit && writeCacheQueue.size() < ioServerConfig.getReleaseLine()) {
      serverFlowLimit = false;
      continueRead();
}
```

#### 6、close
关闭当前会话，当入参为`true`或缓冲区已清空时，直接关闭当前会话。否则切换会话状态为`SessionStatus.SESSION_STATUS_CLOSING`直至缓存区被清空再执行关闭。
```
public void close(boolean immediate) {
    if (status == SESSION_STATUS_CLOSED) {
        logger.warn("ignore, session:{} is closed:", getSessionID());//说明close方法被重复调用
        return;
    }
    status = immediate ? SESSION_STATUS_CLOSED : SESSION_STATUS_CLOSING;
    if (immediate) {
        try {
            channel.close();
            if (logger.isDebugEnabled()) {
                logger.debug("session:{} is closed:", getSessionID());
            }
        } catch (IOException e) {
            logger.catching(e);
        }
        ioServerConfig.getProcessor().stateEvent(this, StateMachineEnum.SESSION_CLOSED, null);
    } else if ((writeBuffer == null || !writeBuffer.hasRemaining()) && writeCacheQueue.isEmpty() && semaphore.tryAcquire()) {
        close(true);
        semaphore.release();
    } else {
        ioServerConfig.getProcessor().stateEvent(this, StateMachineEnum.SESSION_CLOSING, null);
    }
}
```

