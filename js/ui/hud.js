class HUD {
    constructor(game) {
        this.game = game;
        this.buildMenu = document.getElementById('build-menu');
        this.nodeTypes = [
            { type: 'extractor', label: 'EXTRACTOR', cost: 10 },
            { type: 'router', label: 'ROUTER', cost: 5 },
            { type: 'splitter', label: 'SPLITTER', cost: 10 },
            { type: 'amplifier', label: 'AMPLIFIER', cost: 20 },
            { type: 'storage', label: 'STORAGE', cost: 15 }
        ];
        this.init();
    }

    init() {
        if (!this.buildMenu) {
            console.warn("Build menu container not found");
            return;
        }
        this.nodeTypes.forEach(node => {
            const btn = document.createElement('button');
            btn.className = 'build-btn';
            btn.textContent = `${node.label} (${node.cost})`;
            btn.addEventListener('click', () => {
                this.game.selectedType = node.type;
                this.game.selectedCost = node.cost;
            });
            this.buildMenu.appendChild(btn);
        });
    }
}
