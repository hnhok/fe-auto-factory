/**
 * factory list — 列出所有已由工厂生成的页面及当前覆盖率
 */
import { readFileSync, existsSync, readdirSync } from 'fs'
import { join, resolve } from 'path'
import { log, c } from '../utils/logger.js'

export async function cmdList(args, projectRoot = process.cwd()) {
    const manifestPath = join(projectRoot, '.factory', 'generated-files.json')
    const schemasDir = join(projectRoot, 'schemas', 'pages')

    // ─── 统计 Schema 总量 ───────────────────────────────────────────────
    let totalSchemas = 0
    if (existsSync(schemasDir)) {
        totalSchemas = readdirSync(schemasDir)
            .filter(f => f.endsWith('.yaml') || f.endsWith('.yml')).length
    }

    // ─── 读取生成清单 ───────────────────────────────────────────────────
    if (!existsSync(manifestPath)) {
        log.warn('尚未找到生成清单文件（.factory/generated-files.json）。')
        log.gray('提示: 运行 npx fe-factory generate --schema <path> 后会自动创建清单。')
        if (totalSchemas > 0) {
            log.info(`当前项目有 ${totalSchemas} 个 Schema 文件，工厂覆盖率：0%`)
        }
        return
    }

    let manifest
    try {
        manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
    } catch {
        log.error('清单文件损坏，无法读取，请重新运行 generate 以重建。')
        return
    }

    const generated = manifest.generated || []
    const coverage = totalSchemas > 0
        ? Math.round((generated.length / totalSchemas) * 100)
        : 0

    // ─── 打印标题 ───────────────────────────────────────────────────────
    console.log(`\n${c.bold}${c.cyan}📋 工厂已生成页面清单${c.reset}`)
    console.log(`${c.gray}  最后更新: ${manifest.lastUpdated || '未知'}${c.reset}`)
    console.log()

    if (generated.length === 0) {
        log.gray('  暂无生成记录')
        return
    }

    // ─── 打印每一条记录 ─────────────────────────────────────────────────
    const colW = { id: 24, kebab: 28, date: 22 }
    console.log(
        `${c.bold}` +
        '  PAGE_ID'.padEnd(colW.id) +
        'ROUTE (kebab)'.padEnd(colW.kebab) +
        'SCHEMA'.padEnd(36) +
        'GENERATED AT' +
        `${c.reset}`
    )
    console.log('  ' + '─'.repeat(100))

    for (const entry of generated) {
        const date = entry.generatedAt
            ? new Date(entry.generatedAt).toLocaleString('zh-CN', { hour12: false })
            : '─'
        console.log(
            `  ${c.green}${(entry.page_id || '?').padEnd(colW.id - 2)}${c.reset}` +
            `${c.gray}${(entry.kebab || '?').padEnd(colW.kebab)}${c.reset}` +
            `${(entry.schema || '─').substring(0, 34).padEnd(36)}` +
            `${c.gray}${date}${c.reset}`
        )
    }

    // ─── 覆盖率汇总 ─────────────────────────────────────────────────────
    console.log()
    const barFilled = Math.round(coverage / 5)
    const barEmpty = 20 - barFilled
    const coverageBar = `[${'█'.repeat(barFilled)}${'░'.repeat(barEmpty)}]`
    const coverageColor = coverage >= 80 ? c.green : coverage >= 50 ? c.yellow : c.red
    console.log(
        `  ${c.bold}工厂覆盖率:${c.reset}  ` +
        `${coverageColor}${coverageBar} ${coverage}%${c.reset}  ` +
        `${c.gray}(${generated.length} / ${totalSchemas} 个 Schema 已生成)${c.reset}`
    )
    console.log()

    // ─── 提示未覆盖的 Schema ────────────────────────────────────────────
    if (args.includes('--show-missing') && existsSync(schemasDir)) {
        const generatedIds = new Set(generated.map(e => e.page_id))
        const allSchemas = readdirSync(schemasDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
        const missing = allSchemas.filter(f => {
            const id = f.replace(/\.schema\.(yaml|yml)$/, '').replace(/\.(yaml|yml)$/, '')
            const pascalId = id.charAt(0).toUpperCase() + id.slice(1)
            return !generatedIds.has(id) && !generatedIds.has(pascalId)
        })
        if (missing.length > 0) {
            log.warn(`尚有 ${missing.length} 个 Schema 未经工厂生成:`)
            missing.forEach(f => log.gray(`  schemas/pages/${f}`))
        }
    }
}
