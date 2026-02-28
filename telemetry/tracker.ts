/**
 * FE-Factory 声明式埋点系统
 * 通过 data-track-id 属性自动采集用户交互事件
 *
 * 使用方式：
 * 1. 在 main.ts 中初始化: tracker.init()
 * 2. 在元素上添加: data-track-id="buy-now-click"
 * 3. 所有点击事件自动上报，无需手动埋点
 */

export interface TrackEvent {
    event: string        // 事件 ID（来自 data-track-id）
    timestamp: number    // 精确时间戳
    page: string         // 当前页面路径
    userId?: string      // 用户 ID（可选）
    extra?: Record<string, string> // 元素上的其他 data-* 属性
}

class ClickInterceptor {
    private endpoint: string
    private queue: TrackEvent[] = []
    private flushTimer: ReturnType<typeof setInterval> | null = null
    private userId: string | null = null

    constructor(endpoint = '/api/track') {
        this.endpoint = endpoint
    }

    /**
     * 初始化埋点系统（在 main.ts 调用一次）
     */
    init() {
        // 全局点击事件监听（捕获阶段，优先级最高）
        document.addEventListener('click', this.handleClick.bind(this), true)

        // 页面可见性变更时强制上报（防止数据丢失）
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.flush(true) // 同步上报
            }
        })

        // 定时批量上报（每 5 秒）
        this.flushTimer = setInterval(() => this.flush(), 5000)

        console.info('[Tracker] 声明式埋点系统已初始化')
    }

    /**
     * 设置用户 ID（登录后调用）
     */
    setUserId(id: string) {
        this.userId = id
    }

    /**
     * 处理点击事件
     */
    private handleClick(e: MouseEvent) {
        const target = e.target as HTMLElement
        if (!target) return

        // 向上查找最近的带 data-track-id 的祖先元素
        const tracked = target.closest('[data-track-id]') as HTMLElement | null
        if (!tracked) return

        const trackId = tracked.getAttribute('data-track-id')!

        // 采集元素上的所有额外 data-* 属性
        const extra: Record<string, string> = {}
        for (const attr of tracked.attributes) {
            if (attr.name.startsWith('data-track-') && attr.name !== 'data-track-id') {
                const key = attr.name.replace('data-track-', '')
                extra[key] = attr.value
            }
        }

        const event: TrackEvent = {
            event: trackId,
            timestamp: Date.now(),
            page: window.location.pathname,
            userId: this.userId ?? undefined,
            ...(Object.keys(extra).length > 0 ? { extra } : {}),
        }

        this.queue.push(event)

        // 队列达到 20 条立即上报
        if (this.queue.length >= 20) {
            this.flush()
        }
    }

    /**
     * 批量上报（使用 sendBeacon 防止页面关闭数据丢失）
     */
    private flush(sync = false) {
        if (this.queue.length === 0) return

        const events = [...this.queue]
        this.queue = []

        const payload = JSON.stringify({ events })

        if (sync || !navigator.sendBeacon) {
            // 同步上报（页面关闭时）
            fetch(this.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
                keepalive: true,
            }).catch(() => { /* 忽略上报错误 */ })
        } else {
            // 异步上报（正常情况）
            const blob = new Blob([payload], { type: 'application/json' })
            navigator.sendBeacon(this.endpoint, blob)
        }
    }

    /**
     * 手动上报自定义事件（用于非点击类事件）
     */
    track(eventId: string, extra?: Record<string, string>) {
        const event: TrackEvent = {
            event: eventId,
            timestamp: Date.now(),
            page: window.location.pathname,
            userId: this.userId ?? undefined,
            ...(extra ? { extra } : {}),
        }
        this.queue.push(event)
    }

    /**
     * 销毁（清理定时器）
     */
    destroy() {
        if (this.flushTimer) clearInterval(this.flushTimer)
        document.removeEventListener('click', this.handleClick.bind(this), true)
    }
}

// 单例导出
export const tracker = new ClickInterceptor(
    import.meta.env.VITE_TRACK_ENDPOINT || '/api/track'
)
