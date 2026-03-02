import { defineConfig } from 'vitepress'

export default defineConfig({
    title: "FE-Auto-Factory",
    description: "企业级前端自动化生成工厂与架构方案",
    themeConfig: {
        nav: [
            { text: '首页', link: '/' },
            { text: '指南', link: '/guide/getting-started' },
            { text: '架构揭秘', link: '/architecture/' },
            { text: 'Schema 规范', link: '/guide/schema' }
        ],

        sidebar: {
            '/guide/': [
                {
                    text: '入门指南',
                    items: [
                        { text: '快速上手', link: '/guide/getting-started' },
                        { text: '迭代更新日志 (Changelog)', link: '/guide/changelog' },
                        { text: 'Schema 配置', link: '/guide/schema' },
                        { text: '高级布局 (Layout)', link: '/guide/layout' }
                    ]
                },
                {
                    text: '进阶特性',
                    items: [
                        { text: '同步后端 Swagger', link: '/guide/sync-swagger' },
                        { text: '扩展与自定义 Hook', link: '/guide/advanced' }
                    ]
                }
            ],
            '/architecture/': [
                {
                    text: '核心架构',
                    items: [
                        { text: '设计哲学', link: '/architecture/' },
                        { text: 'CLI 核心引擎', link: '/architecture/cli-engine' },
                        { text: '模板挂载与增量更新', link: '/architecture/generators' },
                        { text: '自动化测试体系', link: '/architecture/testing' }
                    ]
                }
            ]
        },

        socialLinks: [
            { icon: 'github', link: 'https://github.com/your-org/fe-auto-factory' }
        ]
    }
})
