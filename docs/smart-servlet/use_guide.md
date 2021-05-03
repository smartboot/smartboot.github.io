# 快速上手
### 准备工作

smart-servlet 还未正式发布，如需体验请从本仓库下载源码并导入 IDE 完成工程编译，编译执行顺序如下：

1. 路径：smart-servlet/pom.xml，执行`mvn install`。当控制台出现以下信息时，说明编译成功。

   ```she
   [INFO] ------------------------------------------------------------------------
   [INFO] Reactor Summary:
   [INFO] 
   [INFO] smart-servlet-parent ............................... SUCCESS [  1.168 s]
   [INFO] servlet-core ....................................... SUCCESS [ 10.142 s]
   [INFO] smart-servlet-spring-boot-starter .................. SUCCESS [  2.107 s]
   [INFO] smart-servlet-maven-plugin ......................... SUCCESS [  6.330 s]
   [INFO] ------------------------------------------------------------------------
   [INFO] BUILD SUCCESS
   [INFO] ------------------------------------------------------------------------
   ```

2. 路径：smart-servlet/plugins/pom.xml，执行`mvn install`。当控制台出现以下信息时，说明编译成功。

   ```she
   [INFO] ------------------------------------------------------------------------
   [INFO] Reactor Summary for servlet-plugins-parent 0.1.0:
   [INFO] 
   [INFO] servlet-plugins-parent ............................. SUCCESS [  2.403 s]
   [INFO] plugin-session ..................................... SUCCESS [  3.104 s]
   [INFO] plugin-dispatcher .................................. SUCCESS [  2.005 s]
   [INFO] ------------------------------------------------------------------------
   [INFO] BUILD SUCCESS
   [INFO] ------------------------------------------------------------------------
   ```

3. 路径：smart-servlet/archives/pom.xml，执行`mvn install`。当控制台出现以下信息时，说明编译成功。

   ```shell
   [INFO] ------------------------------------------------------------------------
   [INFO] BUILD SUCCESS
   [INFO] ------------------------------------------------------------------------
   ```

   

### 2.1 示例演示

> 特别说明：smart-servlet 提供的演示文件来自 Tomcat 的示例，存放于`smart-servlet/archives/webapps`目录下。

1. 完成前面的工程编译后，运行archives模块中的`org.smartboot.servlet.starter.Bootstrap`启动服务器。

2. 若启动过程无任何异常，打开浏览器访问 [http://127.0.0.1:8080/examples](http:127.0.0.1:8080/examples)。

   

### 2.2 业务系统集成smart-servlet

根据业务工程实际情况选择相应的集成方式。

- maven plugin

  适用于传统的 Servlet 或者 Spring MVC 工程，且必须是 maven 工程。需要在 web 模块所在的 pom.xml 中加入以下配置，若存在端口冲突自行调整。完成配置后通过：`mvn smart-servlet:run` 启动服务。
  ```xml
  <!-- pom.xml -->
  <project>
   <build>
     <plugins>
       <plugin>
         <groupId>org.smartboot.servlet</groupId>
         <artifactId>smart-servlet-maven-plugin</artifactId>
         <version>0.1.0</version>
         <configuration>
           <port>8080</port>
         </configuration>
         <dependencies>
           <dependency>
             <groupId>org.smartboot.servlet</groupId>
             <artifactId>plugin-session</artifactId>
             <version>0.1.0</version>
           </dependency>
           <dependency>
             <groupId>org.smartboot.servlet</groupId>
             <artifactId>plugin-dispatcher</artifactId>
             <version>0.1.0</version>
           </dependency>
         </dependencies>
       </plugin>
     </plugins>  
   </build>
  </project>
  ```

- springboot starter

  对于 Springboot 提供的集成方式，替换原 spring-boot-starter-web 默认绑定的 Servlet 容器。

  ```xml
   <!-- pom.xml -->
   <project>
     <dependencies>
       <dependency>
         <groupId>org.springframework.boot</groupId>
         <artifactId>spring-boot-starter-web</artifactId>
         <exclusions>
           <exclusion>
             <groupId>org.springframework.boot</groupId>
             <artifactId>spring-boot-starter-tomcat</artifactId>
           </exclusion>
         </exclusions>
       </dependency>
       <dependency>
         <groupId>org.smartboot.servlet</groupId>
         <artifactId>smart-servlet-spring-boot-starter</artifactId>
         <version>0.1.0</version>
       </dependency>
     </dependencies>
   </project>
  ```