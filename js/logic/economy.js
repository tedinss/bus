class Economy {
    constructor(game) {
        this.game = game;
        this.credits = 0;
        this.detection = 0;
        this.wave = 1;
        this.signalsProcessed = 0;
        this.signalsForNextWave = 20;
        
        this.elements = {
            credits: document.getElementById('credits'),
            detection: document.getElementById('detection'),
            wave: document.getElementById('wave')
        };
    }

    addCredits(amount) {
        this.credits += amount;
        if (this.game && this.game.gameMode === 'destruction') {
            this.game.globalCredits = (this.game.globalCredits || 0) + amount;
            this.credits = this.game.globalCredits; // Sync local with global
        }
        this.signalsProcessed++;
        
        if (this.signalsProcessed >= this.signalsForNextWave) {
            this.nextWave();
        }
        this.updateUI();
    }

    nextWave() {
        this.wave++;
        this.signalsProcessed = 0;
        this.signalsForNextWave = Math.floor(this.signalsForNextWave * 1.5);
        this.game.showUpgradeScreen();
    }

    addDetection(amount) {
        this.detection = Math.min(100, this.detection + amount);
        if (this.detection >= 100) {
            if (this.game && this.game.gameMode === 'destruction') {
                this.game.handleDistrictSeizure();
            } else {
                this.game.gameOver();
            }
        }
        this.updateUI();
    }

    updateUI() {
        if (this.game && this.game.gameMode === 'destruction') {
            this.credits = this.game.globalCredits;
        }
        if (this.elements.credits) this.elements.credits.textContent = Math.floor(this.credits);
        if (this.elements.detection) this.elements.detection.textContent = Math.floor(this.detection);
        if (this.elements.wave) this.elements.wave.textContent = this.wave;
    }
}
