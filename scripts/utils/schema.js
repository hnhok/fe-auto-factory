/**
 * Schema 解析与校验辅助 (采用业界标准的 js-yaml 处理深层嵌套)
 */
import yaml from 'js-yaml'

export function parseFrontmatter(content) {
    const normalized = content.replace(/\r\n/g, '\n')
    // 兼容首尾带有 --- 的 YAML 格式
    const match = normalized.match(/^---\n([\s\S]*?)\n---/)

    try {
        if (match) {
            return yaml.load(match[1]) || {}
        }
        // 如果没有 --- 则尝试解析整个文件
        return yaml.load(normalized) || {}
    } catch (e) {
        console.error('YAML 解析错误:', e.message)
        return {}
    }
}
