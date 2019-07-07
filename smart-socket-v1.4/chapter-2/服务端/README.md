
### 3.3 服务端AioQuickServer

异步非阻塞通信的服务端实现。这个类主要是对JDK提供的AIO通信类AsynchronousServerSocketChannel、AsynchronousChannelGroup进行封装。AioQuickServer是服务端通信的调度中心，在完成协议、消息处理器的定义后，需要通过AioQuickServer来启动我们的通信服务。AioQuickServer提供了一些必要的参数配置接口，方便开发人员进行资源分配以达到最优效果。

2.5.1 成员属性

| 属性名                    | 类型                            | 说明                             |
| ------------------------- | ------------------------------- | -------------------------------- |
| serverSocketChannel       | AsynchronousServerSocketChannel | JDK提供的AIO服务端核心类         |
| asynchronousChannelGroup  | AsynchronousChannelGroup        | JDK为AIO提供的线程池服务         |
| config                    | IoServerConfig                  | 存储AioQuickServer服务配置项     |
| aioReadCompletionHandler  | ReadCompletionHandler           | smart-socket提供的IO读回调处理类 |
| aioWriteCompletionHandler | WriteCompletionHandler          | smart-socket提供的IO写回调处理类 |
| bufferPool                | BufferPagePool                  | 内存池对象                       |

2.5.2 配置接口

| 方法                                                         | 说明                                  |
| ------------------------------------------------------------ | ------------------------------------- |
| public AioQuickServer setBannerEnabled(boolean bannerEnabled) | 服务启动时是否打印smart-socket banner |
| public AioQuickServer setThreadNum(int num)                  | Server服务线程数                      |
| public AioQuickServer setReadBufferSize(int size)            | 设置AioSession读缓存区长度            |
| public AioQuickServer setOption(SocketOption socketOption, V value) | 设置Socket的TCP参数配置               |

2.5.3 核心方法

**2.5.3.1 start：启动AIO服务端**

- 片段一

  ```java
  asynchronousChannelGroup = AsynchronousChannelGroup.withFixedThreadPool(config.getThreadNum(), new ThreadFactory() {
      byte index = 0;
  
      @Override
      public Thread newThread(Runnable r) {
           return new Thread(r, "smart-socket:AIO-" + (++index));
      }
  });
  ```

  初始化AIO服务的工作线程组并赋值于`AioQuickServer`成员属性`asynchronousChannelGroup`

- 片段二

  ```java
  this.serverSocketChannel = AsynchronousServerSocketChannel.open(asynchronousChannelGroup).bind(new InetSocketAddress(config.getPort()), 1000);
  ```

  这行代码很直观，打开AIO服务通道并绑定端口号，但要注意bind方法。`AsynchronousServerSocketChannel`提供了两个bind接口：bind(SocketAddress local)，bind(SocketAddress local, int backlog)

  如果调用bind(SocketAddress local)方法，AsynchronousServerSocketChannel内部实际上执行的是bind(SocketAddress local, 0)。然而backlog的值小于1时，JDK会将其默认设置为50。 backlog维护了连接请求队列长度，如果队列满时收到连接指示，则拒绝该连接。举个例子：backlog设置为50，当前有50连接请求过来，服务端还未执行这些连接请求的accept方法。此时再有一个连接请求过来，则会被拒绝连接。除非请求队列中的某个连接完成accept操作并释放出队列资源，服务器才可接受新的连接。

- 片段三

```java
serverSocketChannel.accept(null, new CompletionHandler<AsynchronousSocketChannel, Object>() {
    @Override
    public void completed(final AsynchronousSocketChannel channel, Object attachment) {
        serverSocketChannel.accept(attachment, this);
        createSession(channel);
    }

    @Override
    public void failed(Throwable exc, Object attachment) {
        LOGGER.warn(exc);
    }
});

protected void createSession(AsynchronousSocketChannel channel) {
	//连接成功则构造AIOSession对象
    AioSession<T> session = null;
    try {
    	session = aioSessionFunction.apply(channel);
        session.initSession();
    } catch (Exception e1) {
    	LOGGER.debug(e1.getMessage(), e1);
        if (session == null) {
        	try {
            	channel.shutdownInput();
        	} catch (IOException e) {
            	LOGGER.debug(e.getMessage(), e);
            }
            try {
            	channel.shutdownOutput();
            } catch (IOException e) {
				LOGGER.debug(e.getMessage(), e);
            }
            try {
            	channel.close();
            } catch (IOException e) {
            	LOGGER.debug("close channel exception", e);
            }
		} else {
        	session.close();
        }
	}
}
```

AIO通道服务监听客户端连接请求，一旦客户端连接上来则触发`CompletionHandler`回调。CompletionHandler首先要做的便是继续下一个请求的监听`serverSocketChannel.accept(attachment, this);`，然后构建本次连接的会话对象AioSession。 所有的AioSession共用aioReadCompletionHandler、aioWriteCompletionHandler对象，这样可以减少服务端产生的对象数。

**2.5.3.2 shutdown：停止AIO服务端**

AIO服务停止的逻辑很简单，关闭Channel通道，停止线程组。

```java
public final void shutdown() {
	try {
    	if (serverSocketChannel != null) {
        	serverSocketChannel.close();
            serverSocketChannel = null;
		}
	} catch (IOException e) {
    	LOGGER.warn(e.getMessage(), e);
	}
    if (!asynchronousChannelGroup.isTerminated()) {
    	try {
        	asynchronousChannelGroup.shutdownNow();
		} catch (IOException e) {
        	LOGGER.error("shutdown exception", e);
		}
	}
    try {
    	asynchronousChannelGroup.awaitTermination(3, TimeUnit.SECONDS);
	} catch (InterruptedException e) {
    	LOGGER.error("shutdown exception", e);
	}
}
```