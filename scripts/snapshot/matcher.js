/**
 * FE-Auto-Factory Vision Snapshot Matcher
 * 基于 Schema 语义相似度，从快照库中找出与当前图纸最接近的历史记录。
 * 策略：组件重合度 50% + 接口名重合度 30% + 状态字段重合度 20%
 */
import { listSnapshots } from './store.js'

/**
 * 计算两个字符串数组的 Jaccard 相似度 (交集/并集)
 * @returns {number} 0 ~ 1
 */
function jaccardSimilarity(arrA = [], arrB = []) {
    if (!arrA.length && !arrB.length) return 1
    const setA = new Set(arrA.map(s => String(s).toLowerCase()))
    const setB = new Set(arrB.map(s => String(s).toLowerCase()))
    let intersection = 0
    for (const item of setA) {
        if (setB.has(item)) intersection++
    }
    const union = setA.size + setB.size - intersection
    return union === 0 ? 0 : intersection / union
}

/**
 * 计算 features 对象的相似度（key + value 共同匹配）
 */
function featuresSimilarity(featA = {}, featB = {}) {
    const keysA = Object.keys(featA)
    const keysB = Object.keys(featB)
    if (!keysA.length && !keysB.length) return 1
    const matchingKeys = keysA.filter(k => keysB.includes(k) && featA[k] === featB[k])
    const totalKeys = new Set([...keysA, ...keysB]).size
    return totalKeys === 0 ? 0 : matchingKeys.length / totalKeys
}

/**
 * 对一份 Schema 计算它与已有快照集的综合相似度评分
 * @param {object} candidateSchema  待匹配的新 Schema
 * @param {string} cwd              项目根目录
 * @param {number} threshold        最低相似度阈值（0.0 ~ 1.0），默认 0.45
 * @returns {{ score: number, snapshot: object }[]} 按评分降序排列的结果
 */
export function findSimilarSnapshots(candidateSchema, cwd = process.cwd(), threshold = 0.45) {
    const snapshots = listSnapshots(cwd)
    if (!snapshots.length) return []

    const results = snapshots.map(snap => {
        const s = snap.schema || {}

        // 1. 组件重合度（权重 50%）
        const compScore = jaccardSimilarity(
            candidateSchema.components || [],
            s.components || []
        ) * 0.5

        // 2. API 接口名重合度（权重 30%）
        const apiScore = jaccardSimilarity(
            candidateSchema.api_endpoints || [],
            s.api_endpoints || []
        ) * 0.3

        // 3. 路由和 features 重合度（权重 20%）
        const featScore = featuresSimilarity(
            candidateSchema.features || {},
            s.features || {}
        ) * 0.2

        const totalScore = compScore + apiScore + featScore

        return { score: Number(totalScore.toFixed(3)), snapshot: snap }
    })

    return results
        .filter(r => r.score >= threshold)
        .sort((a, b) => b.score - a.score)
}

/**
 * 从快照库里寻找最佳匹配，返回最接近的一个（或 null）
 */
export function findBestMatch(candidateSchema, cwd = process.cwd(), threshold = 0.45) {
    const results = findSimilarSnapshots(candidateSchema, cwd, threshold)
    return results.length ? results[0] : null
}
