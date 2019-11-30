**关于smart-http**

smart-http 是一款采用 Java 语言编写的 Http 服务器，有别于业界知名的 Web容器：Tomcat、Undertow，smart-http 并不支持 Servlet 规范，但对于处理 Http 请求所需的各项能力，它都具备。

smart-http 天生就是异步非阻塞的 I/O 模型，因为其通信内核采用了 smart-socket。所以无论是性能还是稳定性，都是非常出色的。

smart-http 的诞生源于 smart-socket 的"野心"，一直以来 smart-socket 都是以业界优秀的通信框架为目标在不断的提升自己。
并且有幸接触到 [TechEmpower](https://www.techempower.com/benchmarks/#section=data-r18&hw=ph&test=fortune)，一个标准性能测试平台。
由于参与性能评测需要使用 Http 协议，而彼时 smart-socket 只完成基本通信功能，并未提供业界主流协议的适配。
为了能够有个清晰的自我了解，才开启 smart-http 的漫漫研发路。

个人很欣赏一句话：一个人可以走的很快，但一群人可以走的很远。
将 smart-http 开源出来，是期望这个项目能帮到一些人，同时吸收大家对它提出的发展建议，让 smart-http 和中意它的用户可以共同进步。
对于技术，我们一直是敬畏的；而对于学习，要时刻保持谦卑。还是那句话：开源不易，前行且珍惜。