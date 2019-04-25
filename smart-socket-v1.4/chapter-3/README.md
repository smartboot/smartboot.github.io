
# 第三章 smart-socket源码解析

​	smart-socket的源码部分主要分三部分：基础通信、TLS/SSL通信、内存池。本章只分享基础通信部分的内容，这部分对于绝大多数的开发人员都是比较有意义的。而TLS/SSL比较复杂，作者自认很难以通俗易懂的文字给读者讲解清楚，对于高级开发人员而言通过看源码应该能领悟一些门道，故本书暂不提及此部分内容。内存池是smart-socket 1.4 加入的新特性，是作者在研究 Netty 内存池却始终无法领悟其精髓后决定自研的一套模型，在第四章中有详细的说明。

​	本章节筛选了smart-socket源码中几个关键节点进行阐述，或许会让您看起来觉得有些零散，通过下图希望帮助读者事先对smart-socket整体结构有个大致的印象，假如能将本章节内容与smart-socket源码结合起来阅读会有更好的效果。

![image-20190112180507926](aio_core_uml.png)

### 3.1  核心接口

​	业界有句话叫“一流的卖标准、二流的卖技术、三流的卖产品”，如果说smart-socket的技术价值仅算二流水准的话，那么我们为其精心设计的接口有望助其跻身一流行列。基于smart-socket进行通信开发的主要工作量便在于两个接口的实现：`Protocol`、`MessageProcessor`。

​	两个接口各自都有明确的分工，Protocol负责解析数据形成消息实体，MessageProcessor负责对Protocol解析出来的消息进行业务处理。当然，你也可以在Protocol中一次性完成解析、业务处理，又或者将Protocol当个摆设，所有事情集中在MessageProcessor完成。smart-socket不限制你实现功能的自由性，只是提供一个更规范、更合理的建议，最终决定权还是在用户的手中。

**3.1.1 Protocol**

```java
public interface Protocol<T> {
    /**
     * 对于从Socket流中获取到的数据采用当前Protocol的实现类协议进行解析。
     *
     * <p>
     * 实现的解码方法要尽可能读取readBuffer已有的数据。若不及时解析并最终导致readBuffer无可用空间（即readBuffer.remaining==0），smart-socket会反复触发decode方法形成类似死循环的效果。
     * </p>
     *
     * @param readBuffer 待处理的读buffer
     * @param session    本次需要解码的session
     * @return 本次解码成功后封装的业务消息对象, 返回null则表示解码未完成
     */
    T decode(final ByteBuffer readBuffer, AioSession<T> session);
}
```

​	Protocol是一个泛型接口，`<T>`指的是业务消息实体类，smart-socket中不少地方都运用了泛型设计，其含义都代表数据解码后封装的消息类型。Protocol中只定义了一个方法`decode`。

​	decode（消息解码），AIO的数据传输是以ByteBuffer为媒介的。所有读取到的字节数据都会填充在ByteBuffer中并以事件回调的形式触发Protocol#decode()方法。所以我们实现的decode算法就是ByteBuffer对象转化为业务消息\<T\>的过程。

​	需要强调一点，读者朋友请不要把解码想的很简单，令人“深恶痛绝”的半包/粘包就是在这个环节需要应对的。处理方式也不难，**遵守以下两点即可**：

1. 根据协议解析每一个字段前，都要先确保剩余数据满足解析所需，不满足则终止该字段解析并返回null。
2. 当已读的数据已满足一个完整业务消息所需时，立即构造该业务对象并返回，无需关心ByteBuffer中是否有剩余的数据。

考虑到有些读者对上述两点还不甚理解，我们通过两个示例来模拟通信过程中的半包、粘包场景。通信协议依旧是如2.1节中的定义的类型：

![2.1.2_1](../chapter-2/2.1-基础应用/2.1.2_1.png)

- 半包

  ```java
  public class StringProtocol implements Protocol<String> {
      public static void main(String[] args) {
          StringProtocol protocol = new StringProtocol();
          byte[] msgBody = "smart-socket".getBytes();
          byte msgHead = (byte) msgBody.length;
          System.out.println("完整消息长度:" + (msgBody.length + 1));
          ByteBuffer buffer = ByteBuffer.allocate(msgBody.length);
          buffer.put(msgHead);
          buffer.put(msgBody, 0, buffer.remaining());
          buffer.flip();
          System.out.println(protocol.decode(buffer, null));
      }
  
      public String decode(ByteBuffer buffer, AioSession<String> session) {
          buffer.mark(); 
          byte length = buffer.get(); 
          if (buffer.remaining() < length) { 
              System.out.println("半包：期望长度:" + length + " ,实际剩余长度:" + buffer.remaining());
              buffer.reset(); 
              return null;
          }
          byte[] body = new byte[length];
          buffer.get(body); 
          buffer.mark(); 
          return new String(body); 
      }
  }
  ```

  根据协议规定，完整的消息长度是字符串“smart-socket”字节数加一个字节的消息头，即13位。但因接收数据的ByteBuffer空间不足导致无法容纳整个消息，此时执行解码算法`decode`便等同于通信中的半包，运行后控制台打印如下：

  ```
  完整消息长度:13
  半包：期望长度:12 ,实际剩余长度:11
  null
  ```

