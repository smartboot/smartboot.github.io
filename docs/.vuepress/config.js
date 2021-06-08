const { config } = require("vuepress-theme-hope");
module.exports = config({
    baseLang:'zh-CN',
    author:'三刀',
    base:'/book/',
    title: 'SmartBoot',
    dest:'./_book',
    head: [
        [
            'link', // 设置 favicon.ico，注意图片放在 public 文件夹下
            { rel: 'icon', href: 'img.png' }
        ]
    ],
    plugins: [
        ['copyright'],
    ],
    // mdEnhance: {
    //     footnote: true,
    // },
    themeConfig: {
        nav: [
            {text: '首页', link: '/',icon: "home"},
            {
                text: '文档',
                icon: "info",
                items: [
                    {text: 'smart-socket', link: '/smart-socket/'},
                    {text: 'smart-http', link: '/smart-http/'},
                    {text: 'smart-servlet', link: '/smart-servlet/'}
                ]
            },
            {text: '开发团队', link: '/members',icon: "home"},
            {text: '开源众筹', link: '/crowdfunding',icon: "home"},
            {
                text: '了解更多',
                ariaLabel: '了解更多',
                items: [
                    {text: '关于捐赠', link: '/donation'},
                    {text: '付费服务', link: '/service'},
                    {
                        text: '开源仓库',
                        items: [
                            {
                                text: 'Gitee',
                                link: 'https://gitee.com/smartboot'
                            },
                            {
                                text: 'Github',
                                link: 'https://github.com/smartboot'
                            }
                        ]
                    }
                ]
            },
        ],
        sidebar: {
            '/smart-http/': [
                {
                    title: 'smart-http',
                    path: '/smart-http/',
                },
                {
                    title: '指南',
                    collapsable: false,
                    children: [
                        'getting-started',
                        'http_route',
                        'http_decode',
                        'websocket',
                    ]
                },
            ],
            '/smart-socket/':[
                {
                    title: 'smart-socket',
                    path: '/smart-socket/',
                },
                {
                    title: '指南',
                    collapsable: false,
                    children: [
                        'getting-started',
                        'spring-integrated',
                        // 'about'
                    ]
                },
                {
                    title: '深入',
                    collapsable: false,
                    children: [
                        'java-aio-thread',
                        'smart-socket-plugin-design'
                    ]
                }
            ],
            '/smart-servlet/':[
                {
                    title: 'smart-servlet',
                    path: '/smart-servlet/',
                },
                {
                    title: '指南',
                    collapsable: false,
                    children: [
                        // 'getting-started',
                        // 'plugins',
                    ]
                },
            ]
        },
        displayAllHeaders: true,
        lastUpdated: 'Last Updated',
    }
});