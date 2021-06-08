---
author: 三刀
time: 2022-02-27
---
# 快速上手
:::: tip 开篇
问：学会
smart-http 需要多久？     
答：一分钟？应该足够了！
::::
## 一、Http 服务端开发
### 1.1 Hello World
下面是使用 smart-http 进行服务端开发最简单的一段代码。
```java
public class SimpleSmartHttp {
    public static void main(String[] args) {
        HttpBootstrap bootstrap = new HttpBootstrap();
        bootstrap.pipeline(new HttpServerHandle() {
            @Override
            public void doHandle(HttpRequest request, HttpResponse response) throws IOException {
                response.write("hello world<br/>".getBytes());
            }
        });
        bootstrap.setPort(8080).start();
    }
}
```
`HttpBootstrap` 是服务端程序的启动入口，所以第一步必须是实例化一个`HttpBootstrap`对象。 

### 1.2 pipeline（管道）
smart-http 引入了 pipeline（管道）的概念，用以组织 Http 请求的处理路径。
上文示例中只是往 pipeline 中注册了一个`HttpServerHandle`，如果要注册多个 Handle，可采用 **pipeline().next()** 将多个 Handle 链接起来。

```java
public class MultiPipelineSmartHttp {
    public static void main(String[] args) {
        HttpBootstrap bootstrap = new HttpBootstrap();
        bootstrap.pipeline().next(new HttpServerHandle() {
            @Override
            public void doHandle(HttpRequest request, HttpResponse response) throws IOException {
                response.write("first handle<br/>".getBytes());
                doNext(request, response);
            }
        }).next(new HttpServerHandle() {
            @Override
            public void doHandle(HttpRequest request, HttpResponse response) throws IOException {
                response.write("second handle<br/>".getBytes());
            }
        });
        bootstrap.setPort(8080).start();
    }
}
```

:::: warning 注意
从上一个 Handle 进入 下一个 Handle，必须显示的调用 **doNex(request,response)** 方法，否则请求将会止步于当前 Handle。
::::

## 二、Http 客户端开发
### 2.1 Hello World
下面是使用 smart-http 进行客户端开发最简单的一段代码。
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
我们推荐采用响应式编程范式进行客户端开发，比如注册 **onSuccess**、**onFailure** 等回调事件。
当然，调用 **send** 方法返回的 **Future** 对象依旧能满足您对于同步调用的需求。
## 小结
本文基本已经涵盖了 smart-http 应用层面的全部内容，之后我们还会结合实际场景补充一些案例供大家参考。

---
<ArticleEndTemplate/>