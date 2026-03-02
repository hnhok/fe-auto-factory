/**
 * 通用字符串转换工具
 */
export function toKebabCase(str) {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
}

export function toCamelCase(str) {
    return str.replace(/[-_]([a-z])/g, (g) => g[1].toUpperCase())
        .replace(/^[A-Z]/, (g) => g.toLowerCase())
}

export function toPascalCase(str) {
    const camel = toCamelCase(str)
    return camel.charAt(0).toUpperCase() + camel.slice(1)
}
