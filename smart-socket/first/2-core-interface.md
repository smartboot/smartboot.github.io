二、核心接口
===

作为一款框架，需要具备支持各类业务场景的能力，但框架本身又无法知晓实际业务场景如何，因此需要设计一套扩展性强且优雅的接口。smart-socket中核心的接口仅3个，用户在使用smart-socket进行二次开发时，也只需熟练掌握这三个接口的运用即可。接下来先介绍一下这三个接口`Protocol`、`MessageProcessor`、`Filter`中定义的方法，后续会详细说明smart-socket如何运用接口设计提供通信服务能力。
> 剧透：在基础篇中可无需关注Filter，您对smart-socket的使用不受其影响，在进阶篇中另有讲解。

#### Protocol
```
public interface Protocol<T> {
    /**
     * 对于从Socket流中获取到的数据采用当前Protocol的实现类协议进行解析
     *
     * @param data
     * @param session
     * @param eof     是否EOF
     * @return 本次解码所成功解析的消息实例集合, 返回null则表示解码未完成
     */
    public T decode(final ByteBuffer data, AioSession<T> session, boolean eof);

    /**
     * 将业务消息实体编码成ByteBuffer用于输出至对端。
     * <b>切勿在encode中直接调用session.write,编码后的byteuffer需交由框架本身来输出</b>
     *
     * @param msg
     * @param session
     * @return
     */
    public ByteBuffer encode(T msg, AioSession<T> session);
}
```
Protocol是一个泛型接口，`<T>`指的是业务消息实体类，smart-socket中不少地方都运用了泛型设计，其含义都代表消息类型。Protocol定义了消息编解码的接口，我们先来了解一下其中的两个方法`decode`、`encode`。
- decode    
消息解码，AIO的数据传输是以ByteBuffer为媒介的。在读取到数据并填充到ByteBuffer后，smart-socket会调用Protocol实现类的decode方法，并将ByteBuffer作为第一个参数传入，而第二个参数AioSession为当前Socket连接的会话对象，后续会详解。   
Protocol实现类从ByteBuffer中读取字节并按其协议规则进行消息解码，待解码完成后封装成业务对象并返回。不过实际情况下，已读取到并传入ByteBuffer的字节可能不足以完成消息解码（即所谓的：半包/拆包），Protocol实现类可根据其实际情况选择部分解码或等待ByteBuffer足以完成解码后再执行解码操作，不过在消息未完成解码的情况下必须返回`null`。
- encode    
消息编码，业务消息在输出至网络对端前，需要将其编码成字节流，也是以ByteBuffer为载体的。该方法的第一个参数泛型`T`便是业务消息对象。Protocol的实现类也得按照业务规则，将T指代的对象转为ByteBuffer并返回，smart-socket会将编码后的ByteBuffer输出。

----
#### MessageProcessor
```
public interface MessageProcessor<T> {

    /**
     * 处理接收到的消息
     *
     * @param session
     * @throws Exception
     */
    public void process(AioSession<T> session, T msg);

    /**
     * 状态机事件,当枚举事件发生时由框架触发该方法
     *
     * @param session
     * @param stateMachineEnum 状态枚举
     * @param throwable        异常对象，如果存在的话
     */
    void stateEvent(AioSession<T> session, StateMachineEnum stateMachineEnum, Throwable throwable);
}
```
MessageProcessor定义了消息处理器接口，smart-socket在通过Protocol完成消息解码后，会将消息对象交由MessageProcessor实现类进行业务处理。
- process    
消息处理器，smart-socket每接收到一个完整的业务消息，都会交由该处理器执行。
- stateEvent    
执行状态机，smart-socket内置了状态枚举`StateMachineEnum`。`MessageProcessor`实现类可在此方法中处理其关注的事件。

----

#### Filter
`Filter`是框架提供的通信层过滤器接口，用户可基于该接口开发一些扩展性服务。这个接口不常用，但利用的好的话可以帮助你获悉服务器的运行状况。
```
public interface Filter<T> {

    /**
     * 数据读取过滤,可用于统计流量
     *
     * @param session
     * @param readSize  本次解码读取的数据长度
     */
    public void readFilter(AioSession<T> session, int readSize);


    /**
     * 消息处理前置预处理
     *
     * @param session
     * @param msg 编解码后的消息实体
     */
    public void processFilter(AioSession<T> session, T msg);


    /**
     * 消息接受失败处理
     *
     * @param session
     * @param msg 编解码后的消息实体
     * @param e         本次处理异常对象
     */
    public void processFailHandler(AioSession<T> session, T msg, Throwable e);

    /**
     * 数据输出过滤,可用于统计流量
     *
     * @param session
     * @param writeSize  本次输出的数据长度
     */
    public void writeFilter(AioSession<T> session, int writeSize);

}
```
- readFilter    
读操作过滤，每当smart-socket发生读操作便会触发该方法。第一个参数AioSession为本次发生读事件的会话，第二个参数readSize为本次读取到的字节数
- processFilter    
消息处理过滤器，每一个业务消息在执行`MessageProcessor.process`之前都会先执行一遍`Filter.processFilter`
- processFailHandler    
当业务消息执行`processFilter`出现运行时异常时，会触发`processFailHandler`
- writeFilter    
写操作过滤，每当smart-socket发生写操作便会触发该方法。第一个参数AioSession为本次发生写事件的会话，第二个参数writeSize为本次输出的字节数
> smart-socket的运行并非强依赖Filter，因此用户未定义Filter也不会影响使用，该接口只是框架的一项附加功能。


