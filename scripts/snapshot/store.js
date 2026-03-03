/**
 * FE-Auto-Factory Vision Snapshot Store
 * 将视觉识别结果（Schema + 图片指纹）持久化到工程的 .factory/snapshots/ 目录。
 * 支持 写入、查询、列举、删除 四个基本操作。
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs'
import { join, basename } from 'path'
import { createHash } from 'crypto'

const SNAPSHOT_DIR_NAME = join('.factory', 'snapshots')

/**
 * 获取当前项目的快照目录，不存在则自动创建
 */
export function getSnapshotDir(cwd = process.cwd()) {
    const dir = join(cwd, SNAPSHOT_DIR_NAME)
    mkdirSync(dir, { recursive: true })
    return dir
}

/**
 * 计算图片文件的 MD5 指纹（用于精确去重）
 */
export function hashImage(imagePath) {
    if (!existsSync(imagePath)) return null
    const buf = readFileSync(imagePath)
    return createHash('md5').update(buf).digest('hex').slice(0, 12)
}

/**
 * 将一次成功的视觉识别结果写入快照库
 * @param {object} opts
 * @param {string} opts.imagePath  原始图片路径
 * @param {string} opts.yamlText   AI 产出的原始 YAML 文本
 * @param {object} opts.schema     已解析的 Schema 对象
 * @param {string} opts.cwd        项目根目录
 * @param {string} [opts.note]     开发者备注（可选）
 */
export function saveSnapshot({ imagePath, yamlText, schema, cwd = process.cwd(), note = '' }) {
    const dir = getSnapshotDir(cwd)
    const imageHash = hashImage(imagePath)
    const pageId = schema.page_id || 'Unknown'
    const timestamp = new Date().toISOString()

    // 快照文件名: {pageId}-{imageHash}.json
    const filename = `${pageId}-${imageHash || Date.now()}.json`
    const filepath = join(dir, filename)

    const snapshot = {
        id: filename.replace('.json', ''),
        page_id: pageId,
        title: schema.title || '',
        note,
        image_hash: imageHash,
        image_source: basename(imagePath),
        created_at: timestamp,
        schema,          // 完整解析对象（用于匹配）
        yaml_text: yamlText  // 原始文本（用于直接复用）
    }

    writeFileSync(filepath, JSON.stringify(snapshot, null, 2), 'utf-8')
    return { filepath, snapshot }
}

/**
 * 读取全部已有快照列表
 */
export function listSnapshots(cwd = process.cwd()) {
    const dir = getSnapshotDir(cwd)
    const files = readdirSync(dir).filter(f => f.endsWith('.json'))
    return files.map(f => {
        try {
            return JSON.parse(readFileSync(join(dir, f), 'utf-8'))
        } catch {
            return null
        }
    }).filter(Boolean)
}

/**
 * 通过图片哈希精确查找快照（完全相同的图片）
 */
export function findByImageHash(imagePath, cwd = process.cwd()) {
    const hash = hashImage(imagePath)
    if (!hash) return null
    const all = listSnapshots(cwd)
    return all.find(s => s.image_hash === hash) || null
}

/**
 * 通过 page_id 或 title 模糊查询
 */
export function findByKeyword(keyword, cwd = process.cwd()) {
    const kw = keyword.toLowerCase()
    return listSnapshots(cwd).filter(s =>
        s.page_id?.toLowerCase().includes(kw) ||
        s.title?.toLowerCase().includes(kw) ||
        s.note?.toLowerCase().includes(kw)
    )
}

/**
 * 删除某一条快照
 */
export function deleteSnapshot(id, cwd = process.cwd()) {
    const dir = getSnapshotDir(cwd)
    const filepath = join(dir, `${id}.json`)
    if (existsSync(filepath)) {
        unlinkSync(filepath)
        return true
    }
    return false
}
