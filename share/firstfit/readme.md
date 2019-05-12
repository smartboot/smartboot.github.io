# 首次适应算法（First-Fit）在smart-socket中的实践
这是一篇关于内存管理算法的文章，对于Java开发者而言这个话题比较遥远。
虽然我们日常开发中一直在跟内存打交道，但很少关注过内存管理的具体细节，毕竟JVM已经做得很好了。
然而在高并发场景下，程序运行过程中产生的大量内存对象，会造成一定的GC负担，由此直接影响着程序运行性能。如果能缓解一部分GC压力，节省下来的系统资源便会对性能有显著的提升，由此便衍生出了池技术。

本次我们分享的内存池技术主要用于提升网络通信的I/O能力，当然该技术也可用于本地磁盘I/O。比较常见的内存管理算法有以下几种：

- 首次适应算法（First-Fit）

	从空闲分区表的第一个表目起查找该表，把最先能够满足要求的空闲区分配给作业，这种方法目的在于减少查找时间。为适应这种算法，空闲分区表(空闲区链)中的空闲分区要按地址由低到高进行排序。该算法优先使用低址部分空闲区，在低址空间造成许多小的空闲区，在高地址空间保留大的空闲区。
	- 优点
	
		该算法倾向于优先利用内存中低址部分的空闲分区，从而保留了高址部分的大空闲区，这为以后到达的大作业分配大的内存空间创造了条件。
	- 缺点
		
		低址部分不断被划分，会留下许多难以利用的，很小的空闲分区，称为碎片。而每次查找又都是从低址部分开始的，这无疑又会增加查找可用空闲分区时的开销。

- 最佳适应算法（Best-Fit）

	从全部空闲区中找出能满足作业要求的、且大小最小的空闲分区，这种方法能使碎片尽量小。为适应此算法，空闲分区表（空闲区链）中的空闲分区要按从小到大进行排序，自表头开始查找到第一个满足要求的自由分区分配。该算法保留大的空闲区，但造成许多小的空闲区。
- 最差适应算法（Worst-Fit）

	它从全部空闲区中找出能满足作业要求的、且大小最大的空闲分区，从而使链表中的结点大小趋于均匀，适用于请求分配的内存大小范围较窄的系统。为适应此算法，空闲分区表（空闲区链）中的空闲分区要按大小从大到小进行排序，自表头开始查找到第一个满足要求的自由分区分配。该算法保留小的空闲区，尽量减少小的碎片产生。
	
>这些算法各有优劣，本次我们只分享首次适应算法，smart-socket中正是应用了该算法实现的高性能通信。

## 算法原理
接下来我们通过几个步骤来演示内存申请、释放的过程，以及在此过程中如何导致内存碎片化的产生。
1. 初始状态内存容量为：15
    ![](内存池初始.png)
2. ABCDE先后申请特定大小的内存块：1、2、3、4、5，此时内存池中已无可用空间。
![](apply_1.png)
3. B、D释放内存，内存池中出现两块不相邻的内存块。后续再次申请内存便可从这两块不相邻的内存块中挑选可用空间进行分配。
![](clean_1.png)
4. F申请1字节，G申请2字节。按First-Fit算法，会优先从低位查找可用内存块。当F申请到第2位内存块后，紧邻的3号内存块便不再满足G所需的2字节，所以只能从7~10号内存块中申请2字节。如果内存块小到无法满足应用所需，便成了内存碎片。
![](apply_2.png)
5. A、C、E回收内存，内存池中还原出了大片可用区域。如若F、G也释放内存，则次内存池便恢复如初。
![](clean_2.png)

