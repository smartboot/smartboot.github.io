八、读写回调
===

### 读回调ReadCompletionHandler
```
class ReadCompletionHandler<T> implements CompletionHandler<Integer, AioSession<T>> {
    private static final Logger LOGGER = LogManager.getLogger(ReadCompletionHandler.class);

    @Override
    public void completed(final Integer result, final AioSession<T> aioSession) {
        // 接收到的消息进行预处理
        for (Filter h : aioSession.getServerConfig().getFilters()) {
            h.readFilter(aioSession, result);
        }
        aioSession.readFromChannel(result == -1);
    }

    @Override
    public void failed(Throwable exc, AioSession<T> aioSession) {
        if (exc instanceof IOException) {
            if (LOGGER.isDebugEnabled()) {
                LOGGER.debug("session:{} will be closed,msg:{}", aioSession.getSessionID(), exc.getMessage());
            }
        } else {
            if (LOGGER.isDebugEnabled()) {
                LOGGER.debug("smart-socket read fail:", exc);
            }
        }

        try {
            aioSession.getServerConfig().getProcessor().stateEvent(aioSession, StateMachineEnum.INPUT_EXCEPTION, exc);
        } catch (Exception e) {
            LOGGER.catching(e);
        }
        try {
            aioSession.close();
        } catch (Exception e) {
            LOGGER.catching(e);
        }
    }
}
```
执行读回调是为了处理当前从网络上读取到的字节流，在AIO通信中被封装为ByteBuffer对象。我们需要对这些数据进行解析，还原成消息实体并进行业务处理。
满足以下任何一个条件时，都会触发读回调：
1. 从网络上读取到新的数据，至少1个字节。
2. 对端服务完成输出并关闭write通道，即本通道的read操作已终止，此时`result==-1`。如图所示：
![输入图片说明](https://static.oschina.net/uploads/img/201802/10115533_GGM4.png "在这里输入图片标题")

当服务在进行数据读取、或者读回调处理过程中出现异常时，会触发ReadCompletionHandler的failed方法。框架会触发StateMachineEnum.INPUT_EXCEPTION状态机，业务自行决定是否处理。为了规避开发人员忽略此类异常导致资源无法释放，smart-socket会主动执行AioSession.close。

---
### 写回调WriteCompletionHandler
```
class WriteCompletionHandler<T> implements CompletionHandler<Integer, AioSession<T>> {
    private static final Logger LOGGER = LogManager.getLogger(WriteCompletionHandler.class);

    @Override
    public void completed(final Integer result, final AioSession<T> aioSession) {
        // 接收到的消息进行预处理
        for (Filter h : aioSession.getServerConfig().getFilters()) {
            h.writeFilter(aioSession, result);
        }
        aioSession.writeToChannel();
    }

    @Override
    public void failed(Throwable exc, AioSession<T> aioSession) {
        if (LOGGER.isDebugEnabled()) {
            LOGGER.debug("smart-socket write fail:", exc);
        }
        try {
            aioSession.getServerConfig().getProcessor().stateEvent(aioSession, StateMachineEnum.OUTPUT_EXCEPTION, exc);
        } catch (Exception e) {
            LOGGER.catching(e);
        }
        try {
            aioSession.close();
        } catch (Exception e) {
            LOGGER.catching(e);
        }
    }
}
```
业务实现中会通过AioSession.write给予对端响应消息，这个write操作是非阻塞的。当数据输出后会以写回调WriteCompletionHandler的方式告知框架，已经有一部分数据成功写出去了。每次触发回调后都需要检查是否还有待输出的数据，若有则继续执行write方法，并等待下一次写回调。自此数据输出操作便形式一个健康的执行闭环。
当然这个输出的过程会如同写操作一样出现不可预知的异常，此时同样会通过WriteCompletionHandler.failed方法触发状态机StateMachineEnum.OUTPUT_EXCEPTION，最后框架自动关闭连接释放资源。

