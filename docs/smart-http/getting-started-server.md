---
author: 三刀
time: 2022-02-27
---
# 快速上手
### 示例程序
下面是使用 smart-http 进行服务端开发最简单的一段代码。
```java
public class SimpleSmartHttp {
    public static void main(String[] args) {
        HttpBootstrap bootstrap = new HttpBootstrap();
        bootstrap.pipeline(new HttpServerHandler() {
            @Override
            public void handle(HttpRequest request, HttpResponse response) throws IOException {
                response.write("hello world<br/>".getBytes());
            }
        });
        bootstrap.setPort(8080).start();
    }
}
```
`HttpBootstrap` 是服务端程序的启动入口，所以第一步必须是实例化一个`HttpBootstrap`对象。
之后配置请求处理 Handle 和一些基本服务参数，最后调用 **start** 启动即可。

### pipeline（管道）
smart-http 引入了 pipeline（管道）的概念，用以组织 Http 请求的处理路径。
上文示例中只是往 pipeline 中注册了一个`HttpServerHandle`，如果要注册多个 Handle，可采用 **pipeline().next()** 将多个 Handle 链接起来。

```java
public class MultiPipelineSmartHttp {
    public static void main(String[] args) {
        HttpBootstrap bootstrap = new HttpBootstrap();
        bootstrap.pipeline().next(new HttpServerHandler() {
            @Override
            public void handle(HttpRequest request, HttpResponse response) throws IOException {
                response.write("first handle<br/>".getBytes());
                doNext(request, response);
            }
        }).next(new HttpServerHandler() {
            @Override
            public void handle(HttpRequest request, HttpResponse response) throws IOException {
                response.write("second handle<br/>".getBytes());
            }
        });
        bootstrap.setPort(8080).start();
    }
}
```

:::: warning 注意
从上一个 Handle 进入 下一个 Handle，必须显式的调用 **doNex(request,response)** 方法，否则请求将会止步于当前 Handle。
::::

<ArticleEndTemplate/>