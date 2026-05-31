class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Fixed internal resolution
        this.width = 1920;
        this.height = 1080;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.colors = {
            blue: '#00f2ff',
            pink: '#ff00ea',
            green: '#00ff66',
            red: '#ff0033',
            bg: '#05050a',
            grid: '#1a1a2e'
        };

        // Particle Pooling
        this.particles = [];
        this.particlePool = [];
        for (let i = 0; i < 500; i++) {
            this.particlePool.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, color: '' });
        }
        
        this.shake = 0;
    }

    resize() {}

    clear() {
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        if (this.shake > 0) {
            this.ctx.save();
            const sx = (Math.random() - 0.5) * this.shake;
            const sy = (Math.random() - 0.5) * this.shake;
            this.ctx.translate(sx, sy);
            this.shake *= 0.9;
        }
    }

    addParticles(x, y, color, count = 10) {
        let added = 0;
        for (let i = 0; i < this.particlePool.length && added < count; i++) {
            const p = this.particlePool[i];
            if (p.life <= 0) {
                p.x = x;
                p.y = y;
                p.vx = (Math.random() - 0.5) * 4;
                p.vy = (Math.random() - 0.5) * 4;
                p.life = 1.0;
                p.color = color || this.colors.blue;
                this.particles.push(p);
                added++;
            }
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    drawParticles() {
        this.ctx.globalCompositeOperation = 'lighter';
        const ctx = this.ctx;
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2 * p.life, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
    }

    drawGrid(gridSize, offset) {
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();

        for (let x = offset.x % gridSize; x < this.canvas.width; x += gridSize) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
        }

        for (let y = offset.y % gridSize; y < this.canvas.height; y += gridSize) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
        }

        this.ctx.stroke();
    }

    drawNode(node) {
        const { x, y, size, type, color, active, pulse } = node;
        
        const glowSize = (active ? 15 : 5) + (pulse || 0) * 20;
        this.ctx.shadowBlur = glowSize;
        this.ctx.shadowColor = color || this.colors.blue;
        this.ctx.strokeStyle = active ? (color || this.colors.blue) : '#333';
        this.ctx.lineWidth = 2 + (pulse || 0) * 3;

        if (type === 'extractor') {
            this.ctx.strokeRect(x - size/2, y - size/2, size, size);
        } else if (type === 'storage') {
            this.drawTriangle(x, y, size);
        } else if (type === 'splitter') {
            this.drawDiamond(x, y, size);
        } else if (type === 'amplifier') {
            this.drawHexagon(x, y, size/2);
        } else if (type === 'router') {
            this.drawCircle(x, y, size/2);
        } else {
            this.drawCircle(x, y, size/2);
        }

        this.ctx.shadowBlur = 0;
        this.ctx.lineWidth = 2;
    }

    drawDiamond(x, y, size) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size/2);
        this.ctx.lineTo(x + size/2, y);
        this.ctx.lineTo(x, y + size/2);
        this.ctx.lineTo(x - size/2, y);
        this.ctx.closePath();
        this.ctx.stroke();
    }

    drawHexagon(x, y, radius) {
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const px = x + radius * Math.cos(angle);
            const py = y + radius * Math.sin(angle);
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
        this.ctx.stroke();
    }

    drawCircle(x, y, radius) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    drawTriangle(x, y, size) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size/2);
        this.ctx.lineTo(x + size/2, y + size/2);
        this.ctx.lineTo(x - size/2, y + size/2);
        this.ctx.closePath();
        this.ctx.stroke();
    }

    drawConnection(start, end, color) {
        this.ctx.strokeStyle = color || 'rgba(0, 242, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.stroke();
    }

    drawSignal(x, y, color) {
        this.ctx.fillStyle = color || this.colors.blue;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = color || this.colors.blue;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }

    postProcess() {
        if (this.shake > 0) {
            this.ctx.restore();
        }
    }
}
