class GlobalPoliceAI {
    constructor() {
        this.intelLevel = 0;
        this.countermeasures = {
            duplication: 0,
            stealth: 0,
            parasites: 0,
            overclock: 0
        };
        this.lastIntelUpdate = Date.now();
    }

    update(game) {
        if (Date.now() - this.lastIntelUpdate > 10000) { // Every 10 seconds
            this.lastIntelUpdate = Date.now();

            // Learn from upgrades/options
            if (game.options.ghostRouter) this.countermeasures.duplication += 0.05;
            if (game.options.symbioVirus) this.countermeasures.parasites += 0.05;

            // Learn from grid composition
            if (game.grid && game.grid.nodes) {
                const extractors = game.grid.nodes.filter(n => n.type === 'extractor');
                if (extractors.length > 10) this.countermeasures.overclock += 0.02;
                if (game.economy.detection < 20) this.countermeasures.stealth += 0.01;
            }

            this.intelLevel = Math.min(100, (
                this.countermeasures.duplication + 
                this.countermeasures.stealth + 
                this.countermeasures.parasites + 
                this.countermeasures.overclock
            ) * 10);
        }
    }

    getDifficultyMultiplier() {
        return 1 + (this.intelLevel / 50);
    }
}

class Chaos {
    constructor(game) {
        this.threats = [];
        this.lastThreatTime = 0;
        this.threatInterval = 5000; // 5 seconds
        this.game = game || window.game;
        this.policeAI = this.game ? this.game.policeAI : new GlobalPoliceAI();
    }

    update(time, economy, grid) {
        if (this.game && this.game.policeAI) {
            this.game.policeAI.update(this.game);
        }

        const diffMult = this.game && this.game.policeAI ? this.game.policeAI.getDifficultyMultiplier() : 1;

        if (time - this.lastThreatTime > (this.threatInterval / diffMult)) {
            this.lastThreatTime = time;

            // Spawn threat based on detection and difficulty
            const spawnChance = economy.detection * diffMult;
            if (Math.random() * 100 < spawnChance) {
                this.spawnThreat(grid);
            }

            // Passive detection growth
            economy.addDetection(grid.nodes.length * 0.05 * diffMult);

            // Chaos Harvest
            if (this.game.options.chaosHarvest && this.threats.length > 0) {
                economy.addCredits(this.threats.length * this.game.options.chaosHarvest);
                this.game.renderer.addParticles(grid.nodes[0].x, grid.nodes[0].y, '#00ff66', 20); 
            }
        }

        this.threats.forEach(threat => threat.update(time, grid));
        this.threats = this.threats.filter(t => t.active);
    }

    spawnThreat(grid) {
        if (grid.nodes.length === 0) return;

        const intel = this.policeAI.intelLevel;
        const roll = Math.random() * 100;
        
        // Smarter threat selection based on intel level
        let type = 'police';
        if (intel > 70 && roll < 40) type = 'corruptor';
        else if (intel > 30 && roll < 60) type = 'parasite';

        // Intelligent targeting: sort by connections (highest value)
        const sortedNodes = [...grid.nodes].sort((a, b) => b.connections.length - a.connections.length);
        const target = sortedNodes[0];
        
        if (type === 'corruptor') {
            this.threats.push(new PoliceCorruptor(target));
        } else if (type === 'police') {
            this.threats.push(new PoliceScanner(target.x, target.y));
        } else {
            this.threats.push(new SignalParasite(target.x, target.y, target));
        }
    }
}

class PoliceScanner {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 150;
        this.active = true;
        this.duration = 8000;
        this.startTime = Date.now();
        this.color = '#ff0033';
        this.type = 'police';
    }

    update(time, grid) {
        if (Date.now() - this.startTime > this.duration) {
            this.active = false;
            return;
        }

        // Disable nodes in radius
        grid.nodes.forEach(node => {
            const dx = node.x - this.x;
            const dy = node.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.radius) {
                // More connections = higher priority target for scanners
                const penalty = node.connections.length * 20;
                node.active = false;
                node.disabledTimer = 100 + penalty;
            }
        });
    }
}

class PoliceCorruptor {
    constructor(targetNode) {
        this.targetNode = targetNode;
        this.active = true;
        this.duration = 5000;
        this.startTime = Date.now();
        this.type = 'corruptor';
    }

    update(time, grid) {
        if (Date.now() - this.startTime > this.duration) {
            this.active = false;
            if (this.targetNode) this.targetNode.corrupted = false;
            return;
        }

        if (this.targetNode) {
            this.targetNode.corrupted = true;
            this.targetNode.active = false; // Permanently disabled while corrupted
        }
    }
}

class SignalParasite {
    constructor(x, y, targetNode) {
        this.x = x;
        this.y = y;
        this.targetNode = targetNode;
        this.active = true;
        this.health = 3;
        this.color = '#ff00ea';
        this.type = 'parasite';
        
        if (this.targetNode) {
            this.targetNode.isInfected = true;
        }
    }

    update(time, grid) {
        if (this.targetNode) {
            this.targetNode.color = '#ff00ea';
            
            // Symbio-Virus: If active, don't slow down the node
            if (!window.game.options.symbioVirus) {
                this.targetNode.signalCooldown = 5000;
            }
        }
    }
}
