---
title: smart-socket
home: true
heroImage: https://portrait.gitee.com/uploads/avatars/namespace/266/798143_smartboot_1578989513.png!avatar100
heroText: smart-socket
action:
  - text: 进入我的开源 → 💡
    link: /smart-socket/getting-started
    type: primary
tagline: 从此，通信与众不同
features:
- title: 极简
  details: 用 1500 行代码重新定义通信框架，没有设计就是最好的设计。
- title: 易用
  details: 仅两个 API 的学习、使用成本，在你做好准备之际，便已掌握通信的真谛。
- title: 高性能
  details: 有一种速度，快到你不敢相信。
footer: Apache License 2.0 | Copyright © 2017-present 三刀
---


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
<CodeGroupItem title="StringProtocol"> 

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
</CodeGroupItem>
</CodeGroup>