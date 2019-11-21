二类消息
===

重申一下“二类消息”的定义：长度超过了预先为Socket连接分配的读缓冲区大小的消息，即readBufferSize:512byte，接收到的实际MessageSize:600byte。针对此类消息，在解码时需要申请一个足够容量的临时缓冲区用于存放当前消息的字节数组。

然而smart-socket本身并不提供扩容读缓存的功能，是由于框架无法识别消息的有效性，一旦遭遇恶意攻击或者用户滥用可扩容的读缓冲区，会造成内存方面不可预知的异常情况。smart-socket在设计之初便非常重视服务的稳定性，对于用户技能水平的要求也会略高于某些同类通信框架，由此也导致smart-socket的使用体验稍显逊色。如果要在迎合用户的使用体验与服务可靠性之间做一个选择，smart-socket选择后者。至于如何处理好“二类消息”的编解码，我们也提供了一些解决方案以供参考。

> 以下案例会对实际场景中的协议进行简化处理，方便大家理解。首先，我们将读缓冲区设定为8字节。

### 定长协议
协议格式：

|字段|含义|长度|
| --- | --- | --- |
| length|消息头，其值表示消息体长度|4字节|
| data | 消息体 |length值|
根据上述协议，假设客户端发送的消息为：9abcdefjhi，第一位消息头”9“为int类型，占用了4字节，后续的消息体“abcdefjhi”占用了9字节，所以服务端本次收到的消息长度为：13字节。由于读缓冲区的长度限制为8，则“9abcd”便填满了缓冲区，需要先将其读取完后再去读“efjhi”。编解码算法如下所示：

```
public class FixedLengthProtocol implements Protocol<String> {
    private static final int INT_BYTES = 4;//int类型的字节长度

    @Override
    public String decode(ByteBuffer readBuffer, AioSession<String> session, boolean eof) {
        if (session.getAttachment() == null && readBuffer.remaining() < INT_BYTES) {//首次解码不足四字节，无法知晓消息长度
            return null;
        }
        FixedLengthFrameDecoder fixedLengthFrameDecoder;
        if (session.getAttachment() != null) {
            fixedLengthFrameDecoder = (FixedLengthFrameDecoder) session.getAttachment();
        } else {
            int length = readBuffer.getInt();//获得消息体长度
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

    @Override
    public ByteBuffer encode(String msg, AioSession<String> session) {
        byte[] bytes = msg.getBytes();
        ByteBuffer buffer = ByteBuffer.allocate(INT_BYTES + bytes.length);
        buffer.putInt(bytes.length);//消息头
        buffer.put(bytes);//消息体
        buffer.flip();
        return buffer;
    }
}
```
### 特定结束符协议
协议格式：

|字段|含义|长度|
| --- | --- | --- |
| data|消息体|未知|
| endFlag | 结束符 |endFlag的字节长度|
相较于定长协议，此类协议在解码结束之前都无法知晓消息的长度,直到读取到结束符标志，则此前所有已读的数据方可组成一个完整的消息或消息字段。例如按行发送的字符串数据：`abc\r\n123\r\n`，以`\r\n`作为结束符发送了两个消息：`abc`，`123`。

```
public class DelimiterProtocol implements Protocol<String> {

    //结束符\r\n
    private static final byte[] DELIMITER_BYTES = new byte[]{'\r', '\n'};

    @Override
    public String decode(ByteBuffer buffer, AioSession<String> session, boolean eof) {
        DelimiterFrameDecoder delimiterFrameDecoder;
        if (session.getAttachment() == null) {//构造指定结束符的临时缓冲区
            delimiterFrameDecoder = new DelimiterFrameDecoder(DELIMITER_BYTES, 64);
            session.setAttachment(delimiterFrameDecoder);//缓存解码器已应对半包情况
        } else {
            delimiterFrameDecoder = (DelimiterFrameDecoder) session.getAttachment();
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

    @Override
    public ByteBuffer encode(String msg, AioSession<String> session) {
        byte[] bytes = msg.getBytes();
        ByteBuffer buffer = ByteBuffer.allocate(bytes.length + DELIMITER_BYTES.length);
        buffer.put(bytes).put(DELIMITER_BYTES);
        buffer.flip();
        return buffer;
    }
}
```