- 粘包

  ```java
  public class StringProtocol implements Protocol<String> {
      public static void main(String[] args) {
          StringProtocol protocol = new StringProtocol();
          byte[] msgBody = "smart-socket".getBytes();
          byte msgHead = (byte) msgBody.length;
          System.out.println("完整消息长度:" + (msgBody.length + 1));
          ByteBuffer buffer = ByteBuffer.allocate((msgBody.length + 1) * 2);
          //第一个消息
          buffer.put(msgHead);
          buffer.put(msgBody);
          //第二个消息
          buffer.put(msgHead);
          buffer.put(msgBody);
          buffer.flip();
          String str = null;
          while ((str = protocol.decode(buffer, null)) != null) {
              System.out.println("消息解码成功:"+str);
          }
      }
  
      public String decode(ByteBuffer buffer, AioSession<String> session) {
          if (!buffer.hasRemaining()) {
              return null;
          }
          buffer.mark();
          byte length = buffer.get();
          if (buffer.remaining() < length) {
              System.out.println("半包：期望长度:" + length + " ,实际剩余长度:" + buffer.remaining());
              buffer.reset();
              return null;
          }
          byte[] body = new byte[length];
          buffer.get(body);
          buffer.mark();
          return new String(body);
      }
  }
  ```

  粘包出现于已读数据的部分超过了一个完整的消息长度。如demo所示，我们在ByteBuffer中放入了符合协议贵的两个完整消息，按照解码算法解析出第一个消息里立即返回`new String(body)`，待该消息处理完成后再进行下一次解码。故上述例子的控制台打印如下：

  ```
  完整消息长度:13
  消息解码成功:smart-socket
  消息解码成功:smart-socket
  ```

至此我们已经为大家介绍了Protocol的特性以及对于半包粘包的处理方式，当然真实场景下我们会面临更复杂的协议，对于半包粘包的处理方式也是多种多样，在通信协议章节在详细说明。

> 如果您选用的smart-socket版本低于v1.4，在该接口中还有一个配套的encode方法。

**2.2.1.2 MessageProcessor**

```java
public interface MessageProcessor<T> {

    /**
     * 处理接收到的消息
     *
     * @param session 通信会话
     * @param msg     待处理的业务消息
     */
    void process(AioSession<T> session, T msg);

    /**
     * 状态机事件,当枚举事件发生时由框架触发该方法
     *
     *
     * @param session          本次触发状态机的AioSession对象
     * @param stateMachineEnum 状态枚举
     * @param throwable        异常对象，如果存在的话
     * @see StateMachineEnum
     */
    void stateEvent(AioSession<T> session, StateMachineEnum stateMachineEnum, Throwable throwable);
}
```

Protocol侧重于通信层的数据解析，而MessageProcessor则负责应用层的消息业务处理。定义了消息处理器接口，smart-socket在通过Protocol完成消息解码后，会将消息对象交由MessageProcessor实现类进行业务处理。

- process
  消息处理器，smart-socket每接收到一个完整的业务消息，都会交由该处理器执行。
- stateEvent
  执行状态机，smart-socket内置了状态枚举`StateMachineEnum`。`MessageProcessor`实现类可在此方法中处理其关注的事件。

### 3.2 状态机StateMachineEnum

smart-socket中引入了状态机的概念，状态机的存在不会决策smart-socket对于通信的事件处理，但会在特定事件发生之时通知消息处理器`MessageProcessor#stateEvent`。目前已有的状态枚举为：

| 状态枚举          | 说明                                                         |
| ----------------- | ------------------------------------------------------------ |
| NEW_SESSION       | 网络连接建立时触发，连接建立时会构建传输层的AioSession，如果业务层面也需要维护一个会话，可在此状态机中处理 |
| INPUT_SHUTDOWN    | 数据读取完毕时触发，即传统意义中的`read()==-1`               |
| INPUT_EXCEPTION   | 读数据过程中发生异常时触发此状态机                           |
| OUTPUT_EXCEPTION  | 写数据过程中发生异常时触发此状态机                           |
| SESSION_CLOSING   | 触发了AioSession.close方法，但由于当前AioSession还有未完成的事件，会进入SESSION_CLOSING状态 |
| SESSION_CLOSED    | AioSesson完成close操作后触发此状态机                         |
| PROCESS_EXCEPTION | 业务处理异常                                                 |

状态机伴贯穿了通信服务的整个生命周期，在这个过程中不同事件的发生会触发不同的状态机。通信事件与状态机的关系如下图所示。

<img src='2.2.2_1.png' width='90%'/>

<center>图2.2.2</center>

