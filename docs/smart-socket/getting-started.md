---
author: 三刀
time: 2021-02-27
---
# 快速上手
## :truck: 项目简介
smart-socket 是基于 AIO 技术实现的异步非阻塞通信框架，个人更喜欢称之为「通信微内核」。
因为，「框架」长久以来给人一种高级、复杂的感觉；而「微内核」则显得相对小巧、精致，在使用体验上会更加人性化。

smart-socket 支持使用 TCP/UDP 进行服务端、客户端的开发，能够覆盖所有通信开发场景。
#### 项目优势
- 通过阅读源码可以看到，smart-socket 没有高深的设计技巧，采用的是最朴实的表现手法。翻阅过 Netty 源码的读者可以相互比较一番。
- smart-socket 的学习门槛相当低，以致于我期望仅通过本页篇幅，便完成使用教程的分享。
- smart-socket 的性能表现非常出色，在三方评测[TechEmpower](https://www.techempower.com/benchmarks/#section=data-r20&hw=ph&test=plaintext&l=zik0vz-sf)中的 qps 甚至高出 netty 50% 以上。

#### 工程结构
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
  <artifactId>aio-core</artifactId>
  <version>1.5.6</version>
</dependency>
```

</CodeGroupItem>
<CodeGroupItem title="gradle">

```gradle
implementation group: 'org.smartboot.socket', name: 'aio-core', version: '1.5.5'
```

</CodeGroupItem>
</CodeGroup>

> aio-core 仅提供最纯粹的 TCP 通信服务，
>而 aio-pro 则包含了丰富的插件，包括：TLS/SSL、心跳、黑名单等，以及 UDP 通信和部分辅助开发的工具包。
>你可在需要的时候选择性使用。

## 🚀 使用
#### 通信协议
通信协议约定了服务端与客户端之间交互数据的识别规则，是通信中非常重要的一部分。

在短连接场景下，可以通过 EOF(即 readSize 等于 -1) 标志来定义完整数据包的内容。
虽然这种方式不规范，也不推荐，但不可否则确实简单、有效。

而在如今的万物互联时代下，长连接成了更为普遍的应用场景，链路复用是目前通信形式的主旋律。我们必须掌握正确的数据处理方式，以获得高效、准确的通信数据。

基于协议实现的编解码算法，必须成为每个通信开发人员的必备能力。
依照个人经验，判断一个程序员是否具备通信开发的能力，取决于他是否还会视半包、粘包为「问题」。
此处先不过多展开，有机会在专门通过一篇文章来与大家作进一步交流。

回到本节主题，我们设计了一个非常简单的协议用于演示 smart-socket 的使用方式。

:::: tip 协议规则
| |长度|说明|
|--|--|--|
|消息头|4字节|表示消息体长度|
|消息体|N字节|N：消息头对应的int数值长度|
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

:::: warning 注意
通信开发的核心是：「**面向协议编程**」。敲黑板，这是知识点！
::::

#### 服务端/客户端开发
服务端与客户端的开发，主要是基于`MessageProcess#process`实现接收到的消息的处理逻辑。
如果在此方法中调用了 session 的 `WriteBuffer#write`，将会在执行完毕后由 smart-socket 自动执行 flush。
而如果你是在`MessageProcess#process`之外的其他线程中执行数据输出，记得在write之后一定要调用一下 flush。

<CodeGroup>
<CodeGroupItem title="StringServer" active>

```java
public class StringServer {

    public static void main(String[] args) throws IOException {
        MessageProcessor<String> processor = new MessageProcessor<String>() {
            @Override
            public void process(AioSession session, String msg) {
                System.out.println("receive from client: " + msg);
                WriteBuffer outputStream = session.writeBuffer();
                try {
                    byte[] bytes = msg.getBytes();
                    outputStream.writeInt(bytes.length);
                    outputStream.write(bytes);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        };

        AioQuickServer server = new AioQuickServer(8888, new StringProtocol(), processor);
        server.start();
    }
}
```

</CodeGroupItem>
<CodeGroupItem title="StringClient">

```java
public class StringClient {

    public static void main(String[] args) throws IOException {
        MessageProcessor<String> processor = new MessageProcessor<String>() {
            @Override
            public void process(AioSession session, String msg) {
                System.out.println("receive from server: " + msg);
            }
        };
        AioQuickClient client = new AioQuickClient("localhost", 8888, new StringProtocol(), processor);
        AioSession session = client.start();
        WriteBuffer writeBuffer = session.writeBuffer();
        byte[] data = "hello smart-socket".getBytes();
        writeBuffer.writeInt(data.length);
        writeBuffer.write(data);
        writeBuffer.flush();
    }
}
```

</CodeGroupItem>
</CodeGroup>

smart-socket 默认的配置就具备了较好的性能表现，因此在实例化 AioQuickServer/AioQuickClient 对象之后大可直接调用 start 方法。
如果期望追究性能的最佳实践，我们会在之后的篇幅中作单独分享。