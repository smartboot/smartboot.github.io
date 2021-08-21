// const { config } = require("vuepress-theme-hope");
// const { path } = require('@vuepress/utils')
module.exports = {
    lang: 'zh-CN',
    author: '三刀',
    base: '/book/',
    title: 'smartboot 开源组织',
    description: 'smartboot 旗下开源项目文档',
    dest: './_book',
    head: [
        [
            'link', // 设置 favicon.ico，注意图片放在 public 文件夹下
            {rel: 'icon', href: 'img.png'}
        ]
    ],
    plugins: [
        // ['copyright'],
        // [
        //     '@vuepress/register-components',
        //     {
        //         componentsDir: path.resolve(__dirname, './components'),
        //     },
        // ],
    ],
    // mdEnhance: {
    //     footnote: true,
    // },
    themeConfig: {
        // Public 文件路径
        logo: '/img.png',
        docsRepo: 'https://gitee.com/smartboot/book',
        docsBranch: 'master',
        docsDir: 'docs',
        editLinkPattern: ':repo/edit/:branch/:path',
        displayAllHeaders: true,
        lastUpdatedText: '最近一次更新',
        contributors:false,
        sidebarDepth:1,
        navbar: [
            {text: '首页', link: '/', icon: "home"},
            {
                text: '开源文档',
                icon: "info",
                children: [
                    {text: 'smart-socket', link: '/smart-socket/'},
                    {text: 'smart-http', link: '/smart-http/'},
                    {text: 'smart-servlet', link: '/smart-servlet/'}
                ]
            },
            {text: '开源捐赠', link: '/donation.md'},
            {
                text: '商业产品',
                icon: "info",
                children: [
                    {text: 'Http 代理服务：Edge', link: '/smart-edge/'}
                ]
            },
            {text: '付费服务', link: '/service.md'},
            // {text: '开发团队', link: '/members.md', icon: "home"},
            {
                text: '开源仓库',
                children: [
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
        ],
        sidebar: {
            '/smart-http/': [
                {
                    isGroup: true,
                    text: '指南',
                    collapsable: false,
                    children: [
                        'about.md',
                        'security.md',
                        'http_decode.md'
                    ]
                },
                {
                    isGroup: true,
                    text: '服务端开发',
                    collapsable: false,
                    children: [
                        'getting-started-server.md',
                        'http-server-config.md',
                        'http_route.md',
                        'websocket.md',
                    ]
                },
                {
                    text: '客户端开发',
                    collapsable: false,
                    isGroup: true,
                    children: [
                        'getting-started-client.md',
                    ]
                }
            ],
            '/smart-socket/': [
                {
                    text: 'smart-socket',
                    path: '/smart-socket/',
                },
                {
                    isGroup: true,
                    text: '指南',
                    collapsable: false,
                    children: [
                        'getting-started.md',
                        'spring-integrated.md',
                        // 'about'
                    ]
                },
                {
                    isGroup: true,
                    text: '深入',
                    collapsable: false,
                    children: [
                        'java-aio-thread.md',
                        'smart-socket-plugin-design.md',
                        'smart-socket-plugin-stream-monitor.md'
                    ]
                }
            ],
            '/smart-servlet/': [
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
    }
};