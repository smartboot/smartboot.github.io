(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[466],{300:(n,s,a)=>{"use strict";a.r(s),a.d(s,{data:()=>p});const p={key:"v-3a2267fd",path:"/smart-http/http_route.html",title:"请求路由",lang:"zh-CN",frontmatter:{author:"三刀"},excerpt:"",headers:[],filePathRelative:"smart-http/http_route.md",git:{updatedTime:1623571657e3,contributors:[{name:"三刀",email:"zhengjunweimail@163.com",commits:4}]}}},9687:(n,s,a)=>{"use strict";a.r(s),a.d(s,{default:()=>t});const p=(0,a(6252).uE)('<h1 id="请求路由"><a class="header-anchor" href="#请求路由">#</a> 请求路由</h1><p>熟悉 Servlet 或者 Spring MVC 开发的人应该对这个不陌生， 前端请求的不同接口，需要路由到不同 Servlet 或者 Controller 中进行处理。</p><p>smart-http 也提供了请求路由的支持，使用时需要用到<code>HttpRouteHandler</code>。</p><div class="language-java ext-java line-numbers-mode"><pre class="language-java"><code><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">HttpRouteDemo</span> <span class="token punctuation">{</span>\n    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">void</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token class-name">String</span><span class="token punctuation">[</span><span class="token punctuation">]</span> args<span class="token punctuation">)</span> <span class="token punctuation">{</span>\n        <span class="token comment">//1. 实例化路由Handle</span>\n        <span class="token class-name">HttpRouteHandler</span> routeHandle <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">HttpRouteHandler</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n\n        <span class="token comment">//2. 指定路由规则以及请求的处理实现</span>\n        routeHandle<span class="token punctuation">.</span><span class="token function">route</span><span class="token punctuation">(</span><span class="token string">&quot;/&quot;</span><span class="token punctuation">,</span> <span class="token keyword">new</span> <span class="token class-name">HttpServerHandler</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>\n            <span class="token annotation punctuation">@Override</span>\n            <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">handle</span><span class="token punctuation">(</span><span class="token class-name">HttpRequest</span> request<span class="token punctuation">,</span> <span class="token class-name">HttpResponse</span> response<span class="token punctuation">)</span> <span class="token keyword">throws</span> <span class="token class-name">IOException</span> <span class="token punctuation">{</span>\n                response<span class="token punctuation">.</span><span class="token function">write</span><span class="token punctuation">(</span><span class="token string">&quot;smart-http&quot;</span><span class="token punctuation">.</span><span class="token function">getBytes</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n            <span class="token punctuation">}</span>\n        <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">route</span><span class="token punctuation">(</span><span class="token string">&quot;/test1&quot;</span><span class="token punctuation">,</span> <span class="token keyword">new</span> <span class="token class-name">HttpServerHandler</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>\n            <span class="token annotation punctuation">@Override</span>\n            <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">handle</span><span class="token punctuation">(</span><span class="token class-name">HttpRequest</span> request<span class="token punctuation">,</span> <span class="token class-name">HttpResponse</span> response<span class="token punctuation">)</span> <span class="token keyword">throws</span> <span class="token class-name">IOException</span> <span class="token punctuation">{</span>\n                response<span class="token punctuation">.</span><span class="token function">write</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token string">&quot;test1&quot;</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">getBytes</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n            <span class="token punctuation">}</span>\n        <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">route</span><span class="token punctuation">(</span><span class="token string">&quot;/test2&quot;</span><span class="token punctuation">,</span> <span class="token keyword">new</span> <span class="token class-name">HttpServerHandler</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>\n            <span class="token annotation punctuation">@Override</span>\n            <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">handle</span><span class="token punctuation">(</span><span class="token class-name">HttpRequest</span> request<span class="token punctuation">,</span> <span class="token class-name">HttpResponse</span> response<span class="token punctuation">)</span> <span class="token keyword">throws</span> <span class="token class-name">IOException</span> <span class="token punctuation">{</span>\n                response<span class="token punctuation">.</span><span class="token function">write</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token string">&quot;test2&quot;</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">getBytes</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n            <span class="token punctuation">}</span>\n        <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n\n        <span class="token comment">// 3. 启动服务</span>\n        <span class="token class-name">HttpBootstrap</span> bootstrap <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">HttpBootstrap</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n        bootstrap<span class="token punctuation">.</span><span class="token function">pipeline</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">next</span><span class="token punctuation">(</span>routeHandle<span class="token punctuation">)</span><span class="token punctuation">;</span>\n        bootstrap<span class="token punctuation">.</span><span class="token function">start</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n    <span class="token punctuation">}</span>\n<span class="token punctuation">}</span>\n</code></pre><div class="line-numbers"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br><span class="line-number">16</span><br><span class="line-number">17</span><br><span class="line-number">18</span><br><span class="line-number">19</span><br><span class="line-number">20</span><br><span class="line-number">21</span><br><span class="line-number">22</span><br><span class="line-number">23</span><br><span class="line-number">24</span><br><span class="line-number">25</span><br><span class="line-number">26</span><br><span class="line-number">27</span><br><span class="line-number">28</span><br><span class="line-number">29</span><br></div></div><p>当然，如果 smart-http 默认提供的路由组件满足不了你的需求，用户也可以通过继承<code>HttpServerHandler</code>自己实现一套请求路由算法。</p>',5),t={render:function(n,s){return p}}}}]);