一、准备工作
===

本章节旨在通过深度剖析smart-socket实现原理，有助于您运用smart-socket写出更高效的代码。本手册描述的内容仅限于smart-socket，不涉及到Java Socket基础知识，所以在阅读之前请确认你已具备初步的socket开发经验并对JDK AIO相关的类/接口有所了解：
- `AsynchronousChannelGroup`
- `AsynchronousServerSocketChannel`
- `AsynchronousSocketChannel`
- `CompletionHandler`

smart-socket为自己贴的标签是：极简、易用、高性能。文字无法表达的它的“高性能”程度，以您的亲测结果为准。至于“极简”、“易用”的特性，希望通过本文的阐述让你切身感受到。smart-socket代码总量仅800多行，源码文件数也才区区11个。

### smart-socket代码清单
| 名称 | 类型 |可见性|说明|
|---|---|---|---|
|Protocol|interface|public|协议接口|
|MessageProcessor|interface|public|消息处理器接口|
|Filter|interface|public|过滤器接口|
|StateMachineEnum|enum|public|服务状态机枚举|
|AioQuickClient|class|public|AIO客户端|
|AioQuickServer|class|public|AIO服务端|
|AioSession|class|public|AIO传输会话|
|IoServerConfig|class|package|AIO服务配置|
|ReadCompletionHandler|class|package|AIO读操作CompletionHandler实现类|
|WriteCompletionHandler|class|package|AIO写操作CompletionHandler实现类|
|FastBlockingQueue|class|package|自定义队列|
---
