---
home: true
heroText: smart-servlet
tagline: 国产开源 Servlet3.1 服务器
actionText: 进入我的开源 → 💡
actionLink: /smart-servlet/quickstart
title: smart-servlet
date: 2022-10-27 12:36:13
permalink: /smart-servlet/
postList: none
bannerBg: none
---
<p align="center">
  <a href='https://gitee.com/smartboot/smart-servlet' target="_blank"><img src='https://gitee.com/smartboot/smart-servlet/badge/star.svg?theme=gvp' alt='star' class="no-zoom"/></a>
  <a href='https://gitee.com/smartboot/smart-servlet' target="_blank"><img src='https://gitee.com/smartboot/smart-servlet/badge/fork.svg?theme=gvp' alt='fork' class="no-zoom"/></a>
  <a href="https://www.murphysec.com/dr/7sZdQKJ9CLbpVU2roi" alt="OSCS Status"><img src="https://www.oscs1024.com/platform/badge/smartboot/smart-servlet.svg?size=small" class="no-zoom"/></a>
  <a href="https://github.com/smartboot/smart-servlet" target="_blank"><img src='https://img.shields.io/github/stars/smartboot/smart-servlet' alt='GitHub stars' class="no-zoom"></a>
  <a href="https://github.com/smartboot/smart-servlet" target="_blank"><img src='https://img.shields.io/github/forks/smartboot/smart-servlet' alt='GitHub forks' class="no-zoom"></a>
</p>
smart-servlet 是一款实现了 Servlet 3.1 规范，支持多应用隔离部署的的 Web 容器。与此同时，smart-servlet 还是一款插件化容器，基于内置的沙箱环境确保 smart-servlet 拥有最精简的运行能力，用户还可以通过自定义插件扩展容器的服务能力。

## 架构设计

smart-servlet 在 smart-http 的基础之上，通过继承 HttpHandle 实现了 Servlet 规范。这意味着任何 smart-http 服务都可以通过单独引入 smart-servlet 核心包的方式，将普通的 http 应用改造成 servlet 应用，而且这个成本是极低的。

![](https://oscimg.oschina.net/oscnet/up-3ffd644ea02c150e7ee44dab5a4fc065cff.png)

**产品特色**
- 国产血统：核心技术 100% 全栈自研。
- 性能优越：搭载最新版通信微内核 smart-socket。
- 安全可靠：严格遵循协议规范；支持加密传输方式。
- 简洁易用：支持 War 包、springboot、maven-plugin等多种运行模式，使用体验100%兼容 Tomcat。
