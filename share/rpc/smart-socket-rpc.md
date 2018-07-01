#smart-socket实现RPC
RPC是目前被广泛应用于互联网服务的一项技术，关于它的基本介绍大家可通过百度了解一下，此处不再赘述。正所谓读万卷书不如行万里路，原理性的文章看的再多都不如亲自实现一遍RPC所对其了解的更加透彻。
本文将通过技术视角，为大家演示一下RPC的工作原理与实现方案。

正式开始之前，先罗列一下实现RPC需要运用到的技术点：
1. 通信
2. 序列化/反序列化
3. 反射
4. 动态代理

本文希望最基本的技术手段为大家示范RPC的实现，所以除了通信部分我们选用smart-socket来辅助，其余包括序列化/反序列化、反射、动态代理等部分我们将采用JDK提供的解决方案。待您掌握RPC的本质后可再尝试结合第三方技术来重构RPC。

##名词解释
- Provider   
    RPC服务提供者
- Consumer  
    RPC服务调用者

## 消息通信

既然RPC是跨网络通信服务，那我们先制定通信规则，此处便需要运用通信、序列化/反序列化技术。

### 通信协议
通信协议我们采用最简单的length+data模式，编解码的实现算法如下。作为示例我们假设readBuffer足够容纳一个完整的消息，协议中的data部分便是RPC服务序列化后的byte数组，Provider/Consumer则必须在对byte数组完成反序列化后才能继续RPC服务处理。
```java
public class RpcProtocol implements Protocol<byte[]> {
    private static final int INTEGER_BYTES = Integer.SIZE / Byte.SIZE;

    @Override
    public byte[] decode(ByteBuffer readBuffer, AioSession<byte[]> session, boolean eof) {
        int remaining = readBuffer.remaining();
        if (remaining < INTEGER_BYTES) {
            return null;
        }
        int messageSize = readBuffer.getInt(readBuffer.position());
        if (messageSize > remaining) {
            return null;
        }
        byte[] data = new byte[messageSize - INTEGER_BYTES];
        readBuffer.getInt();
        readBuffer.get(data);
        return data;
    }

    @Override
    public ByteBuffer encode(byte[] msg, AioSession<byte[]> session) {
        ByteBuffer byteBuffer = ByteBuffer.allocate(msg.length + INTEGER_BYTES);
        byteBuffer.putInt(byteBuffer.capacity());
        byteBuffer.put(msg);
        byteBuffer.flip();
        return byteBuffer;
    }
}
```

### RPC请求消息
RPC请求消息由Consumer发送，Consumer需要在该请求消息中提供足够Provider准确识别服务接口的信息。核心要素包括：
1. uuid     
    请求消息唯一标识，用于关联、识别响应消息。
2. interfaceClass   
    Consumer要调用的API接口名
3. method   
    Consumer要调用的API接口方法名
4. paramClassList   
    Consumer调用的方法入参类型，用于区分同方法名不同入参的情况
5. params   
    Consumer执行方法传入的参数值

```java
public class RpcRequest implements Serializable {

    /**
     * 消息的唯一标识
     */
    private final String uuid = UUID.randomUUID().toString();

    /**
     * 接口名称
     */
    private String interfaceClass;

    /**
     * 调用方法
     */
    private String method;

    /**
     * 参数类型字符串
     */
    private String[] paramClassList;

    /**
     * 入参
     */
    private Object[] params;

    getX/setX()
}
```
### RPC响应消息
RPC响应消息为Provider将接口执行结果响应给Consumer的载体。
- uuid   
    与RPC请求消息同值
- returnObject  
    RPC接口执行返回值
- returnType     
    RPC接口返回值类型
- exception      
    RPC执行异常信息，如果出现异常的话。

```java
public class RpcResponse implements Serializable {
    /**
     * 消息的唯一标示，与对应的RpcRequest uuid值相同
     */
    private String uuid;
    /**
     * 返回对象
     */
    private Object returnObject;

    /**
     * 返回对象类型
     */
    private String returnType;

    /**
     * 异常
     */
    private String exception;
    

    public RpcResponse(String uuid) {
        this.uuid = uuid;
    }

   getX/setX()

}
```

通过上述内容便完成RPC通信的消息设计，至于RpcRequest、RpcResponse如何转化为通信协议要求的byte数组格式，我们才用JDK提供的序列化方式（生产环境不建议使用）。

- 序列化
```
ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
ObjectOutput objectOutput = new ObjectOutputStream(byteArrayOutputStream);
objectOutput.writeObject(request);
aioSession.write(byteArrayOutputStream.toByteArray());
```   
- 反序列化
```
ObjectInputStream objectInput = new ObjectInputStream(new ByteArrayInputStream(msg));
RpcResponse resp = (RpcResponse) objectInput.readObject();
```
   
