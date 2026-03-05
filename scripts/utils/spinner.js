/**
 * A minimal, dependency-free CLI spinner for FE-Auto-Factory
 */
export class Spinner {
    constructor(text = '', options = {}) {
        this.text = text;
        this.frames = options.frames || ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        this.interval = options.interval || 80;
        this.frameIndex = 0;
        this.timer = null;
        this.startTime = null;
    }

    start(text) {
        if (text) this.text = text;
        this.startTime = Date.now();
        // Hide cursor
        process.stdout.write('\x1B[?25l');
        this._render();
        this.timer = setInterval(() => {
            this.frameIndex = (this.frameIndex + 1) % this.frames.length;
            this._render();
        }, this.interval);
        return this;
    }

    _render() {
        const frame = this.frames[this.frameIndex];
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(`\x1b[36m${frame}\x1b[0m ${this.text}`);
    }

    stop(text) {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        if (text) {
            process.stdout.write(text + '\n');
        }
        // Show cursor
        process.stdout.write('\x1B[?25h');
        return this;
    }

    succeed(text) {
        return this.stop(`\x1b[32m✔\x1b[0m ${text || this.text}`);
    }

    fail(text) {
        return this.stop(`\x1b[31m✖\x1b[0m ${text || this.text}`);
    }

    info(text) {
        return this.stop(`\x1b[34mℹ\x1b[0m ${text || this.text}`);
    }
}
