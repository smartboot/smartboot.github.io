## 快速上手

JDK1.7是采用smart-socket进行开发的最低版本要求，如果您还在用JDK1.6或者更低的版本，请先升级您的JDK。
如果您从事的是Android通信开发，可能会面临低版本系统而无法使用smart-socket的问题，为此我们专为采用NIO技术开发了Android版本通信框架smart-ioc，因其不属于本章主角故暂不多做介绍。
除了JDK，建议事先准备一款顺手的IDE，并搭建好Maven环境，会有更高的开发效率。

smart-socket并不依赖除`slf4j-api`之外的其他第三方jar包，所以你可以很轻松的将它集成到你的项目中，无需担心会发生jar包冲突的问题。
得益于smart-socket代码量极少的特性，你甚至可以选择直接将源码拷贝到自己的项目中，维护一个专属于你的私有版smart-socket。
不过我们更推荐的是采用maven方式引入smart-socket，这样便可享受由原作者提供后续的版本升级服务。

- 码云 https://gitee.com/smartboot/smart-socket

- GITHUB https://github.com/smartboot/smart-socket

- Maven 

  ```xml
  <!-- 本书中的版本号可能不是最新的，以实际maven仓库中的版本号为准(https://mvnrepository.com/artifact/org.smartboot.socket/aio-core) -->
  <dependency>
      <groupId>org.smartboot.socket</groupId>
      <artifactId>aio-core</artifactId>
      <version>1.4.2</version>
  </dependency>
  ```
 
用户使用smart-socket更多的是用于服务端通信开发，因此可以先通过下图大致了解一下它的运行机制。
![线程模型](thread_model.png)
smart-socket服务端内部设有三类线程：
 - AcceptThread线程，接受客户端的连接请求，并将读回调的处理事件注册至Worker线程组。
 - WorkerThread线程池，用于处理各个连接会话的数据读回调。
 - BossThread线程池，该线程池中部分线程只处理写回调，部分线程可处理读/写回调。
 
smart-socket触发读回调后需要开发人员去处理消息解码与业务处理两个环节，也正是本章节要给大家介绍的内容。

### 1.1.1 工程搭建

本章以Maven工程为例为大家演示基于smart-socket实现socket开发，如果您已经有现成的工程仅需引入pom.xml依赖即可，否则请先建立一个项目工程。

<img src='2.1.1_1.png' width='80%'/>

从上图可以看到，我们在pom.xml中引入了smart-socket的核心包aio-core 1.4.2，最终工程衍生出来的依赖包仅slf4j-api。工程搭建完毕后，我们正式开始smart-socket的开发之旅。

### 1.1.2 协议约定

通信中所说的协议是指双方实体完成通信或服务所必须遵循的规则和约定。
协议定义了数据单元使用的格式，信息单元应该包含的信息与含义，连接方式，信息发送和接收的时序，从而确保网络中数据顺利地传送到确定的地方。

协议的制定，需要满足三要素：

1. 语法：约定通信的数据格式，编码，信号等级
2. 语义：在语法的基础上传递的数据内容
3. 定时规则：明确通信内容的时序

下面我们来定义一套简单的通信协议，并基于该协议实现服务端与客户端的信息交互。如下图所示，每个单元格表示一个Byte，整个消息由两部分组成：

- 消息头：固定一个byte长度
- 消息体：根据消息体中的数值决定消息体长度。当N等于1，消息体长度也则为1；当N等于10，消息体长度则为10。

<img src='2.1.2_1.png' width='40%'/>

按照上述规则，我们可以得出一个公式：消息长度=消息头长度+消息体长度，而消息体的长度取决于消息头中的数值。这就是所谓的协议，那根据这个协议，我们如何实现传输呢？

以字符串“socket”为例，按照上述协议进行编码后的结果为：

<img src='2.1.1_2.png' width='50%'/>

该协议采用smart-socket可用如下算法实现解码：

1. 标志当前buffer的postion位置；
2. 获取本次消息的消息体长度，position递增1位；
3. 判断当前已读的数据长度是否满足消息体长度；
4. **出现半包，数据不完整，重置标志位，并返回null终止本次解码**；
5. buffer中包含完整的消息体内容，则进行读取，postiton=postion+增加消息体长度;
6. 更新标志位
7. 将已读数据转换为字符串并返回，解码成功。

```java
public class StringProtocol implements Protocol<String> {
    public String decode(ByteBuffer buffer, AioSession<String> session) {
        buffer.mark(); // 1
        byte length = buffer.get(); // 2
        if (buffer.remaining() < length) { // 3
            buffer.reset(); // 4
            return null;
        }
        byte[] body = new byte[length];
        buffer.get(body); // 5
        buffer.mark(); // 6
        return new String(body); // 7
    }
}
```

