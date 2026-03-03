import { defineConfig } from 'vitepress'

export default defineConfig({
    title: "FE-Auto-Factory",
    description: "企业级前端自动化生成工厂与架构方案",
    themeConfig: {
        nav: [
            { text: '首页', link: '/' },
            { text: '指南', link: '/guide/introduction' },
            { text: '架构揭秘', link: '/architecture/overview' },
            { text: 'AI 工作流', link: '/workflow/vision-agent' }
        ],

        sidebar: {
            '/guide/': [
                {
                    text: '基础与入门',
                    items: [
                        { text: '项目演变与介绍', link: '/guide/introduction' },
                        { text: '快速上手实战', link: '/guide/getting-started' },
                        { text: '迭代更新日志 (Changelog)', link: '/guide/changelog' }
                    ]
                },
                {
                    text: '核心功能',
                    items: [
                        { text: 'Schema 图纸规范 (Core)', link: '/guide/schema-reference' },
                        { text: '同步后端 Swagger API', link: '/guide/swagger-to-schema' }
                    ]
                },
                {
                    text: '演进规划',
                    items: [
                        { text: '未来演进规划 (Roadmap)', link: '/ROADMAP' }
                    ]
                }
            ],
            '/architecture/': [
                {
                    text: '内核解析',
                    items: [
                        { text: '微内核全景大盘', link: '/architecture/overview' },
                        { text: 'EJS模板与AST无损热缝合', link: '/architecture/ejs-and-ast' },
                        { text: '开发 NPM 渲染沙箱插件', link: '/architecture/plugin-development' }
                    ]
                }
            ],
            '/workflow/': [
                {
                    text: 'AI 工作流体系',
                    items: [
                        { text: '从视觉稿直推业务骨架 (Vision)', link: '/workflow/vision-agent' },
                        { text: '四大阶段守卫 (Pipeline)', link: '/workflow/skill-system' }
                    ]
                }
            ]
        },

        socialLinks: [
            { icon: 'github', link: 'https://github.com/hnhok/fe-auto-factory' }
        ]
    }
})
