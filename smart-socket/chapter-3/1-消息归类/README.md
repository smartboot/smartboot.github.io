## 消息归类

在正式讲解之前我们先来对常见的几种消息进行分类，方便大家理解消化。后续在工作终于遇到问题时可按照本文定义的类别寻找相应的解决方法。**注意，此处讲的是“消息”，并非协议**，可能有人疑惑这两者的区别。用面向对象的思想简单理解就是：协议等同于class，消息就是class实例化后的object。为了便于区分，我们将消息分类以下几种：

### 1. 一类消息

服务端与客户端之间通信的所有消息大小都是在一定范围内的，AIOSession的readBuffer容量完全可以承载至少一个消息（前提是readBuffer的容量本身就设置了一个“合理”的数值）。这个“合理”的定义是ReadBuffer容量尽可能的满足绝大部分消息长度，且数值不会超过一定阈值。假设我们暂定readBuffer的容量阈值为1024，那么以下几种消息则属于一类消息：

- 所有消息长度都小于100，readBuffer设置容量为100

- 消息长度范围[0,512)，readBuffer容量设置为512

- 消息长度范围[0,1024),readBuffer容量设置为1024

**那如果消息长度范围为[0,2048)呢，我们是否可以通过将readBuffer容量设置为2048来满足我们的需求？**答案是否定的，如果绝大部分情况下消息大小在1024内，仅少量的消息大小在[1024,2048)区间内，扩大readBuffer容量会导致缓存空间利用率不高，这对于内存资源是一直浪费。所以存在此类情况的消息不属于“一类消息”。

### 2. 二类消息
假设readBuffer的容量阈值依旧是1024，绝大部分消息长度都未超过该范围，但是偶尔有几个消息长度超过了1024，此为二类消息。二类消息的定义还存在一个限制条件，尽管消息长度超过了1024，但是不可超的太离谱。当我们认为一个消息因太长，导致无法完整的进行内存存储时，我们将其定义为“三类消息”。

现在先介绍一下二类消息的处理方式，譬如我们定义的readBuffer容量为512byte，这已经满足99%消息的容量需求，但可能存在1%的消息长度会超过这阈值，我们姑且将这消息长度定义为600byte。针对此类消息，在解码时需要申请一个足够容量的临时缓冲区用于存放当前消息的字节数组，这个临时缓冲区可能是个固定长度的大缓冲区，又可能是个可自动扩容的缓冲区。

或许读者朋友会问，为什么smart-socket的readBuffer不提供自动扩容缓冲区的能力？那是由于框架无法识别消息的有效性，一旦遭遇恶意攻击或者用户滥用可扩容的读缓冲区，会造成内存方面不可预知的异常情况。smart-socket在设计之初便非常重视服务的稳定性，对于用户技能水平的要求也会略高于某些同类通信框架，由此也导致smart-socket的使用体验稍显逊色。如果要在迎合用户的使用体验与服务可靠性之间做一个选择，smart-socket选择后者，毕竟技能水平的提升每个从业人员必要的坚持。

几乎绝大多数协议或者协议中某个字段约定的解析规则就两种：定长协议、特定结束符解析。接下里分别介绍两种类型的处理方式，为了方便举例，我们将缓冲区容量定义为8byte。在处理二类消息的过程中我们会引用到aio-pro提供的解码器，所以读者朋友在使用前请先在pom.xml中引入aio-pro的依赖。

```xml
 <dependency>
     <groupId>org.smartboot.socket</groupId>
     <artifactId>aio-pro</artifactId>
     <version>1.4.X</version>
 </dependency>
```

**定长协议**

协议格式：

| 字段   | 含义                       | 长度     |
| ------ | -------------------------- | -------- |
| length | 消息头，其值表示消息体长度 | 1字节    |
| data   | 消息体                     | length值 |

<img src="protocol_1.png" width="60%"/>

根据上述协议，假设客户端发送的消息为：9abcdefjhi，第一位消息头”9“为byte类型，占用了1字节，后续的消息体“abcdefjhi”占用了9字节，所以服务端本次收到的消息长度为：10字节。由于读缓冲区的长度限制为8，则“9abcdefg”便填满了缓冲区，需要先将其读取完后再去读“hi”。编解码算法如下所示：

