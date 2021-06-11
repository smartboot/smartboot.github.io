---
author: 三刀
---
# 快速上手
### 示例程序
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

<ArticleEndTemplate/>