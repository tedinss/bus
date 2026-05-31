class Node {
    constructor(x, y, type, config = {}) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = config.size || 40;
        this.color = config.color || '#00f2ff';
        this.active = true;
        this.connections = []; // Outgoing connections
        this.lastSignalTime = 0;
        this.signalCooldown = config.cooldown || 2000; // ms
        
        // Splitter state
        this.currentConnectionIndex = 0;
        
        // Visual feedback
        this.pulse = 0;
    }

    update(time, signals) {
        if (!this.active) return;

        // Symbio-Virus check
        let speedMult = 1.0;
        if (this.isInfected && window.game.options.symbioVirus) {
            speedMult = 2.0;
        }

        if (this.type === 'extractor') {
            if (time - this.lastSignalTime > (this.signalCooldown / speedMult)) {
                this.produceSignal(signals);
                this.lastSignalTime = time;
                this.pulse = 1.0;
            }
        }

        if (this.pulse > 0) {
            this.pulse -= 0.05;
        }
    }

    produceSignal(signals, incomingSignal = null) {
        if (this.connections.length === 0) return;
        
        this.pulse = 1.0;
        const config = this.getSignalConfig(incomingSignal);

        if (this.type === 'splitter') {
            const target = this.connections[this.currentConnectionIndex];
            window.game.spawnSignal(this.x, this.y, target, config);
            this.currentConnectionIndex = (this.currentConnectionIndex + 1) % this.connections.length;
        } else if (this.type === 'amplifier') {
            this.connections.forEach(target => {
                const ampConfig = {...config};
                ampConfig.speed *= 1.5;
                ampConfig.color = '#00ff66';
                window.game.spawnSignal(this.x, this.y, target, ampConfig);
            });
        } else if (this.type === 'router' && window.game.options.ghostRouter) {
            this.connections.forEach(target => {
                window.game.spawnSignal(this.x, this.y, target, config);
                window.game.spawnSignal(this.x, this.y, target, config);
            });
        } else {
            this.connections.forEach(target => {
                window.game.spawnSignal(this.x, this.y, target, config);
            });
        }
    }

    getSignalConfig(incoming) {
        if (incoming) {
            return {
                speed: incoming.speed,
                value: incoming.value,
                color: incoming.color
            };
        }
        return {};
    }

    connect(targetNode) {
        // Prevent connecting to self
        if (targetNode === this) return false;
        
        // Prevent duplicate connection
        if (this.connections.includes(targetNode)) return false;

        // Prevent direct cycle (B -> A if A -> B exists)
        if (targetNode.connections.includes(this)) return false;

        this.connections.push(targetNode);
        return true;
    }
}