```java
public class FixedLengthProtocol implements Protocol<String> {

    @Override
    public String decode(ByteBuffer readBuffer, AioSession<String> session) {
        if (!readBuffer.hasRemaining()) {
            return null;
        }
        FixedLengthFrameDecoder fixedLengthFrameDecoder;
        if (session.getAttachment() != null) {
            fixedLengthFrameDecoder = session.getAttachment();
        } else {
            byte length = readBuffer.get();//获得消息体长度
            fixedLengthFrameDecoder = new FixedLengthFrameDecoder(length);//构建指定长度的临时缓冲区
            session.setAttachment(fixedLengthFrameDecoder);//缓存临时缓冲区
        }

        if (!fixedLengthFrameDecoder.decode(readBuffer)) {
            return null;//已读取的数据不足length，返回null
        }
        //数据读取完毕
        ByteBuffer fullBuffer = fixedLengthFrameDecoder.getBuffer();
        byte[] bytes = new byte[fullBuffer.remaining()];
        fullBuffer.get(bytes);
        session.setAttachment(null);//释放临时缓冲区
        return new String(bytes);
    }
}
```

定长消息的处理核心在于通过`FixedLengthFrameDecoder`开辟一块足够容量的临时缓冲区，待读取完整的有效数据后再进行后续的解码操作。

**特定结束符协议**

协议格式：

| 字段    | 含义   | 长度              |
| ------- | ------ | ----------------- |
| data    | 消息体 | 未知              |
| endFlag | 结束符 | endFlag的字节长度 |

<img src="protocol_2.png" width="60%"/>

相较于定长协议，此类协议在解码结束之前都无法知晓消息的长度，直到读取到结束符标志，则此前所有已读的数据方可组成一个完整的消息或消息字段。例如按行发送的字符串数据：`abc\r\n123\r\n`，以`\r\n`作为结束符发送了两个消息：`abc`，`123`。

```java
public class DelimiterProtocol implements Protocol<String> {

    //结束符\r\n
    private static final byte[] DELIMITER_BYTES = new byte[]{'\r', '\n'};

    @Override
    public String decode(ByteBuffer buffer, AioSession<String> session) {
        DelimiterFrameDecoder delimiterFrameDecoder;
        if (session.getAttachment() == null) {//构造指定结束符的临时缓冲区
            delimiterFrameDecoder = new DelimiterFrameDecoder(DELIMITER_BYTES, 64);
            session.setAttachment(delimiterFrameDecoder);//缓存解码器已应对半包情况
        } else {
            delimiterFrameDecoder = session.getAttachment();
        }

        //未解析到DELIMITER_BYTES则返回null
        if (!delimiterFrameDecoder.decode(buffer)) {
            return null;
        }
        //解码成功
        ByteBuffer byteBuffer = delimiterFrameDecoder.getBuffer();
        byte[] bytes = new byte[byteBuffer.remaining()];
        byteBuffer.get(bytes);
        session.setAttachment(null);//释放临时缓冲区
        return new String(bytes);
    }
}
```



### 3. 三类消息
此类消息的特点就是消息体非常大，已经不适合进行内存存储了。例如文件上传类的Http消息，此时完整的消息可能小则几兆，大的则以G为单位。不过本节讲解三类消息不会以Http为例，因为Http是个相对比较复杂的协议，在真实场景中可能是二类消息、三类消息的混合式解码。此处以定长协议来传输一个100MB的文件。

协议格式：

| 字段   | 含义                       | 长度     |
| ------ | -------------------------- | -------- |
| length | 消息头，其值表示消息体长度 | 4字节    |
| data   | 消息体                     | length值 |

100MB=104857600byte，转换成4字节的内存存储如下所示，后面的”?“代表文件的字节码。在识别出文件长度后，通过`AioSession.getInputStream`封装流对象并返回消息对象，之后在消息处理器中再获取BigObject的流对象便可将整个文件内容读取出来。需要注意的事，一旦使用了`AioSession.getInputStream`接口，则当前连接的数据读取便切换为同步阻塞模式，所以在完成读取或异常之前会占用当前线程资源，但优点以极低的内存消耗实现超大消息的解析。

<img src="protocol_3.png" width="60%"/>

```java
public class BigObject {
    private InputStream inputStream;

    public BigObject(InputStream inputStream) {
        this.inputStream = inputStream;
    }

    public InputStream getInputStream() {
        return inputStream;
    }
}

public class BigObjectProtocol implements Protocol<BigObject> {

    @Override
    public BigObject decode(ByteBuffer readBuffer, AioSession<BigObject> session) {
        if (readBuffer.remaining() < 4) {
            return null;
        }
        int fileSize = readBuffer.getInt();
        try {
            InputStream inputStream = session.getInputStream(fileSize);
            BigObject object = new BigObject(inputStream);
            return object;
        } catch (IOException e) {
            throw new DecoderException(e);
        }
    }
}

```

> **提问：如果通信的所有消息都固定在1MB的大小，则此类消息算哪一种？**