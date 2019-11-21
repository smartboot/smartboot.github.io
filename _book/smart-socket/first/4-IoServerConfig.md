四、服务配置IoServerConfig
===

`IoServerConfig`是个包可见级别的类，供smart-socket进行服务配置管理，用户无法直接对其操作。但是了解该类有助于更好的运用smart-socket开放的各个接口。

|配置项|类型|默认值|备注|
|----|----|----|----|
|BANNER        |String        |-|控制台打印的启动banner|
|VERSION       |String        |v1.3.11   |当前smart-socket版本号|
|writeQueueSize|int           |4        |AioSession中的输出缓存队列长度|
|readBufferSize|int           |512      |AioSession进行数据读操作是ByteBuffer大小,单位：byte|
|host          |String        |null     |客户端连接远程服务器的地址|
|filters       |Filter数组|[ ]|定义过滤器数组|
|port          |int           |8888|服务端开放的端口号|
|processor     |MessageProcessor|null|自定义消息处理器|
|protocol      |Protocol      |null|自定义协议编解码|
|threadNum     |int           |CPU Nums|smart-socket线程组大小|
|limitRate     |float         |0.9|流控系数，**该配置项由框架维护，无法修改**|
|releaseRate   |float         |0.6|解除流控系数，**该配置项由框架维护，无法修改**|
|flowLimitLine |int           |limitRate*writeQueueSize|触发流控的阈值，**无法修改**|
|releaseLine   |int           |releaseRate*writeQueueSize|解除流控的阈值，**无法修改**|



