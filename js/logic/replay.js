class ReplaySystem {
    constructor() {
        this.snapshots = [];
        this.isRecording = false;
        this.playbackIndex = 0;
        this.playbackSpeed = 1; // Used for delay logic
        
        this.canvas = document.getElementById('replay-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 1920;
        this.canvas.height = 1080;
    }

    startRecording() {
        this.snapshots = [];
        this.isRecording = true;
    }

    stopRecording() {
        this.isRecording = false;
    }

    record(grid) {
        if (!this.isRecording) return;
        
        // Snapshot the current nodes and their connections
        const snapshot = grid.nodes.map(n => ({
            x: n.x,
            y: n.y,
            type: n.type,
            color: n.color,
            connections: n.connections.map(target => ({
                x: target.x,
                y: target.y
            }))
        }));
        
        this.snapshots.push(snapshot);
    }

    play(onComplete) {
        this.playbackIndex = 0;
        this.renderPlayback(onComplete);
    }

    renderPlayback(onComplete) {
        if (this.playbackIndex >= this.snapshots.length) {
            if (onComplete) onComplete();
            return;
        }

        const snapshot = this.snapshots[this.playbackIndex];
        this.drawSnapshot(snapshot);

        // x20 Speed Logic: Advance multiple frames or use short timeout
        // Since we snapshot every second or so, we play them back fast
        this.playbackIndex++;
        requestAnimationFrame(() => this.renderPlayback(onComplete));
    }

    drawSnapshot(nodes) {
        const ctx = this.ctx;
        ctx.fillStyle = '#05050a';
        ctx.fillRect(0, 0, 1920, 1080);

        // Draw connections first
        ctx.lineWidth = 1;
        nodes.forEach(node => {
            node.connections.forEach(target => {
                ctx.strokeStyle = 'rgba(0, 242, 255, 0.2)';
                ctx.beginPath();
                ctx.moveTo(node.x, node.y);
                ctx.lineTo(target.x, target.y);
                ctx.stroke();
            });
        });

        // Draw nodes
        nodes.forEach(node => {
            ctx.shadowBlur = 10;
            ctx.shadowColor = node.color;
            ctx.strokeStyle = node.color;
            ctx.lineWidth = 2;

            if (node.type === 'extractor') {
                ctx.strokeRect(node.x - 20, node.y - 20, 40, 40);
            } else if (node.type === 'storage') {
                this.drawTriangle(ctx, node.x, node.y, 40);
            } else {
                ctx.beginPath();
                ctx.arc(node.x, node.y, 20, 0, Math.PI * 2);
                ctx.stroke();
            }
        });
        ctx.shadowBlur = 0;
    }

    drawTriangle(ctx, x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y - size/2);
        ctx.lineTo(x + size/2, y + size/2);
        ctx.lineTo(x - size/2, y + size/2);
        ctx.closePath();
        ctx.stroke();
    }
}
