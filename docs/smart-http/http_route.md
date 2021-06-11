---
author: 三刀
---
# 请求路由

熟悉 Servlet 或者 Spring MVC 开发的人应该对这个不陌生，
前端请求的不同接口，需要路由到不同 Servlet 或者 Controller 中进行处理。

smart-http 也提供了请求路由的支持，使用时需要用到`HttpRouteHandler`。
```java
public class HttpRouteDemo {
    public static void main(String[] args) {
        //1. 实例化路由Handle
        HttpRouteHandler routeHandle = new HttpRouteHandler();

        //2. 指定路由规则以及请求的处理实现
        routeHandle.route("/", new HttpServerHandler() {
            @Override
            public void handle(HttpRequest request, HttpResponse response) throws IOException {
                response.write("smart-http".getBytes());
            }
        }).route("/test1", new HttpServerHandler() {
            @Override
            public void handle(HttpRequest request, HttpResponse response) throws IOException {
                response.write(("test1").getBytes());
            }
        }).route("/test2", new HttpServerHandler() {
            @Override
            public void handle(HttpRequest request, HttpResponse response) throws IOException {
                response.write(("test2").getBytes());
            }
        });

        // 3. 启动服务
        HttpBootstrap bootstrap = new HttpBootstrap();
        bootstrap.pipeline().next(routeHandle);
        bootstrap.start();
    }
}
```

当然，如果 smart-http 默认提供的路由组件满足不了你的需求，用户也可以通过继承`HttpServerHandler`自己实现一套请求路由算法。

<ArticleEndTemplate/>