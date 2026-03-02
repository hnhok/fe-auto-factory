/**
 * Schema 解析与校验辅助
 */
export function parseFrontmatter(content) {
    const normalized = content.replace(/\r\n/g, '\n')
    const match = normalized.match(/^---\n([\s\S]*?)\n---/)
    if (!match) return {}

    const yaml = match[1]
    const result = {}
    let currentKey = null

    for (const line of yaml.split('\n')) {
        // 忽略注释
        const cleanLine = line.split('#')[0].trimEnd()
        if (!cleanLine) continue

        // 多行数组项 (- value)
        const arrayItemMatch = cleanLine.match(/^\s*-\s+(.+)/)
        if (arrayItemMatch) {
            if (currentKey && result[currentKey]) {
                if (!Array.isArray(result[currentKey])) result[currentKey] = [result[currentKey]]
                result[currentKey].push(arrayItemMatch[1].trim().replace(/^['"]|['"]$/g, ''))
            }
            continue
        }

        const colonIdx = cleanLine.indexOf(':')
        if (colonIdx === -1) continue

        const key = cleanLine.slice(0, colonIdx).trim()
        const rawVal = cleanLine.slice(colonIdx + 1).trim()
        currentKey = key

        if (rawVal === '' || rawVal === '[]') {
            result[key] = []
        } else if (rawVal.startsWith('[')) {
            result[key] = rawVal.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
        } else {
            result[key] = rawVal.replace(/^['"]|['"]$/g, '')
        }
    }
    return result
}
