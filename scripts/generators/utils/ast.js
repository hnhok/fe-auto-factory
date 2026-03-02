/**
 * AST 辅助工具 (基于 ts-morph)
 * 提供工业级的源码安全更新能力，杜绝正则替换带来的破碎风险
 */
import { Project, SyntaxKind } from 'ts-morph'
import { existsSync } from 'fs'

/**
 * 在 Vue Router 配置文件中安全注入新路由
 */
export function injectRoute(routerPath, { path, name, componentPath, meta = {} }) {
    if (!existsSync(routerPath)) return false

    const project = new Project()
    const sourceFile = project.addSourceFileAtPath(routerPath)

    // 1. 寻找 routes 数组定义
    // 查找带有 routes 属性的对象字面量，或者名为 routes 的变量声明
    let routesArray = null

    // 方式 A: 查找 const routes = [...]
    const routesVar = sourceFile.getVariableDeclaration('routes')
    if (routesVar) {
        const initializer = routesVar.getInitializer()
        if (initializer && initializer.getKind() === SyntaxKind.ArrayLiteralExpression) {
            routesArray = initializer
        }
    }

    // 方式 B: 查找 createRouter({ routes: [...] })
    if (!routesArray) {
        const callExprs = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
        for (const call of callExprs) {
            if (call.getExpression().getText() === 'createRouter') {
                const arg = call.getArguments()[0]
                if (arg && arg.getKind() === SyntaxKind.ObjectLiteralExpression) {
                    const prop = arg.getProperty('routes')
                    if (prop && prop.getKind() === SyntaxKind.PropertyAssignment) {
                        const val = prop.getInitializer()
                        if (val && val.getKind() === SyntaxKind.ArrayLiteralExpression) {
                            routesArray = val
                        }
                    }
                }
            }
        }
    }

    if (!routesArray) return false

    // 2. 检查是否已存在该路径
    const existingRoute = routesArray.getElements().find(el => {
        if (el.getKind() === SyntaxKind.ObjectLiteralExpression) {
            const pathProp = el.getProperty('path')
            return pathProp && pathProp.getKind() === SyntaxKind.PropertyAssignment &&
                pathProp.getInitializer().getText() === `'${path}'`
        }
        return false
    })

    if (existingRoute) return true // 已存在，视为成功

    // 3. 构造新路由对象并插入
    const metaStr = Object.keys(meta).length > 0 ? `, meta: ${JSON.stringify(meta)}` : ''
    const newRouteStr = `{
    path: '${path}',
    name: '${name}',
    component: () => import('${componentPath}')${metaStr}
  }`

    routesArray.addElement(newRouteStr)

    // 4. 保存更改
    sourceFile.saveSync()
    return true
}

/**
 * 通用：在文件的 Top-level 注入 Import 语句 (如果不存在)
 */
export function ensureImport(filePath, moduleSpecifier, namedImports = []) {
    const project = new Project()
    const sourceFile = project.addSourceFileAtPath(filePath)

    const existingImport = sourceFile.getImportDeclaration(moduleSpecifier)
    if (!existingImport) {
        sourceFile.addImportDeclaration({
            moduleSpecifier,
            namedImports: namedImports.map(n => ({ name: n }))
        })
    } else {
        namedImports.forEach(name => {
            if (!existingImport.getNamedImports().some(ni => ni.getName() === name)) {
                existingImport.addNamedImport(name)
            }
        })
    }

    sourceFile.saveSync()
}
