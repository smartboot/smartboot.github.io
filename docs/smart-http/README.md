---
sidebar: auto
home: true
heroImage: https://portrait.gitee.com/uploads/avatars/namespace/266/798143_smartboot_1578989513.png!avatar100
heroText: smart-http
action:
  - text: 进入我的开源 → 💡
    link: /smart-http/getting-started
tagline: 追求极致的轻量级可编程 http 服务器
footer: Apache License 2.0 | Copyright © 2017-present 三刀
---

smart-http 是可编程的 Http 应用微内核。封装了标准的 Http、Websocket 协议，满足用户对于 Server 端和 Client 端的开发需求。

这是目前市面上为数不多的做到严格准守 RFC2616 规范，又同时兼顾卓越性能的 Http 服务器，在三方评测 [TechEmpower](https://www.techempower.com/benchmarks/#section=data-r20&hw=ph&test=plaintext&l=zik0vz-sf)结果中有着极为亮眼的表现。

<CodeGroup>
<CodeGroupItem title="http server" active>
```java
public class SimpleSmartHttp {
    public static void main(String[] args) {
        HttpBootstrap bootstrap = new HttpBootstrap();
        bootstrap.pipeline().next(new HttpServerHandle() {
            @Override
            public void doHandle(HttpRequest request, HttpResponse response) throws IOException {
                response.write("hello world<br/>".getBytes());
            }
        });
        bootstrap.setPort(8080).start();
    }
}
```
</CodeGroupItem>
<CodeGroupItem title="websocket server">

```java
public class SimpleSmartHttp {
    public static void main(String[] args) {
        HttpBootstrap bootstrap = new HttpBootstrap();
        bootstrap.wsPipeline().next(new WebSocketDefaultHandle() {
            @Override
            public void handleTextMessage(WebSocketRequest request, WebSocketResponse response, String data) {
                response.sendTextMessage("Hello World");
            }
        });
        bootstrap.setPort(8080).start();
    }
}
```
</CodeGroupItem>
<CodeGroupItem title="http client"> 

```java
public class HttpGetDemo {
    public static void main(String[] args) {
        HttpClient httpClient = new HttpClient("www.baidu.com", 80);
        httpClient.connect();
        httpClient.get("/")
                .onSuccess(response -> System.out.println(response.body()))
                .onFailure(Throwable::printStackTrace)
                .send();
    }
}
```
</CodeGroupItem>
</CodeGroup>
