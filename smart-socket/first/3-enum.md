三、状态枚举
===

### 状态机StateMachineEnum
smart-socket中引入了状态机的概念，状态机的存在不会决策smart-socket对于通信的事件处理，但会在特定事件发生之时通知消息处理器`MessageProcessor`的实现类。因此在必要的情况下，用户需要在`stateEvent`实现自己所要关注的状态处理，例如：
```
    public void stateEvent(AioSession<BaseMessage> session, StateMachineEnum stateMachineEnum, Throwable throwable) {
        switch (stateMachineEnum) {
            case NEW_SESSION:
                newSession();
                break;
            case INPUT_SHUTDOWN:
                inputShutdown();
                break;
        }
    }
```
目前已有的状态枚举为：
 
| 状态枚举|说明|
|---|---|
|NEW_SESSION|网络连接建立时触发，连接建立时会构建传输层的AioSession，如果业务层面也需要维护一个会话，可在此状态机中处理|
|INPUT_SHUTDOWN|数据读取完毕时触发，即传统意义中的`read()==-1`|
|INPUT_EXCEPTION|读数据过程中发生异常时触发此状态机|
|OUTPUT_EXCEPTION|写数据过程中发生异常时触发此状态机|
|SESSION_CLOSING|触发了AioSession.close方法，但由于当前AioSession还有未完成的事件，会进入SESSION_CLOSING状态|
|SESSION_CLOSED|AioSesson完成close操作后触发此状态机|
|PROCESS_EXCEPTION|业务处理异常|
|RELEASE_FLOW_LIMIT|释放流控,仅服务端有效|
|FLOW_LIMIT|流控,仅服务端有效|



