class Signal {
    constructor(startX, startY, targetNode, config = {}) {
        this.x = startX;
        this.y = startY;
        this.targetNode = targetNode;
        this.speed = config.speed || 2;
        this.value = config.value || 1;
        this.color = config.color || '#00f2ff';
        this.completed = false;
    }

    update(dt) {
        if (this.completed || !this.targetNode) return;

        const dx = this.targetNode.x - this.x;
        const dy = this.targetNode.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Normalize movement by speed and time (dt is in ms)
        // Adjusting speed factor (0.1 seems appropriate for the current setup)
        const moveDist = this.speed * (dt / 16.67); 

        if (dist < moveDist) {
            this.x = this.targetNode.x;
            this.y = this.targetNode.y;
            this.completed = true;
            this.onReachTarget();
        } else {
            this.x += (dx / dist) * moveDist;
            this.y += (dy / dist) * moveDist;
        }
    }

    onReachTarget() {
        const game = window.game;
        game.renderer.addParticles(this.x, this.y, this.color, 5);
        game.playSound('signal');

        // Logic for when signal hits a node (e.g., storage node adds credits)
        if (this.targetNode.type === 'storage') {
            let finalValue = this.value + (this.targetNode.signalValueBonus || 0);
            
            // Risk Multiplier
            if (game.options.riskMultiplier) {
                finalValue += Math.floor(game.economy.detection / 10);
            }

            game.economy.addCredits(finalValue);
        } else if (['router', 'splitter', 'amplifier'].includes(this.targetNode.type)) {
            this.targetNode.produceSignal(game.signals, this);
        }
    }
}
