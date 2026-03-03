/**
 * AST 辅助工具 (基于 ts-morph)
 * 提供工业级的源码安全更新能力，杜绝正则替换带来的破碎风险
 */
import { Project, SyntaxKind } from 'ts-morph'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

/**
 * [v2.7.0] 在 Vue Router 配置文件中安全注入新路由
 */
export function updateRouterSafely({ cwd, page_id, kebab, meta = {} }) {
    const project = new Project()
    // 自动寻找路由入口文件
    const possiblePaths = [
        join(cwd, 'src/router/index.ts'),
        join(cwd, 'src/router/index.js'),
        join(cwd, 'src/router.ts')
    ]
    const routerPath = possiblePaths.find(p => existsSync(p))
    if (!routerPath) return false

    const sourceFile = project.addSourceFileAtPath(routerPath)

    // 寻找 routes 数组
    let routesArray = sourceFile.getVariableDeclaration('routes')?.getInitializer()
    if (!routesArray || routesArray.getKind() !== SyntaxKind.ArrayLiteralExpression) {
        // 尝试从 createRouter 调用中寻找
        const callExpr = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
            .find(c => c.getExpression().getText() === 'createRouter')
        const arg = callExpr?.getArguments()[0]
        if (arg && arg.getKind() === SyntaxKind.ObjectLiteralExpression) {
            routesArray = arg.getProperty('routes')?.getInitializer()
        }
    }

    if (!routesArray || routesArray.getKind() !== SyntaxKind.ArrayLiteralExpression) return false

    // 检查是否已存在
    const path = `/${kebab}`
    const isExist = routesArray.getElements().some(el => {
        if (el.getKind() === SyntaxKind.ObjectLiteralExpression) {
            return el.getProperty('path')?.getInitializer()?.getText() === `'${path}'`
        }
        return false
    })

    if (isExist) return true

    // 插入新路由
    const metaStr = Object.keys(meta).length > 0 ? `, meta: ${JSON.stringify(meta)}` : ''
    const newRoute = `{
    path: '${path}',
    name: '${page_id}',
    component: () => import('@/views/${page_id}/index.vue')${metaStr}
  }`

    routesArray.addElement(newRoute)
    sourceFile.saveSync()
    console.log(`  ✔ Router: ${path} 已安全注入 (AST)`)
    return true
}

/**
 * 增量同步埋点资产 (枚举)
 */
export function syncTrackingAssets({ cwd, track = [] }) {
    if (!track.length) return
    const possiblePaths = [
        join(cwd, 'src/constants/tracking.ts'),
        join(cwd, 'src/utils/track.ts')
    ]
    const trackFile = possiblePaths.find(p => existsSync(p))
    if (!trackFile) return

    const project = new Project()
    const sourceFile = project.addSourceFileAtPath(trackFile)
    const trackEnum = sourceFile.getEnum('TRACKING_EVENTS') || sourceFile.getEnums()[0]
    if (!trackEnum) return

    track.forEach(eventId => {
        const enumKey = eventId.toUpperCase().replace(/-/g, '_')
        if (!trackEnum.getMember(enumKey)) {
            trackEnum.addMember({ name: enumKey, value: eventId })
            console.log(`    ✔ 增量更新埋点枚举: ${enumKey}`)
        }
    })
    sourceFile.saveSync()
}

/**
 * 注入组件级埋点代码 (TODO: 增强版本)
 */
export function injectComponentTracking({ cwd, name, trackId }) {
    console.log(`    [AST] TODO: 为组件 ${name} 注入埋点 ${trackId}`)
}

/**
 * 确保 Enum 中包含特定的成员
 */
export function ensureEnumMember(filePath, enumName, { name, value }) {
    if (!existsSync(filePath)) return false
    const project = new Project()
    const sourceFile = project.addSourceFileAtPath(filePath)
    const enumDeclaration = sourceFile.getEnum(enumName)
    if (!enumDeclaration) return false
    if (!enumDeclaration.getMember(name)) {
        enumDeclaration.addMember({ name, value })
        sourceFile.saveSync()
    }
    return true
}

/**
 * 确保命名导出
 */
export function ensureNamedExport(filePath, { name, content }) {
    if (!existsSync(filePath)) return false
    const project = new Project()
    const sourceFile = project.addSourceFileAtPath(filePath)
    if (!sourceFile.getExportedDeclarations().has(name)) {
        sourceFile.addStatements(`\nexport ${content}`)
        sourceFile.saveSync()
    }
    return true
}

/**
 * 确保导入
 */
export function ensureImport(filePath, moduleSpecifier, namedImports = []) {
    if (!existsSync(filePath)) return false
    const project = new Project()
    const sourceFile = project.addSourceFileAtPath(filePath)
    let decl = sourceFile.getImportDeclaration(moduleSpecifier)
    if (!decl) {
        sourceFile.addImportDeclaration({ moduleSpecifier, namedImports: namedImports.map(n => ({ name: n })) })
    } else {
        namedImports.forEach(name => {
            if (!decl.getNamedImports().some(ni => ni.getName() === name)) {
                decl.addNamedImport(name)
            }
        })
    }
    sourceFile.saveSync()
}
/**
 * [v2.9.0] 提取文件中的特定区段 (基于标记注释)
 * 用于支持生成的 Vue 文件中保留用户自定义代码
 */
