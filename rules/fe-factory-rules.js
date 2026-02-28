/**
 * FE-Factory 自定义 ESLint 规则集
 * 将历史最佳实践和踩坑经验固化为可执行的规则
 *
 * 在项目的 eslint.config.js 中引入:
 * import feFactoryRules from '../fe-auto-factory/rules/fe-factory-rules.js'
 */

export default {
    // ─── 规则元信息 ────────────────────────────────────────────────────────────
    meta: {
        name: 'fe-factory-rules',
        version: '1.0.0',
    },

    // ─── 规则定义 ──────────────────────────────────────────────────────────────
    rules: {

        /**
         * 规则: no-magic-api-url
         * 禁止在代码中硬编码 API 路径字符串，必须使用 API Service 函数
         * ❌ fetch('/api/order/list')
         * ✅ getOrderList()
         */
        'no-magic-api-url': {
            meta: {
                type: 'problem',
                docs: { description: '禁止硬编码 API URL，必须使用 API Service 函数' },
                schema: [],
                messages: {
                    noMagicUrl: '禁止直接使用 API 路径 "{{url}}"，请在 src/api/ 中定义 Service 函数并调用',
                },
            },
            create(context) {
                return {
                    Literal(node) {
                        if (
                            typeof node.value === 'string' &&
                            /^\/api\//.test(node.value) &&
                            // 允许在 api/ 目录下的文件中定义
                            !context.getFilename().includes('/api/')
                        ) {
                            context.report({
                                node,
                                messageId: 'noMagicUrl',
                                data: { url: node.value },
                            })
                        }
                    },
                }
            },
        },

        /**
         * 规则: require-data-track-id
         * 可交互的 Vant 按钮必须有 data-track-id 属性（用于声明式埋点）
         * ❌ <van-button @click="buy">购买</van-button>
         * ✅ <van-button data-track-id="buy-now-click" @click="buy">购买</van-button>
         */
        'require-data-track-id': {
            meta: {
                type: 'suggestion',
                docs: { description: '可交互组件必须携带 data-track-id 埋点属性' },
                schema: [],
                messages: {
                    missingTrackId: '<{{component}}> 有点击事件但缺少 data-track-id 属性，无法自动埋点',
                },
            },
            create(context) {
                const TRACK_COMPONENTS = ['van-button', 'van-cell', 'van-tab', 'van-grid-item', 'van-action-sheet']
                return {
                    VElement(node) {
                        const name = node.rawName?.toLowerCase()
                        if (!TRACK_COMPONENTS.includes(name)) return

                        const hasClick = node.startTag.attributes.some(
                            attr => attr.key?.name === 'onClick' || attr.directive?.key?.name === 'click'
                        )
                        const hasTrackId = node.startTag.attributes.some(
                            attr => attr.key?.name === 'data-track-id'
                        )

                        if (hasClick && !hasTrackId) {
                            context.report({
                                node: node.startTag,
                                messageId: 'missingTrackId',
                                data: { component: name },
                            })
                        }
                    },
                }
            },
        },

        /**
         * 规则: no-direct-store-mutation (建议通过 Pinia action 修改状态)
         * ❌ store.userInfo = newData
         * ✅ store.setUserInfo(newData)
         */
        'no-direct-store-mutation': {
            meta: {
                type: 'problem',
                docs: { description: '禁止直接赋值修改 Pinia store state，必须通过 action' },
                schema: [],
                messages: {
                    directMutation: '禁止直接修改 store.{{prop}}，请使用对应的 action 方法',
                },
            },
            create(context) {
                return {
                    AssignmentExpression(node) {
                        const left = node.left
                        if (
                            left.type === 'MemberExpression' &&
                            left.object?.name?.endsWith('Store') &&
                            !left.property?.name?.startsWith('$')
                        ) {
                            context.report({
                                node,
                                messageId: 'directMutation',
                                data: { prop: left.property?.name || '?' },
                            })
                        }
                    },
                }
            },
        },

        /**
         * 规则: require-async-error-handling
         * async 函数必须有 try/catch 包裹（防止未处理的 Promise 错误）
         * 仅对 API 调用函数（名称含 fetch/get/post/request/load）有效
         */
        'require-async-error-handling': {
            meta: {
                type: 'suggestion',
                docs: { description: 'API 调用函数必须包含 try/catch 错误处理' },
                schema: [],
                messages: {
                    missingTryCatch: '异步函数 "{{name}}" 调用了 API 但缺少 try/catch，可能导致未捕获的错误',
                },
            },
            create(context) {
                const API_PATTERNS = /^(fetch|get|post|load|request|call|submit)/i
                return {
                    'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression'(node) {
                        if (!node.async) return
                        const name = node.id?.name || node.parent?.id?.name || ''
                        if (!API_PATTERNS.test(name)) return

                        // 检查函数体是否有 try 语句
                        const hasTryCatch = node.body?.body?.some(s => s.type === 'TryStatement')
                        if (!hasTryCatch) {
                            context.report({
                                node,
                                messageId: 'missingTryCatch',
                                data: { name: name || 'anonymous' },
                            })
                        }
                    },
                }
            },
        },

        /**
         * 规则: no-console-log-in-production
         * 禁止在非 debug 模式下使用 console.log（允许 console.error/warn）
         */
        'no-console-log-in-production': {
            meta: {
                type: 'suggestion',
                docs: { description: '生产代码中禁止使用 console.log，使用 console.error/warn 替代' },
                fixable: 'code',
                schema: [],
                messages: {
                    noConsoleLog: '使用 console.log 会泄露调试信息，请删除或改为 console.error/warn',
                },
            },
            create(context) {
                // 跳过测试文件
                const filename = context.getFilename()
                if (filename.includes('.spec.') || filename.includes('.test.')) return {}

                return {
                    'CallExpression[callee.object.name="console"][callee.property.name="log"]'(node) {
                        context.report({
                            node,
                            messageId: 'noConsoleLog',
                            fix(fixer) {
                                // Auto-fix: 注释掉 console.log
                                const src = context.getSourceCode().getText(node)
                                return fixer.replaceText(node, `/* ${src} */`)
                            },
                        })
                    },
                }
            },
        },
    },
}
