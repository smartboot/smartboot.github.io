六、客户端AioQuickClient
===

### 成员属性

| 属性名  | 类型 | 说明 |
|  ----  | ----| -----|
| socketChannel|AsynchronousSocketChannel|JDK提供的AIO客户端核心类|
|asynchronousChannelGroup|AsynchronousChannelGroup|JDK为AIO提供的线程池服务|
|config|IoServerConfig|存储AioQuickClient服务配置项|

### 配置型方法
| 方法 | 说明 |
|---|----|
|public AioQuickClient<T> connect(String host, int port)|设置远程连接的地址、端口|
|public AioQuickClient<T> setProtocol(Protocol<T> protocol)|注册协议编解码实现|
|public AioQuickClient<T> setFilters(Filter<T>[] filters)| 注册服务过滤器|
|public AioQuickClient<T> setProcessor(MessageProcessor<T> processor)|注册业务处理器|
|public AioQuickClient<T> setReadBufferSize(int size)|设置读缓冲区大小|
|public AioQuickClient<T> setWriteQueueSize(int size)|设置AioSession输出缓存区队列长度|

### 核心方法
#### 1、start(AsynchronousChannelGroup asynchronousChannelGroup)： 启动AIO客户端服务
```
public void start(AsynchronousChannelGroup asynchronousChannelGroup) throws IOException, ExecutionException, InterruptedException {
        this.socketChannel = AsynchronousSocketChannel.open(asynchronousChannelGroup);
        socketChannel.connect(new InetSocketAddress(config.getHost(), config.getPort())).get();
        //连接成功则构造AIOSession对象
        AioSession session = new AioSession<T>(socketChannel, config, new ReadCompletionHandler(), new WriteCompletionHandler(), false);
        session.initSession();
}
```
该方法支持外部传入服务线程组`AsynchronousChannelGroup`，当一个应用要启动多个客户端时，采用该方式有助于提升资源利用率。    
客户端连接服务器的过程并没有采用`CompletionHandler`的方案，是因为作者认为作为客户端，采用`Future`模式可以降低代码复杂度，接口功能更直观。因为对于业务来说，一旦start方法执行完毕，连接就必须是建立成功的。    
网络连接建立完毕之后，就会构建客户端的通信会话AioSession。
#### 2、start()
```
  public void start() throws IOException, ExecutionException, InterruptedException {
        this.asynchronousChannelGroup = AsynchronousChannelGroup.withFixedThreadPool(2, new ThreadFactory() {
            @Override
            public Thread newThread(Runnable r) {
                return new Thread(r);
            }
        });
        start(asynchronousChannelGroup);
    }
```
如果客户端要使用私有的线程组，可调用不带参数的start方法。单客户端只有读、写两类操作，所以线程大小设置为2足矣。且私有的线程组需要赋值于成员属性`asynchronousChannelGroup`,以便客户端执行shutdown时可以进行资源释放。
#### 3、shutdown()
代码简单，不解释
```
public void shutdown() {
        if (socketChannel != null) {
            try {
                socketChannel.close();
            } catch (IOException e) {
                LOGGER.catching(e);
            }
        }
        //仅Client内部创建的ChannelGroup需要shutdown
        if (asynchronousChannelGroup != null) {
            asynchronousChannelGroup.shutdown();
        }
    }
```