## 算法实践
### 内存申请
1. availableBuffers有序存储了内存池申请/释放过程中产生的内存块。低地址内存块存储于队列头部，高地址存于队列尾部。
2. 申请内存时遍历内存块队列，查找容量足够的内存块。
3. 如果内存块容量刚好符合申请所需大小，则从队列中移除该内存块并返回。
4. 如果内存容量大于申请所需大小，则对该内存块进行拆分。只返回所需大小的内存块，剩余部分存留于队列中。
5. 若无可用内存块，则申请失败，此时只能创建临时内存块。
```java
public VirtualBuffer allocate(final int size) {
    lock.lock();
    try {
        Iterator<VirtualBuffer> iterator = availableBuffers.iterator();
        VirtualBuffer bufferChunk;
        while (iterator.hasNext()) {
            VirtualBuffer freeChunk = iterator.next();
            final int remaining = freeChunk.getParentLimit() - freeChunk.getParentPosition();
            if (remaining < size) {
                continue;
            }
            if (remaining == size) {
                iterator.remove();
                buffer.limit(freeChunk.getParentLimit());
                buffer.position(freeChunk.getParentPosition());
                freeChunk.buffer(buffer.slice());
                bufferChunk = freeChunk;
            } else {
                buffer.limit(freeChunk.getParentPosition() + size);
                buffer.position(freeChunk.getParentPosition());
                bufferChunk = new VirtualBuffer(this, buffer.slice(), buffer.position(), buffer.limit());
                freeChunk.setParentPosition(buffer.limit());
            }
            return bufferChunk;
        }
    } finally {
        lock.unlock();
    }
    return new VirtualBuffer(null, allocate0(size, false), 0, 0);
}
```
### 释放内存

使用完毕的内存块需要主动释放回收，以供下次继续使用。释放的过程主要做到两点：

1. 找到被释放内存块在内存队列中的正确点位。
2. 被释放内存块所处的点位若能与前后相邻内存块形成连续内存块，则合并内存块；反之，则直接放入队列中即可。
```java
private void clean0(VirtualBuffer cleanBuffer) {
    int index = 0;
    Iterator<VirtualBuffer> iterator = availableBuffers.iterator();
    while (iterator.hasNext()) {
        VirtualBuffer freeBuffer = iterator.next();
        //cleanBuffer在freeBuffer之前并且形成连续块
        if (freeBuffer.getParentPosition() == cleanBuffer.getParentLimit()) {
            freeBuffer.setParentPosition(cleanBuffer.getParentPosition());
            return;
        }
        //cleanBuffer与freeBuffer之后并形成连续块
        if (freeBuffer.getParentLimit() == cleanBuffer.getParentPosition()) {
            freeBuffer.setParentLimit(cleanBuffer.getParentLimit());
            //判断后一个是否连续
            if (iterator.hasNext()) {
                VirtualBuffer next = iterator.next();
                if (next.getParentPosition() == freeBuffer.getParentLimit()) {
                    freeBuffer.setParentLimit(next.getParentLimit());
                    iterator.remove();
                } else if (next.getParentPosition() < freeBuffer.getParentLimit()) {
                    throw new IllegalStateException("");
                }
            }
            return;
        }
        if (freeBuffer.getParentPosition() > cleanBuffer.getParentLimit()) {
            availableBuffers.add(index, cleanBuffer);
            return;
        }
        index++;
    }
    availableBuffers.add(cleanBuffer);
}
```
> 完整代码参阅smart-socket项目中的BufferPage.java

## 拓展讨论
内存申请/释放在实际应用中还有一个无法回避的问题，那就是并发。如何才能在高并发场景下保证内存池依旧能高效稳定的提供申请与释放服务？
为了避免多线程并发申请导致某块内存区域被多次分配，必须要对申请的过程加同步锁控制，内存释放的过程亦是如此。

可一旦加上同步锁，内存的申请、释放性能必然受到影响。最为理想的状态是每一个CPU绑定着独立的内存池对象，
运行时便不存在多个CPU对同一个内存池对象进行申请/释放操作，这样便可实现无锁化。

可惜CPU绑定内存池的想法无法实现，只能做到线程级的隔离，采用ThreadLocal便可。只不过此方式如若使用不当可能出现内存泄露，以及内存池资源利用率不高等情况。
为此，推荐的做法是采用数组的方式来维护多个内存池对象，使用时通过某种均衡策略将内存池对象分配给任务作业。
虽然不能杜绝锁竞争的情况发生，但在一定程度上还是可以降低锁机率的。

