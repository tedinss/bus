class District {
    constructor(game, id, name, type, config) {
        this.game = game;
        this.id = id;
        this.name = name;
        this.type = type;
        this.gridSize = config.gridSize || 60;
        this.gridWidth = config.gridWidth || 1920;
        this.gridHeight = config.gridHeight || 1080;
        
        this.grid = new Grid(this.gridSize);
        this.economy = new Economy(this.game);
        this.chaos = new Chaos(this.game);
        this.news = new NewsSystem(this.game);
        this.news.districtName = this.name.toUpperCase();
        this.signals = [];
        this.signalPool = [];
        for (let i = 0; i < 300; i++) this.signalPool.push(new Signal(0, 0, null, {}));
        
        this.locked = false;
        this.controlPercent = 0;
        this.netFlowContribution = 0;
        this.lastUpdateTime = Date.now();
    }

    update(time, dt) {
        if (this.locked) return;

        // Logging to trace which district is updating and if it is active
        const isActive = (window.game.worldMap && this === window.game.worldMap.getSelectedDistrict());
        console.log("UPDATE", this.id, this.name, isActive);

        // Background Credit Generation (1 credit per extractor per second)
        if (this.game.gameMode === 'destruction') {
            const extractors = this.grid.nodes.filter(n => n.type === 'extractor').length;
            if (extractors > 0) {
                // dt is in ms, 1000ms = 1s
                const income = extractors * (dt / 1000); 
                this.game.globalCredits += income;
            }
        }

        // Handle input if this is the active district
        if (this.game.grid === this.grid && !this.game.paused) {
            this.handleInput();
        }

        // Update nodes
        this.grid.nodes.forEach(node => node.update(time, this.signals));

        // Update signals
        this.signals.forEach(signal => signal.update(dt));
        this.signals = this.signals.filter(s => !s.completed);

        // Update chaos
        this.chaos.update(time, this.economy, this.grid);

        // Update news
        this.news.update(time, this.economy, this.grid);
        
        // Calculate control % (simplified: based on node count and types)
        const maxNodes = 50; // Arbitrary cap for 100% control per district
        this.controlPercent = Math.min(100, (this.grid.nodes.length / maxNodes) * 100);
        
        // Net flow contribution
        this.netFlowContribution = this.grid.nodes.filter(n => n.type === 'extractor').length * 2;

        // Check for seizure
        if (this.economy.detection >= 100) {
            this.seize();
        }
    }

    handleInput() {
        if (window.game.input.mouse.clicked) {
            const nodeAtMouse = this.grid.getNodeAtWorld(window.game.input.mouse.x, window.game.input.mouse.y);
            
            if (nodeAtMouse) {
                if (window.game.connectingFrom) {
                    if (window.game.connectingFrom.connect(nodeAtMouse)) {
                        window.game.connectingFrom = null;
                    }
                } else {
                    window.game.connectingFrom = nodeAtMouse;
                }
            } else {
                if (this.economy.credits >= window.game.selectedCost) {
                    const gridPos = this.grid.worldToGrid(window.game.input.mouse.x, window.game.input.mouse.y);
                    const worldPos = this.grid.gridToWorld(gridPos.x, gridPos.y);
                    
                    if (!this.grid.getNodeAtGrid(gridPos.x, gridPos.y)) {
                        const newNode = new Node(worldPos.x, worldPos.y, window.game.selectedType, {
                            color: window.game.selectedType === 'storage' ? '#ff00ea' : '#00f2ff'
                        });
                        
                        if (this.grid.addNode(newNode)) {
                            this.economy.addCredits(-window.game.selectedCost);
                        }
                    }
                }
                window.game.connectingFrom = null;
            }
        }
    }

    seize() {
        this.locked = true;
        window.game.showNewsPopup(`District ${this.name} has been SEIZED by police forces. Network operations suspended.`, "DISTRICT LOCKDOWN");
    }

    restore() {
        const cost = 1500000;
        if (window.game.globalCredits >= cost) {
            window.game.globalCredits -= cost;
            this.locked = false;
            this.grid = new Grid(this.gridSize);
            this.economy.detection = 10;
            this.signals = [];
            return true;
        }
        return false;
    }
}
