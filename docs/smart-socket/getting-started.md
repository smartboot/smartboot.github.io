# 快速上手
## :truck: 项目简介
smart-socket 是基于 AIO 技术实现的异步非阻塞通信框架，个人更喜欢称之为「通信微内核」。
因为，「框架」长久以来给人一种高级、复杂的感觉；而「微内核」则显得相对小巧、精致，在使用体验上会更加人性化。

smart-socket 支持使用 TCP/UDP 进行服务端、客户端的开发，能够覆盖所有通信开发场景。
### 项目优势
- 通过阅读源码可以看到，smart-socket 没有高深的设计技巧，采用的是最朴实的表现手法。翻阅过 Netty 源码的读者可以相互比较一番。
- smart-socket 的学习门槛相当低，以致于我期望仅通过这一页内容的篇幅，便完成使用教程的分享。
- smart-socket 的性能表现非常出色，在三方评测[TechEmpower](https://www.techempower.com/benchmarks/#section=data-r20&hw=ph&test=plaintext&l=zik0vz-sf)中的 qps 甚至高出 netty 50% 以上。

### 工程结构
smart-socket 项目工程内分为四个模块，下面为大家展示他们之间的关系，方便大家对照理解。
```markdown
. → 项目仓库主目录
├── smart-socket-parent → 项目主模块
│ │
│ └── pom.xml
│
├── aio-core → 项目基础子模块，仅包含 TCP 的 Server、Client 通信服务，以及内存池。
│
├── aio-pro → 项目高级子模块，提供便于开发所需的高级封装，同时附带 UDP 通信能力。
│
├── aio-example → 存放 smart-socket 的使用示例，学习过程中可供参考。
│
└── pom.xml
```

## 🛠 安装
:::: tip 提示
依赖版本号以实际 maven 仓库中的最新版为准！
::::

<CodeGroup>
<CodeGroupItem title="maven" active>
```xml
<dependency>
  <groupId>org.smartboot.socket</groupId>
  <artifactId>aio-pro</artifactId>
  <version>1.5.5</version>
</dependency>
```
</CodeGroupItem>
<CodeGroupItem title="gradle">

```gradle
implementation group: 'org.smartboot.socket', name: 'aio-pro', version: '1.5.5'
```
</CodeGroupItem>
</CodeGroup>

## 🚀 使用
### 通信协议
:::: warning 注意
通信开发的核心是：「**面向协议编程**」。敲黑板，这是知识点！
::::
```java
public class StringProtocol implements Protocol<String> {

    @Override
    public String decode(ByteBuffer readBuffer, AioSession session) {
        int remaining = readBuffer.remaining(); 
        if (remaining < Integer.BYTES) {   
            return null;
        }
        readBuffer.mark();
        int length = readBuffer.getInt();
        if (length > readBuffer.remaining()) {
            readBuffer.reset();
            return null;
        }
        byte[] b = new byte[length];
        readBuffer.get(b);
        readBuffer.mark();
        return new String(b);
    }
}
```

### 服务端开发

服务端开发主要分两步：  
1. 构造服务端对象AioQuickServer。该类的构造方法有以下几个入参：
   - port，服务端监听端口号；
   - Protocol，协议解码类，正是上一步骤实现的解码算法类：StringProtocol；
   - MessageProcessor，消息处理器，对Protocol解析出来的消息进行业务处理。
   因为只是个简单示例，采用匿名内部类的形式做演示。实际业务场景中可能涉及到更复杂的逻辑，开发同学自行把控。
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

上述代码中启动了端口号8080的服务端应用，当接收到客户端发送过来的数据时，服务端以StringProtocol进行协议解码，识别出客户端传递的字符串，随后将该消息转交给消息处理器MessageProcessor进行业务处理。

### 客户端开发

客户端的开发相较于服务端就简单很多，仅需操作一个连接会话（AioSession）即可，而服务端面向的是众多连接会话，在实际运用中还得具备并发思维与会话资源管理策略。客户端的开发步骤通常如下：

1. 连接服务端，取得连接会话（AioSession）
2. 发送请求消息
3. 处理响应消息
4. 关闭客户端，若是长连接场景无需关闭

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

### 启动运行
先启动服务端程序，启动成功后会在控制台打印如下信息，如启动失败请检查是否存在端口被占用的情况。

<img src='docs/smart-socket/chapter-1/1.1-QuickStart/1.1_3.png' width='80%'/>

​接下来我们再启动客户端程序，客户端启动成功后会直接发送一个“Hello Server!”的消息给服务端，并通过消息处理器(MessageProcessor)打印所接受到的服务端响应消息“Hi Client!”。

<img src='docs/smart-socket/chapter-1/1.1-QuickStart/1.1_4.png' width='80%'/>

<img src='docs/smart-socket/chapter-1/1.1-QuickStart/1.1_5.png' width='80%'/>

## 最后
至此，我们已经完成了一个简易的通信服务。如果对本章节某个知识点还不甚清楚，建议反复阅读加深理解或者上网搜索同类信息。
当然，跟着示例动手敲一遍代码也是个不错的学习方式。
