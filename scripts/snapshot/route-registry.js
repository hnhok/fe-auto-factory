import { Project, SyntaxKind } from 'ts-morph'
import { join } from 'path'
import { existsSync } from 'fs'

export function buildRouteRegistry(cwd) {
    const project = new Project()
    const possiblePaths = [
        join(cwd, 'src/router/index.ts'),
        join(cwd, 'src/router/index.js'),
        join(cwd, 'src/router.ts')
    ]
    const routerPath = possiblePaths.find(p => existsSync(p))
    if (!routerPath) return []

    const sourceFile = project.addSourceFileAtPath(routerPath)

    // Fallback detection logic
    let routesArray
    const variableDecl = sourceFile.getVariableDeclaration('routes')
    if (variableDecl) {
        routesArray = variableDecl.getInitializerIfKind(SyntaxKind.ArrayLiteralExpression)
    }

    if (!routesArray) {
        const callExpr = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
            .find(c => c.getExpression().getText() === 'createRouter')
        if (callExpr) {
            const arg = callExpr.getArguments()[0]
            if (arg && arg.getKind() === SyntaxKind.ObjectLiteralExpression) {
                const prop = arg.getProperty('routes')
                if (prop && prop.getKind() === SyntaxKind.PropertyAssignment) {
                    routesArray = prop.getInitializerIfKind(SyntaxKind.ArrayLiteralExpression)
                }
            }
        }
    }

    if (!routesArray) return []

    function parseRoutesArray(arrayNode) {
        const result = []
        arrayNode.getElements().forEach(el => {
            if (el.getKind() === SyntaxKind.ObjectLiteralExpression) {
                const routeObj = {}
                const pathProp = el.getProperty('path')
                const nameProp = el.getProperty('name')

                if (pathProp && pathProp.getKind() === SyntaxKind.PropertyAssignment) {
                    routeObj.path = pathProp.getInitializer()?.getText().replace(/['"`]/g, '')
                }
                if (nameProp && nameProp.getKind() === SyntaxKind.PropertyAssignment) {
                    routeObj.name = nameProp.getInitializer()?.getText().replace(/['"`]/g, '')
                }

                let metaText = ''
                const metaProp = el.getProperty('meta')
                if (metaProp && metaProp.getKind() === SyntaxKind.PropertyAssignment) {
                    const metaObj = metaProp.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression)
                    if (metaObj) {
                        const titleProp = metaObj.getProperty('title')
                        if (titleProp && titleProp.getKind() === SyntaxKind.PropertyAssignment) {
                            metaText = titleProp.getInitializer()?.getText().replace(/['"`]/g, '')
                        }
                    }
                }

                const childrenProp = el.getProperty('children')
                if (childrenProp && childrenProp.getKind() === SyntaxKind.PropertyAssignment) {
                    const childrenArray = childrenProp.getInitializerIfKind(SyntaxKind.ArrayLiteralExpression)
                    if (childrenArray) {
                        routeObj.children = parseRoutesArray(childrenArray)
                    }
                }

                // Construct Tree label
                let lbl = `路由: ${routeObj.path || '未知'}`
                if (metaText) lbl += ` [${metaText}]`
                if (routeObj.name) lbl += ` <${routeObj.name}>`
                routeObj.label = lbl

                result.push(routeObj)
            }
        })
        return result
    }

    return parseRoutesArray(routesArray)
}