## RPC服务实现
通过上文方案我们解决了RPC的通信问题，接下来便得根据通信消息实现服务能力。
### Consumer
由于RPC的Consumer端只有接口，没有具体实现，但在使用上我们又需要跟本地服务有同样的使用体验。
因此我们需要将接口实例化成对象，并使其具备跨应用服务能力，此处便需要运用到动态代理。
当Consumer执行调用接口时，代理类内部发送请求消息至Provider并获取结果。
```
obj = (T) Proxy.newProxyInstance(getClass().getClassLoader(), new Class[]{remoteInterface},
        new InvocationHandler() {

            @Override
            public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
                RpcRequest req = new RpcRequest();
                req.setInterfaceClass(remoteInterface.getName());
                req.setMethod(method.getName());
                Class<?>[] types = method.getParameterTypes();
                if (!ArrayUtils.isEmpty(types)) {
                    String[] paramClass = new String[types.length];
                    for (int i = 0; i < types.length; i++) {
                        paramClass[i] = types[i].getName();
                    }
                    req.setParamClassList(paramClass);
                }
                req.setParams(args);

                RpcResponse rmiResp = sendRpcRequest(req);
                if (StringUtils.isNotBlank(rmiResp.getException())) {
                    throw new RuntimeException(rmiResp.getException());
                }
                return rmiResp.getReturnObject();
            }
        });
```

### Provider
Provider在提供RPC服务之前需要先维护一个服务集合，采用Map存储即可，key为暴露的接口名，value为接口的具体实现。
一旦Provider接受到RPC的请求消息，只需根据请求消息内容找到并执行对应的服务，最后将返回结果以消息的形式返回至Consumer即可。
```
ObjectInputStream objectInput = new ObjectInputStream(new ByteArrayInputStream(msg));
RpcRequest req = (RpcRequest) objectInput.readObject();

RpcResponse resp = new RpcResponse(req.getUuid());
try {
    String[] paramClassList = req.getParamClassList();
    Object[] paramObjList = req.getParams();
    // 获取入参类型
    Class<?>[] classArray = null;
    if (paramClassList != null) {
        classArray = new Class[paramClassList.length];
        for (int i = 0; i < classArray.length; i++) {
            Class<?> clazz = primitiveClass.get(paramClassList[i]);
            if (clazz == null) {
                classArray[i] = Class.forName(paramClassList[i]);
            } else {
                classArray[i] = clazz;
            }
        }
    }
    // 调用接口
    Object impObj = impMap.get(req.getInterfaceClass());
    if (impObj == null) {
        throw new UnsupportedOperationException("can not find interface: " + req.getInterfaceClass());
    }
    Method method = impObj.getClass().getMethod(req.getMethod(), classArray);
    Object obj = method.invoke(impObj, paramObjList);
    resp.setReturnObject(obj);
    resp.setReturnType(method.getReturnType().getName());
} catch (InvocationTargetException e) {
    LOGGER.error(e.getMessage(), e);
    resp.setException(e.getTargetException().getMessage());
} catch (Exception e) {
    LOGGER.error(e.getMessage(), e);
    resp.setException(e.getMessage());
}
ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
objectOutput = new ObjectOutputStream(byteArrayOutputStream);
objectOutput.writeObject(resp);
session.write(byteArrayOutputStream.toByteArray());
```

## 启动服务
```java
public class Provider {
    public static void main(String[] args) throws IOException {
        RpcProviderProcessor rpcProviderProcessor = new RpcProviderProcessor();
        AioQuickServer<byte[]> server = new AioQuickServer<>(8888, new RpcProtocol(), rpcProviderProcessor);
        server.start();

        rpcProviderProcessor.publishService(DemoApi.class, new DemoApiImpl());
    }
}
```

```java
public class Consumer {

    public static void main(String[] args) throws InterruptedException, ExecutionException, IOException {

        RpcConsumerProcessor rpcConsumerProcessor = new RpcConsumerProcessor();
        AioQuickClient<byte[]> consumer = new AioQuickClient<>("localhost", 8888, new RpcProtocol(), rpcConsumerProcessor);
        consumer.start();

        DemoApi demoApi = rpcConsumerProcessor.getObject(DemoApi.class);
        System.out.println(demoApi.test("smart-socket"));
        System.out.println(demoApi.sum(1, 2));
    }

}
```

本文简要描述了RPC服务实现的关键部分，要提供稳定可靠的RPC服务还有很多细节需要考虑，有兴趣的朋友可自行研究。
本文示例的完整代码可从smart-socket项目中获取。