
## 2.2 Spring集成smart-socket

​	smart-socket为我们的通信服务提供了良好的解决方案，但更多时候我们的系统工程并不仅仅只有通信，而是一系列服务类型的混合体。比如我们将一个Web工程放置于Tomcat为用户提供Http服务的同时，在后台还开放了RPC服务供第三方应用调用，而且整个工程采用的是Spring框架进行开发。此时就会涉及到smart-socket与Spring的集成问题，需要将通信服务实例交由Spring进行管理。

​	此处以xml配置和注解两种方式为大家介绍smart-socket于spring的集成方案，前期需要做的准备工作就是先搭建一个spring工程，并引入smart-socket依赖，pom.xml配置如下图。

<img src='spring-example-1.png' width='80%'/>

### 2.2.1 xml配置化启动服务

​	通过2.1章节我们了解到smart-socket启用通信服务依赖两个关键的要素：Protocol、MessageProcessor，在spring的集成应用中我们依旧需要定义它们的实现类。接下来我们会以服务端场景为例给大家演示，如果您是要进行客户端通信服务与Spring的集成，请按同样的操作方式替换一下相应的配置即可。

- 定义协议类

  ```java
  public class StringProtocol implements Protocol<String> {
      @Override
      public String decode(ByteBuffer readBuffer, AioSession<String> session) {
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

- 定义处理器

  ```java
  public class ServerProcessor implements MessageProcessor<String> {
      @Override
      public void process(AioSession<String> session, String msg) {
          BufferOutputStream outputStream = session.getOutputStream();
          byte[] bytes = msg.getBytes();
          outputStream.writeInt(bytes.length);
          try {
              outputStream.write(bytes);
          } catch (IOException e) {
              e.printStackTrace();
          }
      }
  
      @Override
      public void stateEvent(AioSession<String> session, StateMachineEnum stateMachineEnum, Throwable throwable) {
      }
  }
  ```

准备工作就绪后，我们需要在application.xml配置它们的实例bean，并将其引用至AioQuickServer的bean配置。因为`AioQuickServer`的构造方法都是带参数的，所以配置bean的时候需要用到标签`constructor-arg`。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        http://www.springframework.org/schema/beans/spring-beans.xsd">

    <bean name="protocol" class="org.smartboot.example.spring.StringProtocol"/>

    <bean name="messageProcessor" class="org.smartboot.example.spring.ServerProcessor"/>

    <bean name="aioQuickServer" class="org.smartboot.socket.transport.AioQuickServer" init-method="start" destroy-method="shutdown">
        <constructor-arg index="0" value="8080"/>
        <constructor-arg index="1" ref="protocol"/>
        <constructor-arg index="2" ref="messageProcessor"/>
    </bean>
</beans>
```

如此一来只需启动spring容器，我们的通信服务便开始运行。接下来我们来验证一下集成后的效果，如果将其配置到真正的web服务中演示过程稍显琐碎，故我们直接通过main函数来调用。

```java
public class SpringDemo {
    public static void main(String[] args) {
        ApplicationContext context = new ClassPathXmlApplicationContext("application.xml");
        AioQuickServer aioQuickServer = context.getBean("aioQuickServer", AioQuickServer.class);
        System.out.println("服务启动成功：" + aioQuickServer);
        ((ClassPathXmlApplicationContext) context).close();
        System.out.println("服务关闭");
    }
}
```

执行上述代码后控制台会打印服务的启动与关闭日志，如果出现异常，请检查端口号是否被占用。

### 2.2.2 注解方式启动服务

如果读者习惯用注解的方式使用Spring，那我们需要对原有的代码稍加改动。Protocol和MessageProcessor实现类需要加上注解`@Component`。

- 定义协议类

  ```java
  @Component("protocol")
  public class StringProtocol implements Protocol<String> {
      @Override
      public String decode(ByteBuffer readBuffer, AioSession<String> session) {
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

- 定义处理器

  ```java
  @Component("messageProcessor")
  public class ServerProcessor implements MessageProcessor<String> {
      @Override
      public void process(AioSession<String> session, String msg) {
          BufferOutputStream outputStream = session.getOutputStream();
          byte[] bytes = msg.getBytes();
          outputStream.writeInt(bytes.length);
          try {
              outputStream.write(bytes);
          } catch (IOException e) {
              e.printStackTrace();
          }
      }
  
      @Override
      public void stateEvent(AioSession<String> session, StateMachineEnum stateMachineEnum, Throwable throwable) {
      }
  }
  ```

接下来我们修改application.xml配置，`default-autowire="byName"`表示优先按bean名称注入，而注解的扫描扫描包路径为`org.smartboot.example.spring`。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:context="http://www.springframework.org/schema/context"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
        http://www.springframework.org/schema/beans/spring-beans.xsd
        http://www.springframework.org/schema/context
        http://www.springframework.org/schema/context/spring-context-4.0.xsd"
       default-autowire="byName">
    <context:component-scan base-package="org.smartboot.example.spring"/>
</beans>
```

最后我们还需要以注解的形式构造AioQuickServer对象并启动服务。

```java
@Component
public class SpringDemo {

    @Autowired
    private MessageProcessor messageProcessor;

    @Autowired
    private Protocol protocol;

    private AioQuickServer aioQuickServer;

    public static void main(String[] args) {
        ApplicationContext context = new ClassPathXmlApplicationContext("application.xml");
        SpringDemo demo = context.getBean("springDemo", SpringDemo.class);
        System.out.println("服务启动成功：" + demo.aioQuickServer);
        ((ClassPathXmlApplicationContext) context).close();
        System.out.println("服务关闭");
    }

    @PostConstruct
    public void init() {
        aioQuickServer = new AioQuickServer(8080, protocol, messageProcessor);
        try {
            aioQuickServer.start();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @PreDestroy
    public void destroy() {
        aioQuickServer.shutdown();
    }
}
```


