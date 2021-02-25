module.exports = {
    base:'/book/',
    title: 'smartboot',
    description: 'Just playing around',
    // theme: '@vuepress/vue',
    themeConfig: {
        nav: [
            {text: '首页', link: '/'},
            {
                text: '文档',
                items: [
                    {text: 'smart-socket', link: '/smart-socket/'},
                    {text: 'smart-http', link: '/smart-http/'}
                ]
            },
            {text: '捐赠', link: '/donation.md'},
            {text: '仓库', link: 'https://gitee.com/smartboot'},
        ],
        plugins: [
            ['@vuepress/back-to-top', true],
            ['@vuepress/pwa', {
                serviceWorker: true,
                updatePopup: true
            }],
            ['@vuepress/medium-zoom', true],
            ['@vuepress/google-analytics', {
                ga: 'UA-128189152-1'
            }],
            ['container', {
                type: 'vue',
                before: '<pre class="vue-container"><code>',
                after: '</code></pre>'
            }],
            ['container', {
                type: 'upgrade',
                before: info => `<UpgradePath title="${info}">`,
                after: '</UpgradePath>'
            }],
            ['flowchart']
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
                        'file_upload',
                        'websocket',
                    ]
                },
                {
                    title: '深入',
                    collapsable: false,
                    children: [
                        'getting-started',
                        'http_route',
                        'file_upload',
                        'websocket',
                    ]
                }
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
                        '快速上手',
                    ]
                },
                {
                    title: '深入',
                    collapsable: false,
                    children: [

                    ]
                }
            ]
        },
        displayAllHeaders: true,
        lastUpdated: 'Last Updated',
    }
}