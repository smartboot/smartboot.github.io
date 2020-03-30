
### 通信会话AioSession

​	AioQuickServer和AioQuickClient在smart-socket中负责的是服务的配置、启动、停止，所以代码逻辑较简单。AioSession才是smart-socket真正的灵魂，它是衔接网络传输与业务应用的纽带。在AioSession的协调控制下，用户无需再去关心并发所带来的复杂IO场景，只需专注于数据编解码与业务处理。

​	AioSession我们只讲解跟用户息息相关的部分，其余部分读者可自行去阅读源码。AIO通信的关键两个环节为：读回调、写回调，smart-socket对这两个事件的处理都在AioSession中实现。随着版本的迭代，读者在本文看到的代码可能与实际项目源码中看到的可能略有差异，但主体结构是一致的。我们先来看一下读回调的处理过程：

1. 调用flip方法将接收数据的缓冲区切换至读模式。
2. 执行`ioServerConfig.getProtocol().decode()`进行数据解析。若无法解析出一个完整的消息则返回null，结束本次解析操作；若在解析过程中出现异常会触发状态机**PROCESS_EXCEPTION**，在这个环节出现异常通常是因为接收到了非法数据，此类问题的常见处理方式为关闭当前网络。
3. 如果成功解析出一个业务消息，会执行消息处理器`messageProcessor.process(this, dataEntry)`。这个阶段出现的运行时异常并不影响原网络传输中的数据有效性，所以smart-socket对异常进行了捕获并依旧以状态机**PROCESS_EXCEPTION**的形式反馈给用户。
4. 完成业务处理后若缓冲区中还存留未解析的数据，会再次执行解码（步骤2）、业务处理（步骤3）操作。
5. byteBuf中存放了业务处理后待发送的数据，执行flush进行数据输出。
6. 监测当前AioSession状态，如若已不可用则结束。
7. 若AioSession依旧处于可用状态，则切换缓冲区至写状态，并触发读操作`continueRead`。

```java
void readFromChannel(boolean eof) {
    final ByteBuffer readBuffer = this.readBuffer.buffer();
    readBuffer.flip();
    final MessageProcessor<T> messageProcessor = ioServerConfig.getProcessor();
    while (readBuffer.hasRemaining()) {
        T dataEntry = null;
        try {
            dataEntry = ioServerConfig.getProtocol().decode(readBuffer, this);
        } catch (Exception e) {
            messageProcessor.stateEvent(this, StateMachineEnum.DECODE_EXCEPTION, e);
            throw e;
        }
        if (dataEntry == null) {
            break;
        }

        //处理消息
        try {
            messageProcessor.process(this, dataEntry);
        } catch (Exception e) {
            messageProcessor.stateEvent(this, StateMachineEnum.PROCESS_EXCEPTION, e);
        }
    }
    if (byteBuf != null && !byteBuf.isClosed()) {
        byteBuf.flush();
    }

    if (eof || status == SESSION_STATUS_CLOSING) {
        close(false);
        messageProcessor.stateEvent(this, StateMachineEnum.INPUT_SHUTDOWN, null);
        return;
    }
    if (status == SESSION_STATUS_CLOSED) {
        return;
    }

    //数据读取完毕
    if (readBuffer.remaining() == 0) {
        readBuffer.clear();
    } else if (readBuffer.position() > 0) {
        // 仅当发生数据读取时调用compact,减少内存拷贝
        readBuffer.compact();
    } else {
        readBuffer.position(readBuffer.limit());
        readBuffer.limit(readBuffer.capacity());
    }
    continueRead();
}
```

写操作的回调代码实现相对简单很多，但事实上却是处理难度最大的。因为写操作是个主动行为，我们不可预知用户在何时会写入数据，而写缓冲区中积压的数据又要依靠smart-socket将其输出到网络对端，故此处就存在并发的情况。如果出现多个线程同时触发write操作会导致WritePendingException，在AioSession中使用了信号量Semaphore完成了同步控制，实现了数据有序的输出。smart-socket的写回调会执行`writeToChannel`方法，而这信号量在之前已经通过其他途径被锁定，此处暂且不提。回调的处理逻辑为：

1. 识别writeBuffer或缓冲集合bufList中是否存在待输出的数据，若有则继续执行写操作`continueWrite()`。
2. 如果数据已经输出完毕，则释放信号量。
3. 如果当前AioSession处于不可用状态，则关闭当前会话。
4. 由于并发的因素可能在释放信号量之后又有数据被写进来，且会话依旧处于可用状态，则当前线程会去竞争信号量资源，并在成功获取到信号量后执行数据输出。

```java
void writeToChannel() {
    if (writeBuffer == null) {
        writeBuffer = byteBuf.bufList.poll();
    } else if (!writeBuffer.buffer().hasRemaining()) {
        writeBuffer.clean();
        writeBuffer = byteBuf.bufList.poll();
    }
    if (writeBuffer != null) {
        continueWrite(writeBuffer);
        return;
    }
    semaphore.release();
    //此时可能是Closing或Closed状态
    if (status != SESSION_STATUS_ENABLED) {
        close();
    } else if (!byteBuf.isClosed()) {
        //也许此时有新的消息通过write方法添加到writeCacheQueue中
        byteBuf.flush();
    }
}
```

若想了解smart-socket完整的写操作处理逻辑，请阅读源码`WriteBuffer.java`。