同样的协议可以有不同的解析算法，不同算法的优劣各不相同。依旧以此协议为例，解析算法还能这样写：

1. 采用绝对定位的方式识别消息长度，该读取方式不会改变buffer的position值；
2. 判断当前buffer中待读取的数据长度是否满足消息体长度；不满足条件说明存在半包情况，返回null；
3. 若消息数据完整，构建用于存放数据的byte数组，通过执行buffer.get()设置数组长度。此get方法会对buffer的position作加1操作。
4. 再次执行buffer.get方法，以byte数组为入参接受消息体数据，此操作也会影响buffer的position；
5. 构建字符串对象，解码成功。

```java
public class StringProtocol implements Protocol<String> {
    @Override
    public String decode(ByteBuffer readBuffer, AioSession<String> session) {
        byte length = readBuffer.get(readBuffer.position());//1
        if (length+1 < readBuffer.remaining()) {//2
            return null;
        }
        byte[] b = new byte[readBuffer.get()];//3
        readBuffer.get(b);//4
        return new String(b);//5
    }
}
```

协议编解码是通信编程中非常重要的一个环节，如果读者朋友目前还不是特别能理解，那就谨记一件事：掌握协议编解码，通信就学会了80%，剩下的20%就是业务处理。根据作者以往的经验，很多初学者都被困扰在这个环节，一旦闯过这一关就柳暗花明了。

### 1.1.3 服务端

​启动服务端需要依赖AioQuickServer，实际应用中的运行参数调优也都是对AioQuickServer的接口进行操作，
此处先展示一下它的基本应用。

1. 构造服务端对象AioQuickServer。该类的构造方法有以下几个入参：
   - port，服务端监听端口号，客户度要请求该端口号才可连上服务端。
   - Protocol，协议解码类，将ByteBuffer中已读部分的byte数据还原成消息实体
   - MessageProcessor，消息处理器，对Protocol解析出来的消息进行业务处理
2. 启动Server服务

```java
public class Server {
    public static void main(String[] args) throws IOException {
        // 1
        AioQuickServer<String> server = new AioQuickServer<String>(8080, new StringProtocol(), new MessageProcessor<String>() {
            public void process(AioSession<String> session, String msg) {
                System.out.println("接受到客户端消息:" + msg);

                byte[] response = "Hi Client!".getBytes();
                byte[] head = {(byte) response.length};
                try {
                    session.writeBuffer().write(head);
                    session.writeBuffer().write(response);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }

            public void stateEvent(AioSession<String> session, StateMachineEnum stateMachineEnum, Throwable throwable) {
            }
        });
        //2
        server.start();
    }
}
```

上述代码中启动了端口号8080的服务端应用，当接收到客户端发送过来的数据时，服务端以StringProtocol进行协议解码，识别出客户度传递的字符串，随后将该消息转交给消息处理器MessageProcessor进行业务处理。

### 1.1.4 客户端

客户端的开发相较于服务端就简单很多，仅需操作一个连接会话（AioSession）即可，而服务端面向的是众多连接会话，在实际运用中还得具备并发思维与会话资源管理策略。客户端的开发步骤通常如下：

1. 连接服务端，取得连接会话（AioSession）
2. 发送请求消息
3. 处理响应消息
4. 关闭客户端

```java
public class Client {
    public static void main(String[] args) throws InterruptedException, ExecutionException, IOException {
        AioQuickClient<String> client = new AioQuickClient<String>("127.0.0.1", 8080, new StringProtocol(), new MessageProcessor<String>() {
            public void process(AioSession<String> session, String msg) {
                System.out.println(msg);
            }

            public void stateEvent(AioSession<String> session, StateMachineEnum stateMachineEnum, Throwable throwable) {
            }
        });

        AioSession<String> session = client.start();
        byte[] msgBody = "Hello Server!".getBytes();
        byte[] msgHead = {(byte) msgBody.length};
        try {
            session.writeBuffer().write(msgHead);
            session.writeBuffer().write(msgBody);
            session.writeBuffer().flush();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

### 1.1.5 启动运行

完成代码的编写后我们便可先后启动服务端、客户端程序，观察通信服务的运行结果。服务端启动成功后，会在控制台打印如下信息，如启动失败请检查是否存在端口被占用的情况。

<img src='2.1.5_1.png' width='80%'/>

​	接下来我们再启动客户端程序，客户端启动成功后会直接发送一个“Hello Server!”的消息给服务端，并通过消息处理器(MessageProcessor)打印所接受到的服务端响应消息“Hi Client!”。

<img src='2.1.5_2.png' width='80%'/>

<img src='2.1.5_3.png' width='80%'/>
