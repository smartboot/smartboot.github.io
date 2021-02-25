
## Spring集成smart-socket
smart-socket 就是一个普通的通信工具包，所以它跟 Spring 的结合就是个纯粹的 bean 示例托管过程。

在确认 pom.xml 的依赖配置正确之后，我们通过 xml 配置和注解两种形式演示 smart-socket 与 spring 的集成方式。
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
          http://maven.apache.org/xsd/maven-4.0.0.xsd">
   ...

    <dependencies>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-context</artifactId>
            <version>4.3.21.RELEASE</version>
        </dependency>
        <dependency>
            <groupId>org.smartboot.socket</groupId>
            <artifactId>aio-core</artifactId>
            <version>1.4.12</version>
        </dependency>
    </dependencies>

</project>
```

### 方式一：xml配置化启动服务

在《[快速上手](/docs/smart-socketocket/chapter-1/1.1-QuickStart/README.md)》章节我们接触到了smart-socket 通信开发的几个关联接口和类：  
- Protocol
- MessageProcessor
- AioQuickServer
- AioQuickClient

原先我们是通过`new`的方式实例化对象，并执行`start`方法启动服务。
而现在转变成在 application.xml 中配置它们的实例bean，整个过程更加简洁明了。

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

当启动spring容器时，我们的通信服务便通过`init-method`被拉起。
接下来我们来验证一下集成后的运行效果，为简化演示步骤我们直接通过main函数来调用。

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
> 执行上述代码后控制台会打印服务的启动与关闭日志，如果出现异常，请检查端口号是否被占用。

### 方式二：注解方式启动服务

如果你所在的团队采用的是注解形式使用Spring，那我们需要对原有的代码稍加改动。Protocol和MessageProcessor实现类需要加上注解`@Component`。

- 定义协议类

  ```java
  @Component("protocol")
  public class StringProtocol implements Protocol<String> {
      @Override
      public String decode(ByteBuffer readBuffer, AioSession<String> session) {
          ...
      }
  }
  ```

- 定义处理器

  ```java
  @Component("messageProcessor")
  public class ServerProcessor implements MessageProcessor<String> {
        @Override
        public void process(AioSession<String> session, String msg) {
            ...
        }
    
        @Override
        public void stateEvent(AioSession<String> session, StateMachineEnum stateMachineEnum, Throwable throwable) {
        }
    }
  ```

下一步修改application.xml配置，指定注解bean的扫描路径。

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
## 最后
spring 集成 smart-socket 本身是个很简单的过程，大家不要因为这是个通信服务而把它想得过于复杂。
通篇看下来其实也没有任何特别之处，跟我们平常写的业务bean是一样的。
