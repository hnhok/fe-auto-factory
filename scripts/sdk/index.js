/**
 * FE-Auto-Factory Plugin SDK 首发版 [v3.2.0]
 * 面向 npm 插件开发者 (Plugin Developers) 暴露的底层基建原子能。
 * 允许独立的驱动包 (如 @fe-factory/plugin-vue3-element) 直接复用 AST、文件合并等能力。
 */

// 重导 AST 高级合并算法
export {
    updateRouterSafely,
    syncTrackingAssets,
    injectComponentTracking,
    extractSection,
    smartPatchHook
} from '../generators/utils/ast.js'

// 重导 Base CRUD 标准生成能力
export {
    getFactoryConfig,
    generateTypesFile,
    generateMockFile,
    generateApiFile,
    generateStoreFile,
    generateTestFile,
    generateComponentScaffolds
} from '../generators/base.js'

// 重导工具集
export {
    toKebabCase,
    toCamelCase
} from '../utils/string.js'

export {
    parseFrontmatter
} from '../utils/schema.js'

// 重导视觉快照系统 (Vision Snapshot Store)
export {
    saveSnapshot,
    listSnapshots,
    findByImageHash,
    findByKeyword,
    deleteSnapshot
} from '../snapshot/store.js'

export {
    findSimilarSnapshots,
    findBestMatch
} from '../snapshot/matcher.js'
