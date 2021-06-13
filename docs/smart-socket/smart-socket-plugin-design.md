---
title: smart-socket 插件化设计
---
# smart-socket 插件化设计
用过 smart-socket 的朋友应该都清楚，只要掌握 Protocol、MessageProcessor 两大核心接口便能顺利的进行通信开发。
然而，事实上 smart-socket 的核心接口总共有三个，而那鲜为人知的第三个接口正是下图右侧的 NetMonitor。
在 NetMonitor 中提供了一些高级用法，本文要分享的插件化设计便是基于此接口作了一些扩展。

[>>点击查看全文](https://mp.weixin.qq.com/s?__biz=Mzg4MzU2NDA0Nw==&mid=2247483862&idx=1&sn=90bc01e109934fe2b53e7ddc3a6a4b35&chksm=cf44cab6f83343a04fcee24f7631a2c272ac0795cd883fa29b8ac1c4cfd7aa8bca27af900865&scene=178&cur_album_id=1707906125699792897#rd)
