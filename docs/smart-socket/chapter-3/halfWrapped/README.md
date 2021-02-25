处理方式也不难，**遵守以下两点即可**：

1. 根据协议解析每一个字段前，都要先确保剩余数据满足解析所需，不满足则终止该字段解析并返回 null。
2. 当已读的数据已满足一个完整业务消息所需时，立即构造该业务对象并返回，无需关心 ByteBuffer 中是否有剩余的数据。

考虑到有些读者对上述两点还不甚理解，我们通过两个示例来模拟通信过程中的半包、粘包场景。通信协议依旧是如1.1节中的定义的类型：

![2.1.2_1](docs/smart-socket/chapter-1/1.1-QuickStart/1.1_1.png)


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

  根据协议规定，完整的消息长度是字符串“smart-socket”字节数加一个字节的消息头，即13位。但因接收数据的 ByteBuffer 空间不足导致无法容纳整个消息，此时执行解码算法`decode`便等同于通信中的半包，运行后控制台打印如下：

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

  粘包出现于已读数据的部分超过了一个完整的消息长度。如 demo 所示，我们在 ByteBuffer 中放入了符合协议贵的两个完整消息，按照解码算法解析出第一个消息里立即返回`new String(body)`，待该消息处理完成后再进行下一次解码。故上述例子的控制台打印如下：

  ```
  完整消息长度:13
  消息解码成功:smart-socket
  消息解码成功:smart-socket
  ```

至此我们已经为大家介绍了 Protocol 的特性以及对于半包粘包的处理方式，当然真实场景下我们会面临更复杂的协议，对于半包粘包的处理方式也是多种多样，在通信协议章节在详细说明。
