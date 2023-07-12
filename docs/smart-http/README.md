---
home: true
heroText: smart-http
bannerBg: none
actionText: 进入我的开源 → 💡
actionLink: /smart-http/getting-started-client/
tagline: 追求极致的轻量级可编程 http 服务器
title: smart-http
date: 2022-10-27 12:23:10
permalink: /smart-http/
postList: none
---
<p align="center">
  <a href='https://gitee.com/smartboot/smart-http' target="_blank"><img src='https://gitee.com/smartboot/smart-http/badge/star.svg?theme=gvp' alt='star' class="no-zoom"/></a>
  <a href='https://gitee.com/smartboot/smart-http' target="_blank"><img src='https://gitee.com/smartboot/smart-http/badge/fork.svg?theme=gvp' alt='fork' class="no-zoom"/></a>
  <a href="https://www.murphysec.com/dr/q85pmjEnPUFZx28ozS" alt="OSCS Status"><img src="https://www.oscs1024.com/platform/badge/smartboot/smart-http.svg?size=small" class="no-zoom"/></a>
  <a href="https://github.com/smartboot/smart-http" target="_blank"><img src='https://img.shields.io/github/stars/smartboot/smart-http' alt='GitHub stars' class="no-zoom"></a>
  <a href="https://github.com/smartboot/smart-http" target="_blank"><img src='https://img.shields.io/github/forks/smartboot/smart-http' alt='GitHub forks' class="no-zoom"></a>
</p>
smart-http 是可编程的 Http 应用微内核。封装了标准的 Http、Websocket 协议，满足用户对于 Server 端和 Client 端的开发需求。

这是目前市面上为数不多的做到严格准守 RFC2616 规范，又同时兼顾卓越性能的 Http 服务器，在三方评测 [TechEmpower](https://www.techempower.com/benchmarks/#section=data-r20&hw=ph&test=plaintext&l=zik0vz-sf)结果中有着极为亮眼的表现。

你可以将 smart-http 开发的程序部署在任何 Java 8 及以上版本的设备上。
经过我们的不懈优化，已经最大限度的降低程序运行期间对于内存和 GC 的开销。

smart-http，是一款体现了作为开源人的工匠精神的作品。
## 当前最新版本
### Server 版
```xml
<dependency>
    <groupId>org.smartboot.http</groupId>
    <artifactId>smart-http-server</artifactId>
    <version>1.1.21</version>
</dependency>
```
### Client 版
```xml
<dependency>
    <groupId>org.smartboot.http</groupId>
    <artifactId>smart-http-client</artifactId>
    <version>1.1.21</version>
</dependency>
```
