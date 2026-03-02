import http from 'http'
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'fs'
import { join, extname } from 'path'
import { spawn } from 'child_process'
import { parseFrontmatter } from '../utils/schema.js'

export async function startUIServer(port = 4000) {
    const cwd = process.cwd()
    const schemaDir = join(cwd, 'schemas', 'pages')
    const factoryJsPath = join(cwd, 'node_modules', '@hnhok', 'fe-auto-factory', 'scripts', 'factory.js')
    const localFactoryJsPath = join(cwd, 'scripts', 'factory.js') // Fallback mapping

    const server = http.createServer((req, res) => {
        // --- CORS Settings ---
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
        if (req.method === 'OPTIONS') { res.writeHead(200); return res.end() }

        const url = new URL(req.url, `http://${req.headers.host}`)

        // --- API Routes ---
        if (url.pathname === '/api/schemas' && req.method === 'GET') {
            try {
                if (!existsSync(schemaDir)) {
                    res.writeHead(200, { 'Content-Type': 'application/json' })
                    return res.end(JSON.stringify({ code: 0, data: [] }))
                }
                const files = readdirSync(schemaDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
                const schemas = files.map(file => {
                    const content = readFileSync(join(schemaDir, file), 'utf-8')
                    const parsed = parseFrontmatter(content)
                    return { file, content, config: parsed }
                })
                res.writeHead(200, { 'Content-Type': 'application/json' })
                return res.end(JSON.stringify({ code: 0, data: schemas }))
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' })
                return res.end(JSON.stringify({ code: 500, message: e.message }))
            }
        }

        if (url.pathname === '/api/generate' && req.method === 'POST') {
            let body = ''
            req.on('data', chunk => body += chunk.toString())
            req.on('end', () => {
                try {
                    const { file } = JSON.parse(body)
                    res.writeHead(200, { 'Content-Type': 'application/json' })

                    // Run the factory generate command
                    const schemaPath = join('schemas', 'pages', file)
                    const cmdToRun = existsSync(localFactoryJsPath)
                        ? ['node', localFactoryJsPath, 'generate', '--schema', schemaPath]
                        : ['npx', 'fe-factory', 'generate', '--schema', schemaPath]

                    const child = spawn(cmdToRun[0], cmdToRun.slice(1), { cwd, shell: true })

                    let output = ''
                    child.stdout.on('data', data => output += data.toString())
                    child.stderr.on('data', data => output += data.toString())

                    child.on('close', code => {
                        res.end(JSON.stringify({ code, output }))
                    })
                } catch (e) {
                    res.writeHead(500, { 'Content-Type': 'application/json' })
                    res.end(JSON.stringify({ code: 500, message: e.message }))
                }
            })
            return
        }

        // --- Serve Static HTML ---
        if (url.pathname === '/') {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
            return res.end(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>FE-Factory WebUI 控制台 (Alpha)</title>
    <!-- 引入 Vue3 和 Element Plus CDN -->
    <script src="https://unpkg.com/vue@3"></script>
    <link rel="stylesheet" href="https://unpkg.com/element-plus/dist/index.css" />
    <script src="https://unpkg.com/element-plus"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin: 0; padding: 0; background: #f0f2f5; }
        .app-header { background: #2f3542; color: #fff; padding: 15px 30px; display: flex; align-items: center; justify-content: space-between; }
        .main-container { max-width: 1200px; margin: 30px auto; display: flex; gap: 20px; }
        .sidebar { width: 300px; background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1); }
        .content { flex: 1; background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1); }
        .code-block { background: #1e1e1e; color: #d4d4d4; padding: 15px; border-radius: 5px; white-space: pre-wrap; font-family: monospace; max-height: 400px; overflow-y: auto;}
    </style>
</head>
<body>
    <div id="app">
        <div class="app-header">
            <h2>🏭 FE-Factory Low-Code Control Panel (v3.0预览版)</h2>
            <span>项目路径: {{ cwd }}</span>
        </div>
        <div class="main-container">
            <div class="sidebar">
                <h3>页面 图纸库 (Schemas)</h3>
                <el-menu default-active="0" @select="handleSelect">
                    <el-menu-item v-for="(item, index) in schemas" :key="index" :index="String(index)">
                        <template #title>
                            <span>{{ item.config.page_id || item.file }}</span>
                        </template>
                    </el-menu-item>
                </el-menu>
                <el-button type="success" class="mt-4" style="width: 100%; margin-top:20px" @click="fetchSchemas">🔄 刷新列表</el-button>
            </div>
            <div class="content" v-if="currentSchema">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div>
                        <h2>{{ currentSchema.config.title || currentSchema.config.page_id }} <el-tag size="small">{{ currentSchema.config.layout }}</el-tag></h2>
                        <p style="color: #666">文件: templates/pages/{{ currentSchema.file }}</p>
                    </div>
                    <el-button type="primary" size="large" :loading="generating" @click="generateCode">✨ 一键生成工程代码</el-button>
                </div>

                <h3>特征 (Features)</h3>
                <el-descriptions border :column="3">
                    <el-descriptions-item v-for="(val, key) in currentSchema.config.features" :key="key" :label="key">
                        <el-tag :type="val ? 'success' : 'info'" size="small">{{ val }}</el-tag>
                    </el-descriptions-item>
                </el-descriptions>

                <h3 style="margin-top: 30px;">接口映射 (APIs)</h3>
                <el-tag v-for="api in currentSchema.config.api_endpoints" :key="api" style="margin-right: 10px;">{{ api }}</el-tag>

                <h3 style="margin-top: 30px;">YAML 源文</h3>
                <div class="code-block">{{ currentSchema.content }}</div>

                <!-- 生成日志终端 -->
                <el-dialog v-model="consoleVisible" title="构建任务终端输出" width="70%" :close-on-click-modal="false">
                    <div class="code-block">{{ consoleOutput }}</div>
                    <template #footer>
                        <el-button type="primary" @click="consoleVisible = false" :disabled="generating">确定</el-button>
                    </template>
                </el-dialog>
            </div>
            <div class="content" v-else>
                <el-empty description="请从左侧选择一个 Schema 图纸"></el-empty>
            </div>
        </div>
    </div>

    <script>
        const { createApp, ref, onMounted } = Vue
        
        createApp({
            setup() {
                const cwd = ref('${cwd.replace(/\\/g, '\\\\')}')
                const schemas = ref([])
                const currentIndex = ref(null)
                const currentSchema = ref(null)
                const generating = ref(false)
                const consoleVisible = ref(false)
                const consoleOutput = ref('')

                const fetchSchemas = async () => {
                    try {
                        const res = await fetch('/api/schemas')
                        const data = await res.json()
                        schemas.value = data.data
                        if(schemas.value.length > 0 && currentIndex.value === null) {
                            handleSelect('0')
                        }
                    } catch (e) { ElementPlus.ElMessage.error('读取 Schema 失败'); }
                }

                const handleSelect = (index) => {
                    currentIndex.value = index
                    currentSchema.value = schemas.value[parseInt(index)]
                }

                const generateCode = async () => {
                    generating.value = true
                    consoleVisible.value = true
                    consoleOutput.value = '🚗 [Factory] 工厂运转中... 正在分析领域模型和组装驱动组件...\\n'
                    
                    try {
                        const res = await fetch('/api/generate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ file: currentSchema.value.file })
                        })
                        const data = await res.json()
                        consoleOutput.value += data.output
                        if(data.code === 0) {
                            ElementPlus.ElMessage.success('流水线构建完成！')
                        } else {
                            ElementPlus.ElMessage.error('流水线构建失败！请查阅日志')
                        }
                    } catch (e) {
                         consoleOutput.value += '\\n网络错误: ' + e.message
                    } finally {
                        generating.value = false
                    }
                }

                onMounted(fetchSchemas)

                return {
                    cwd, schemas, currentSchema, handleSelect, fetchSchemas,
                    generateCode, generating, consoleVisible, consoleOutput
                }
            }
        }).use(ElementPlus).mount('#app')
    </script>
</body>
</html>
            `)
        }

        // Default 404
        res.writeHead(404)
        res.end('Not Found')
    })

    server.listen(port, () => {
        console.log(`\x1b[36m[Factory] 🌐 UI 控制台已启动，请在浏览器访问: http://localhost:${port}\x1b[0m`)
    })
}