export function extractSection(content, startTag, endTag) {
    const startIdx = content.indexOf(startTag)
    const endIdx = content.indexOf(endTag)
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        return content.substring(startIdx + startTag.length, endIdx).trim()
    }
    return null
}

/**
 * [v3.0.0] Smart Patching for TS/Hook files
 * 方法级别的热插拔: 自动比对已有函数并增量合并修改 (取代简单的块级正则保留)
 */
export function smartPatchHook(filePath, newContent, hookName) {
    if (!existsSync(filePath)) {
        writeFileSync(filePath, newContent, 'utf-8')
        return true
    }

    const project = new Project()
    const existingFile = project.addSourceFileAtPath(filePath)
    const newFile = project.createSourceFile('temp_new.ts', newContent)

    // 1. 合并 Imports (避免覆盖已有的其他 imports)
    newFile.getImportDeclarations().forEach(newImp => {
        const mod = newImp.getModuleSpecifierValue()
        const existImp = existingFile.getImportDeclaration(mod)
        if (!existImp) {
            existingFile.addImportDeclaration(newImp.getStructure())
        } else {
            newImp.getNamedImports().forEach(named => {
                const nameStr = named.getName()
                if (!existImp.getNamedImports().some(n => n.getName() === nameStr)) {
                    existImp.addNamedImport({ name: nameStr })
                }
            })
        }
    })

    // 2. 找到对应的 Hook 主函数
    const existFunc = existingFile.getFunction(hookName)
    const newFunc = newFile.getFunction(hookName)

    if (existFunc && newFunc) {
        // 2.1 增量合并响应式 State (比如因为 Schema 新增了 field 需要注入新的 state 属性)
        const existStateVar = existFunc.getVariableDeclaration('state')
        const newStateVar = newFunc.getVariableDeclaration('state')

        if (existStateVar && newStateVar) {
            const existStateObj = existStateVar.getInitializerIfKind(SyntaxKind.CallExpression)
                ?.getArguments()[0]?.asKind(SyntaxKind.ObjectLiteralExpression)
            const newStateObj = newStateVar.getInitializerIfKind(SyntaxKind.CallExpression)
                ?.getArguments()[0]?.asKind(SyntaxKind.ObjectLiteralExpression)

            if (existStateObj && newStateObj) {
                newStateObj.getProperties().forEach(prop => {
                    if (prop.getKind() === SyntaxKind.PropertyAssignment) {
                        const propName = prop.getName()
                        if (!existStateObj.getProperty(propName)) {
                            existStateObj.addPropertyAssignment({ name: propName, initializer: prop.getInitializer()?.getText() || 'undefined' })
                            console.log(`    ✔ [AST Patch] State 属性智能注入: ${propName}`)
                        }
                    }
                })
            }
        }

        // 2.2 合并内部方法 (如果存在新的 fetch 请求等，且目标不存在，则合并)
        // 注意，使用 Variable 声明处理 (因为 Vue3 hook 常写成 const func = () => {})
        const newVars = newFunc.getVariableDeclarations()
        newVars.forEach(v => {
            const vName = v.getName()
            // 如果旧代码没有这个方法或变量(排除系统级别变量 like loading, error)
            if (!existFunc.getVariableDeclaration(vName)) {
                const stmt = v.getVariableStatement()
                if (stmt && vName !== 'state' && vName !== 'loading' && vName !== 'error') {
                    existFunc.insertStatements(existFunc.getStatements().length - 1, stmt.getText())
                    console.log(`    ✔ [AST Patch] 方法智能注入: ${vName}`)
                }
            }
        })

        // 2.3 自动合并 Return Statement 以暴露新方法
        const existReturn = existFunc.getStatements().find(s => s.getKind() === SyntaxKind.ReturnStatement)
        const newReturn = newFunc.getStatements().find(s => s.getKind() === SyntaxKind.ReturnStatement)

        if (existReturn && newReturn) {
            const existRetObj = existReturn.getExpressionIfKind(SyntaxKind.ObjectLiteralExpression)
            const newRetObj = newReturn.getExpressionIfKind(SyntaxKind.ObjectLiteralExpression)

            if (existRetObj && newRetObj) {
                newRetObj.getProperties().forEach(prop => {
                    const propName = prop.getName()
                    if (!existRetObj.getProperty(propName)) {
                        existRetObj.addShorthandPropertyAssignment({ name: propName })
                        console.log(`    ✔ [AST Patch] 暴露方法导出: ${propName}`)
                    }
                })
            }
        }

        existingFile.saveSync()
        return true
    }

    // 如果找不到指定的 Hook 函数块，可能已经被彻底重写，安全起见退回保留区块方式或不操作
    console.log(`    ⚠ [AST Patch] 未匹配到标准结构，已通过旧有机制合并。`)
    return false
}
