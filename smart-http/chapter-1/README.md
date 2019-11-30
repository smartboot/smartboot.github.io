**快速上手**

JDK1.7 是采用 smart-http 进行开发的最低版本要求，并且我们推荐采用 maven 方式将 smart-http 依赖引入您的工程中。
```xml
<!-- https://mvnrepository.com/artifact/org.smartboot.http/smart-http-server -->
<dependency>
    <groupId>org.smartboot.http</groupId>
    <artifactId>smart-http-server</artifactId>
    <version>1.0.12</version>
</dependency>
```

我们对 smart-http 的接口进行了精心的设计，所以启动一个 Http 服务只需极少的代码，如下所示。
```java
public class SimpleSmartHttp {
    public static void main(String[] args) {
        HttpBootstrap bootstrap = new HttpBootstrap();
        bootstrap.pipeline().next(new HttpHandle() {
            @Override
            public void doHandle(HttpRequest request, HttpResponse response) throws IOException {
                response.write("hello world<br/>".getBytes());
            }
        });
        bootstrap.setPort(8080).start();
    }
}
```

启动程序后打开浏览器访问：`http://127.0.0.1`，便会在页面输出：**Hello World**

### 小结
通过以上描述我们看到通过 smart-http 进行 http 服务开发是非常简单的。
当然在实际场景下我们面临的情况会更为复杂，例如：请求路由、静态资源服务、文件上传/下载等。
我们会尽可能的为大家整理这些场景的处理方案，无所谓教程，分享交流而已。