---
home: true
heroImage: /img.png
heroText: smart boot
tagline: 开源，赋予未来更多的想象
# actionText: 开始使用 →
# actionLink: /pages/a2f161/
bannerBg: none # auto => 网格纹背景(有bodyBgImg时无背景)，默认 | none => 无 | '大图地址' | background: 自定义背景样式       提示：如发现文本颜色不适应你的背景时可以到palette.styl修改$bannerTextColor变量

features:
- title: 极简
  details: 1 行代码能实现的，为什么要 2 行
- title: 易用
  details: 3 分钟上手，30 分钟精通
- title: 高性能
  details: 重新定义硬件的性能极限

# 文章列表显示方式: detailed 默认，显示详细版文章列表（包括作者、分类、标签、摘要、分页等）| simple => 显示简约版文章列表（仅标题和日期）| none 不显示文章列表
postList: none
---
<p align="center">
  <a class="become-sponsor" href="donation.html">支持smartboot</a>
</p>

<style>
.become-sponsor {
  padding: 8px 20px;
  display: inline-block;
  color: #11a8cd;
  border-radius: 30px;
  box-sizing: border-box;
  border: 1px solid #11a8cd;
}
</style>

[//]: # (<p align="center">)

[//]: # (  <a href="https://www.npmjs.com/package/vuepress-theme-vdoing" target="_blank"><img src="https://img.shields.io/npm/v/vuepress-theme-vdoing" alt="npm" class="no-zoom"></a>)

[//]: # (  <a href="https://www.npmjs.com/package/vuepress-theme-vdoing" target="_blank"><img src="https://img.shields.io/npm/dt/vuepress-theme-vdoing" alt="npm" class="no-zoom"></a>)

[//]: # (  <a href="https://github.com/xugaoyi/vuepress-theme-vdoing" target="_blank"><img src='https://img.shields.io/github/stars/xugaoyi/vuepress-theme-vdoing' alt='GitHub stars' class="no-zoom"></a>)

[//]: # (  <a href="https://github.com/xugaoyi/vuepress-theme-vdoing" target="_blank"><img src='https://img.shields.io/github/forks/xugaoyi/vuepress-theme-vdoing' alt='GitHub forks' class="no-zoom"></a>)

[//]: # (</p>)

## 🎖明星项目
::: cardList 3
```yaml
# - name: OpenHarmony
#   desc: 开放原子开源基金会
#   link: https://docs.openharmony.cn/pages/000000/
#   bgColor: '#f1f1f1'
#   textColor: '#2A3344'
- name:  🔥 smart-socket
  desc: 支持百万级长连接的AIO通信框架
  link: /smart-socket/
  bgColor: '#f1f1f1'
  textColor: '#2A3344'
- name: 🔥 smart-http
  desc: 基于smart-socket实现的轻量级http服务器
  link: /smart-http/
  bgColor: '#f1f1f1'
  textColor: '#2A3344'
- name: 🔥 smart-servlet
  desc:  一款实现了Servlet 3.1规范的 Web 容器。
  link: /smart-servlet/
  bgColor: '#f1f1f1'
  textColor: '#2A3344'
```
:::

<br/>

:::: warning 注意
所有项目皆采用 Java 1.8 进行开发，并使用 Maven 管理项目依赖包。

项目源码皆可从 Gitee 仓库：[https://gitee.com/smartboot](https://gitee.com/smartboot) 获取。
::::
## smartboot 是个啥？
smartboot 是由「三刀」在 Gitee 上创建的开源组织，曾获获得 2020 年度 OSC 中国开源项目评选「[优秀 Gitee 组织](https://www.oschina.net/question/2918182_2320117)」。
## smartboot 旗下开源项目的设计理念
我在这个行业已经摸爬滚打了十个年头，接触过非常多的开源项目。发现存在一个普遍的现象，很多项目都在追求所谓的「设计感」。这种设计感将简单变成复杂，质朴变成浮华。如果没用上几种设计模式，再结合一些深度理论，都不好意思推向大众。

在我心中所有项目更应强调的是「**工具**」属性，解决问题才是它的首要职责。虽然好的设计，可以在解决问题的同时，为项目创造更高的附加值，这包括源码可读性、可扩展性、可维护性等。
这确实是每个程序员理应去追求的境界。可现实情况是，在追求设计的同时，又有多少人关注过『**设计的尺度**』。

太多被过渡设计的项目，让程序员不得不熬夜学习如何使用。而若要深入掌握其原理，又得耗费更多的时间和精力。日渐褪去的发际线，见证了各位曾经的努力。

我们的开源项目，将始终秉持「极简」、「易用」、「高性能」的设计理念。
我们的每一个开源项目，都是为解决问题而生；写下的每一行代码，都为了能将其亲和力带给读者。
即便当下做的还不够好，但这个方向始终不变。我们对待开源的态度，可以概括为九个字「开源不易，且行且珍惜」
## 如何参与开源？

如果你不曾有过参与开源的经历，不妨先从以下几种方式入手：

1. 以 issues 的形式反馈你的问题或者建议。提交入口>>[smart-socket](https://gitee.com/smartboot/smart-socket/issues)、[smart-http](https://gitee.com/smartboot/smart-http/issues)
2. 协助处理他人提交的 issues。
3. 如果你有更好的代码实践方式，请提交 Pull Request。提交入口>>[smart-socket](https://gitee.com/smartboot/smart-socket/pulls)、[smart-http](https://gitee.com/smartboot/smart-http/pulls)
4. 以博文的形式分享你所掌握的关于开源项目的知识。当然也欢迎投稿至我们的「邮箱」或者「微信公众号」。
5. [捐赠](donation.md)，可以有效激发作者的创作灵感，毕竟金钱的味道还是相当提神醒脑的。


## 联系我们
:::: warning 注意
因深受阿里云销售代理混入群内发广告的困扰，凡是申请入群者请先为本项目 [捐赠5元](donation.html/#捐赠方式)，并「**备注您的QQ号**」，我们将人工审核入群人员。在此，我们对该入群方式表示歉意，同时希望互联网大厂们还技术社区一片宁静，感恩！
::::
- 邮箱：zhengjunweimail@163.com
- 官方QQ群：172299083、830015805

## ⚡ 反馈与交流

在使用过程中有任何问题和想法，请给我提 [Issue](https://gitee.com/organizations/smartboot/issues)。
你也可以在Issue查看别人提的问题和给出解决方案。

<!--
或者加入我们的交流群：

<table>
  <tbody>
    <tr>
      <td align="center" valign="middle">
        <img :src="$withBase('/wx_dyh.png')" class="no-zoom" style="width:120px;margin: 10px;">
        <p>微信公众号：「三刀」</p>
      </td>
      <td align="center" valign="middle">
        <img :src="$withBase('/img/qrcode/qqq.webp')" alt="群号: 694387113" class="no-zoom" style="width:120px;margin: 10px;">
        <p>vdoing QQ群: 694387113</p>
      </td>
    </tr>
  </tbody>
</table>
-->

<!-- AD -->
<div class="wwads-cn wwads-horizontal page-wwads" data-id="136"></div>
<style>
  .page-wwads{
    width:100%!important;
    min-height: 0;
    margin: 0;
  }
  .page-wwads .wwads-img img{
    width:80px!important;
  }
  .page-wwads .wwads-poweredby{
    width: 40px;
    position: absolute;
    right: 25px;
    bottom: 3px;
  }
  .wwads-content .wwads-text, .page-wwads .wwads-text{
    height: 100%;
    padding-top: 5px;
    display: block;
  }
</style>
