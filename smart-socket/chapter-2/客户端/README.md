
## 客户端AioQuickClient

在过去我不曾觉得框架对于提供客户端API有多重要，因为即便采用最传统的BIO技术也能满足我们的业务所需。
直到从事互联网开行业后才意识到一个问题，随着业务的发展会在系统中存在大量的RPC服务，所以服务调用方可能会创建几十甚至上百个客户端连接。
如果继续采用BIO技术，单单通信所需的线程资源都会对系统运行造成巨大负担。
而运用AIO技术可以实现客户端通信线程资源共享，仅需少量线程便可支持几百上千的客户端连接。

smart-socket提供的客户端服务AioQuickClient在代码实现上比较简单，并且尽量让必要的事情都在构造方法中完成，核心的几个要素只有host、port、protocol、messageProcessor。
如仅需以下几行代码便完成客户端的创建、通信、关闭。

```java
public class IntegerClient {
    public static void main(String[] args) throws Exception {
        AioQuickClient<Integer> aioQuickClient = new AioQuickClient<Integer>("localhost", 8888, new IntegerProtocol(), new IntegerClientProcessor());
        AioSession<Integer> session = aioQuickClient.start();
        session.writeBuffer().writeInt(1);
        Thread.sleep(1000);
        aioQuickClient.shutdown();
    }
}
```

在smart-socket中实现客户端`AioQuickClient`功能的代码量非常少，最复杂的逻辑也就是start方法。
在客户端中存在两个start方法，两者的区别在于线程资源是独享还是共享的。值得注意的是，执行start后会返回当前客户端的AioSession对象，如此一来建立创建成功后可直接进行数据输出。

```java

public final AioSession<T> start() throws IOException, ExecutionException, InterruptedException {
	this.asynchronousChannelGroup = AsynchronousChannelGroup.withFixedThreadPool(2, new ThreadFactory() {
            @Override
            public Thread newThread(Runnable r) {
                return new Thread(r);
            }
        });
        return start(asynchronousChannelGroup);
    }

public AioSession<T> start(AsynchronousChannelGroup asynchronousChannelGroup) throws IOException, ExecutionException, InterruptedException {
    AsynchronousSocketChannel socketChannel = AsynchronousSocketChannel.open(asynchronousChannelGroup);
    if (bufferPool == null) {
        bufferPool = new BufferPagePool(IoServerConfig.getIntProperty(IoServerConfig.Property.CLIENT_PAGE_SIZE, 1024 * 256), 1, IoServerConfig.getBoolProperty(IoServerConfig.Property.CLIENT_PAGE_IS_DIRECT, true));
    }
    //set socket options
    if (config.getSocketOptions() != null) {
        for (Map.Entry<SocketOption<Object>, Object> entry : config.getSocketOptions().entrySet()) {
            socketChannel.setOption(entry.getKey(), entry.getValue());
        }
    }
    //bind host
    if (localAddress != null) {
        socketChannel.bind(localAddress);
    }
    socketChannel.connect(new InetSocketAddress(config.getHost(), config.getPort())).get();
    //连接成功则构造AIOSession对象
    session = new AioSession<T>(socketChannel, config, new ReadCompletionHandler<T>(), new WriteCompletionHandler<T>(), bufferPool.allocateBufferPage());
    session.initSession();
    return session;
}

```

