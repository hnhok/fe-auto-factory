/**
 * FE-Auto-Factory Component Registry
 * 扫描项目中已有的业务组件（全局 + 页面级），
 * 避免对已存在的组件重复生成，并返回正确的 import 路径供视图模板引用。
 */
import { existsSync, readdirSync, statSync } from 'fs'
import { join, relative, basename, extname } from 'path'

/**
 * 递归扫描某目录下所有 .vue / .tsx / .jsx 组件文件
 * @param {string} dir  扫描根目录（绝对路径）
 * @param {string[]} [result]
 * @returns {{ name: string, absPath: string }[]}  组件名 -> 绝对路径
 */
function scanComponents(dir, result = []) {
    if (!existsSync(dir)) return result
    for (const entry of readdirSync(dir)) {
        const abs = join(dir, entry)
        const stat = statSync(abs)
        if (stat.isDirectory()) {
            scanComponents(abs, result)
        } else {
            const ext = extname(entry)
            if (['.vue', '.tsx', '.jsx'].includes(ext)) {
                result.push({ name: basename(entry, ext), absPath: abs })
            }
        }
    }
    return result
}

/**
 * 构建当前项目的组件注册表（全局 + all 页面内的 components 子目录）
 * @param {string} cwd          项目根目录
 * @param {string} [viewsDir]   业务视图目录（默认 src/views）
 * @param {string} [globalDir]  全局组件目录（默认 src/components）
 * @returns {Map<string, string>}  componentName -> absPath
 */
export function buildComponentRegistry(cwd, viewsDir = 'src/views', globalDir = 'src/components') {
    const registry = new Map()

    // 1. 扫描全局共享组件目录 src/components/**
    const globalComponents = scanComponents(join(cwd, globalDir))
    for (const { name, absPath } of globalComponents) {
        registry.set(name, absPath)
    }

    // 2. 扫描所有页面的 components 子目录（低优先级，全局覆盖页面级）
    const viewsRoot = join(cwd, viewsDir)
    if (existsSync(viewsRoot)) {
        for (const page of readdirSync(viewsRoot)) {
            const pageComponentsDir = join(viewsRoot, page, 'components')
            const pageComponents = scanComponents(pageComponentsDir)
            for (const { name, absPath } of pageComponents) {
                // 全局同名时不覆盖（优先用全局）
                if (!registry.has(name)) {
                    registry.set(name, absPath)
                }
            }
        }
    }

    return registry
}

/**
 * 根据已注册的组件清单，将 Schema 的 components 列表分为两类：
 * - existing: 已存在的组件 + 它的 import 路径（相对于目标页面目录）
 * - toGenerate: 需要新建的组件名
 *
 * @param {string[]} components         Schema 中声明的组件列表
 * @param {string}   currentPageDir     当前页面目录（用于计算相对路径）
 * @param {Map}      registry           buildComponentRegistry 的返回值
 * @param {string[]} [libPrefixes]      UI 库前缀，前缀匹配的视为三方库，不扫描
 * @returns {{ existing: { name, importPath }[], toGenerate: string[] }}
 */
export function classifyComponents(
    components = [],
    currentPageDir,
    registry,
    libPrefixes = ['Van', 'El', 'Ant', 'Base']
) {
    const existing = []
    const toGenerate = []

    for (const name of components) {
        const isLib = libPrefixes.some(p => name.startsWith(p))
        if (isLib) continue  // UI 库组件不参与本地扫描，跳过

        if (registry.has(name)) {
            const absPath = registry.get(name)
            // 计算从当前页面目录到已有组件的相对路径（用于 import）
            const rel = relative(currentPageDir, absPath).replace(/\\/g, '/')
            const importPath = rel.startsWith('.') ? rel : `./${rel}`
            // 去除文件后缀（TS import 习惯）
            const importPathNoExt = importPath.replace(/\.(vue|tsx|jsx)$/, '')
            existing.push({ name, importPath: importPathNoExt, absPath })
        } else {
            toGenerate.push(name)
        }
    }

    return { existing, toGenerate }
}
