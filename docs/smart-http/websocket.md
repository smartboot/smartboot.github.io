---
title: Websocket
---
# WebSocket
采用 smart-http 进行 websocket 开发与普通 http 请求差别不大，
Http 开发涉及到的接口在 WebSocket 中都有与之相对应的实现，见下表。

差异 |Http | WebSocket |
:-: | :- | :- |
 请求 | HttpRequest | WebSocketRequest 
 响应 | HttpResponse| WebSocketResponse 
 路由 | HttpRouteHandle| WebSocketRouteHandle 
 
### 示例
```java
public class WebSocketDemo {
    public static void main(String[] args) {
        //1. 实例化路由Handle
        WebSocketRouteHandle routeHandle = new WebSocketRouteHandle();

        //2. 指定路由规则以及请求的处理实现
        routeHandle.route("/", new WebSocketDefaultHandle() {
            @Override
            public void handleTextMessage(WebSocketRequest request, WebSocketResponse response, String data) {
                response.sendTextMessage("接受到客户端消息：" + data);
            }
        });

        // 3. 启动服务
        HttpBootstrap bootstrap = new HttpBootstrap();
        bootstrap.wsPipeline().next(routeHandle);
        bootstrap.start();
    }
}
```

运行上述代码后，可以通过 websocket 客户端建立连接并调试接口。此处推荐：[在线测试](http://www.websocket-test.com/)