状态机相对于整个通信环境的各个节点只是一个旁观者，它见证了各个事件的发生，却无力扭转事件的发展方向。状态机本质其实跟大家所认知的过滤器、拦截器有点类似，那为什么smart-socket要如此设计呢？想想一下如果我们按照过滤器的设计思路，其形态会如下所示：

```java
public interface Filter{
    void newSession(AioSesion session);
    void processException(AioSession session,Throwable throwable);
    void decodeExcepton(AioSession session,Throwable throwable);
    void inputException(AioSession session,Throwable throwable);
    void outputException(AioSession session,Throwable throwable);
    void sessionClosing(AioSession session);
    void sessionClosed(AioSession session);
}
```

这样的设计存在以下缺陷：

1. 对实现类不友好；也许我只想处理newSession，却不得不保留其余方法的空实现；
2. 无法平滑升级；加入新版本中加入新的事件类型，老版本代码需要全部更改；

而采用状态机模式，不仅解决了上述问题，还为通信服务的多元化扩展带了便利。例如IM场景下，我们在NEW_SESSION状态机中收集Session集合，在消息处理时很容易就能实现消息群发；当某个用户断线后，我们及时在状态机SESSION_CLOSED中感知到并更新Session集合中的会话状态，甚至可以群发消息给所有用户“某某人掉线了”。这些通信状态和业务相结合的场景， 用状态机能很好的得以解决。最后奉上一段粗糙的伪代码，读者自行领悟。

```java
public class IMProcessor implements MessageProcessor<Message> {
    private LinkedBlockingQueue sessions = new LinkedBlockingQueue();

    public void process(AioSession<String> session, Message msg) {
        for(AioSession otherSession:sessions){
            if(otherSession==session){
                continue;
            }
            sendMessage(otherSession,session+"群发送消息："+msg);
        }
    }

    public void stateEvent(AioSession<Message> session, StateMachineEnum state, Throwable throwable) {
        switch (state) {
            case NEW_SESSION:
                sessions.add(session);
                break;
            case SESSION_CLOSED:
                sessions.remove(session);
                break;
        }
    }
}
```



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

### 3.4 客户端AioQuickClient

​	在过去我不曾觉得框架对于提供客户端API有多重要，因为即便采用最传统的BIO技术也能满足我们的业务所需。直到从事互联网开行业后才意识到一个问题，随着业务的发展会在系统中存在大量的RPC服务，所以服务调用方可能会创建几十甚至上百个客户端连接。如果继续采用BIO技术，单单通信所需的线程资源都会对系统运行造成巨大负担。而运用AIO技术可以实现客户端通信线程资源共享，仅需少量线程便可支持几百上千的客户端连接。

​	smart-socket提供的客户端服务AioQuickClient在代码实现上比较简单，并且尽量让必要的事情都在构造方法中完成，核心的几个要素只有host、port、protocol、messageProcessor。如仅需以下几行代码便完成客户端的创建、通信、关闭。

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

​	翻阅一下smart-socket源码可知AioQuickClient代码量非常少，最复杂的逻辑也就是start方法。而在客户端中存在两个start方法，两者的区别在于线程资源是独享还是共享的。值得注意的是，执行start后会返回当前客户端的AioSession对象，如此一来建立创建成功后可直接进行数据输出。

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
    //set socket options
    if (config.getSocketOptions() != null) {
        for (Map.Entry<SocketOption<Object>, Object> entry : config.getSocketOptions().entrySet()) {
        	socketChannel.setOption(entry.getKey(), entry.getValue());
    	}
    }
    //bind host
    socketChannel.connect(new InetSocketAddress(config.getHost(), config.getPort())).get();
    //连接成功则构造AIOSession对象
	session = new AioSession<T>(socketChannel, config, new ReadCompletionHandler<T>(), new WriteCompletionHandler<T>(), bufferPool.allocateBufferPage());
    session.initSession();
    return session;
}
```

### 3.5 通信会话AioSession

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

​	写操作的回调代码实现相对简单很多，但事实上却是处理难度最大的。因为写操作是个主动行为，我们不可预知用户在何时会写入数据，而写缓冲区中积压的数据又要依靠smart-socket将其输出到网络对端，故此处就存在并发的情况。如果出现多个线程同时触发write操作会导致WritePendingException，在AioSession中使用了信号量Semaphore完成了同步控制，实现了数据有序的输出。smart-socket的写回调会执行`writeToChannel`方法，而这信号量在之前已经通过其他途径被锁定，此处暂且不提。回调的处理逻辑为：

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

## 2.4 总结

​	源码永远是最好的教程，善于读源码和debug朋友掌握smart-socket完全是轻而易举的事。源码是作者设计理念最直观的展现，这也是开源的魅力所在。"talk is cheap show me the code"，开源让技术难题的探讨变得更加务实，正如smart-socket，在您看完源码后心中对它都会有一个定论。在作者看来，smart-socket切切实实降低了通信开发学习门槛，也保障了服务的高性能、高可用。如果读者朋友对源码中某些部分的设计存在疑虑，也欢迎与作者保持沟通。


