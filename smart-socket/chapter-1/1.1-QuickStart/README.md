## 快速上手
smart-socket 对 JDK 版本要求是 1.8 及以上，如果您还在用低版本 JDK，请先进行升级。

若对源码研究感兴趣的朋友可前往 smart-socket 的代码托管平台下载最新代码。

- 码云：https://gitee.com/smartboot/smart-socket

- GITHUB：https://github.com/smartboot/smart-socket

应用开发时推荐采用 maven 方式引用 smart-socket ，同时我们会尽力维持 smart-socket 新老版本的兼容性，便于您的迭代升级。

  ```xml
  <!-- 本书中的版本号可能不是最新的，以实际maven仓库中的版本号为准 -->
  <dependency>
      <groupId>org.smartboot.socket</groupId>
      <artifactId>aio-core</artifactId>
      <version>1.4.12</version>
  </dependency>
  ```

### 第一步：工程搭建
本章以 Maven 工程为例为大家演示基于 smart-socket 实现 socket 开发，
如果您已经有现成的工程仅需引入 pom.xml 依赖即可，否则请先建立一个项目工程。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>org.smartboot.socket</groupId>
    <artifactId>demo</artifactId>
    <version>1.0-SNAPSHOT</version>
    <dependencies>
        <dependency>
            <groupId>org.smartboot.socket</groupId>
            <artifactId>aio-core</artifactId>
            <version>1.4.12</version>
        </dependency>
    </dependencies>
</project>
```
smart-socket 的核心包：aio-core 模块不捆绑任何三方包依赖，所以即便是陈年老项目集成 smart-socket 也无需担心包冲突问题。

### 第二步：协议约定
用 Java 语言开发讲究的是面向对象编程，使用 Spring 时注重面向接口编程，而在通信这个领域，需要掌握**面向协议编程**。

自 smart-socket 开源以来收到的咨询问题中，绝大部分是因为没有正确理解"协议"的概念，以致写出来的代码无法正常通信。

协议在通信过程中扮演了"信息翻译官"的角色，制定了内存对象与网络节流之间的编解码规则。
所谓"编解码"，就是通常大家所理解的对象序列化/反序列化的过程。

**协议是序列化/反序列化的逻辑算法，而以代码的形式实现该算法就是"面向协议编程"。**

协议通常有两种分类：
1. 私有协议，由企业内部制定的通信标准，在行业中不具备普适性。
2. 共有协议，业务公认的通用标准，如：Http、MQTT、FTP等。

私有协议相较于共有协议会更简单一些，因为内部通信更具可控性，无需在协议层面制定过多约束。
而无论何种类型的协议，编解码的实现基本离不开：**消息头+消息体**、**特定标识结束符两种模式**。
只不过有些时候会是这两种模式混编的形式，需要开发人员活学活用，例如：Http协议，以两个回车换行符作为Header部分的结束标志；
如果存在消息体部分，则需要依赖"Content-Length"的数值。

本文会以最简单的**消息头+消息体**协议为大家做演示，基于该协议实现服务端与客户端的信息交互。
如下图所示，每个单元格表示一个字节，完整的消息由两部分组成：  
- 消息头：固定一个字节长度，其数值大小表示消息体的长度。因为消息头只有一个字节，意味着该协议支持的消息体长度上限为127。如需支持更长的消息，扩展消息头的字节数便可。
- 消息体：根据消息头中的数值决定消息体长度。当N等于1，消息体长度则为1；当N等于10，消息体长度则为10。

<img src='1.1_1.png' width='50%'/>

以字符串“smart”为例，按照上述协议进行编码后的结果为：

<img src='1.1_2.png' width='50%'/>

同样的协议可以有不同的解析算法，建议开发人员多花一些心思在算法的设计上，好的算法可以为通信性能带来质的提升。
#### 算法一
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

#### 算法二
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



### 第三步：服务端开发

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

### 第四步：客户端开发

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

### 第五步：启动运行
先启动服务端程序，启动成功后会在控制台打印如下信息，如启动失败请检查是否存在端口被占用的情况。

<img src='1.1_3.png' width='80%'/>

​接下来我们再启动客户端程序，客户端启动成功后会直接发送一个“Hello Server!”的消息给服务端，并通过消息处理器(MessageProcessor)打印所接受到的服务端响应消息“Hi Client!”。

<img src='1.1_4.png' width='80%'/>

<img src='1.1_5.png' width='80%'/>


至此，我们采用 smart-socket 顺利完成了简易的通信服务。如果对本章节某个知识点还不甚清楚，建议反复阅读加深理解或者上网搜索同类信息。当然，跟着示例动手敲一遍代码也是个不错的学习方式。