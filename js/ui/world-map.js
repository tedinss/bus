class WorldMap {
    constructor(game) {
        this.game = game;
        this.districts = [];
        this.selectedDistrictIndex = 0;
        this.isVisible = false;
        
        this.districtNames = [
            "North Sector", "Industrial Core", "Financial Nexus",
            "Coastal Grid", "Research Zone", "Government Network"
        ];
        
        this.initDistricts();
    }

    initDistricts() {
        const types = ['small', 'medium', 'large'];
        for (let i = 0; i < 6; i++) {
            const type = types[i % 3];
            let gridSize = 60;
            if (type === 'small') gridSize = 80;
            if (type === 'large') gridSize = 40;
            
            this.districts.push(new District(
                this.game,
                i,
                this.districtNames[i],
                type,
                { gridSize: gridSize }
            ));
        }
    }

    update() {
        let totalControl = 0;
        this.districts.forEach(d => {
            totalControl += d.controlPercent;
        });
        
        this.globalNetFlowControl = totalControl / 6; // Average control
        
        if (this.isVisible) {
            this.updateUI();
        }
        
        if (this.globalNetFlowControl >= 99) {
            document.getElementById('red-button-container').classList.remove('hidden');
        }
    }

    show() {
        this.isVisible = true;
        document.getElementById('world-map').classList.remove('hidden');
        this.updateUI();
    }

    hide() {
        this.isVisible = false;
        document.getElementById('world-map').classList.add('hidden');
    }

    updateUI() {
        document.getElementById('global-control').textContent = this.globalNetFlowControl.toFixed(1);
        
        let globalStatsEl = document.getElementById('global-stats');
        globalStatsEl.innerHTML = `
            WORLD NET-FLOW CONTROL: <span id="global-control">${this.globalNetFlowControl.toFixed(1)}</span>%
            <div style="font-size: 1rem; color: var(--neon-pink); margin-top: 10px;">
                GLOBAL CREDITS: ${Math.floor(this.game.globalCredits).toLocaleString()}
            </div>
        `;
        
        const container = document.getElementById('districts-container');
        container.innerHTML = '';
        
        this.districts.forEach((d, index) => {
            const card = document.createElement('div');
            card.className = `district-card ${index === this.selectedDistrictIndex ? 'selected' : ''} ${d.locked ? 'locked' : ''}`;
            
            card.innerHTML = `
                <h3>${d.name}</h3>
                <div class="stat-line">TYPE: ${d.type.toUpperCase()}</div>
                <div class="stat-line">CONTROL: ${d.controlPercent.toFixed(1)}%</div>
                <div class="stat-line">NET-FLOW: +${d.netFlowContribution}</div>
                <div class="stat-line">DETECTION: ${Math.floor(d.economy.detection)}%</div>
                <div class="stat-line">STATUS: ${d.locked ? 'LOCKED' : 'ACTIVE'}</div>
                ${d.locked ? `<button class="restore-btn" onclick="event.stopPropagation(); window.game.worldMap.restoreDistrict(${index})">RESTORE (1.5M)</button>` : ''}
            `;
            
            card.onclick = () => {
                this.selectedDistrictIndex = index;
                this.updateUI();
            };
            
            container.appendChild(card);
        });
    }

    restoreDistrict(index) {
        const d = this.districts[index];
        if (d.restore()) {
            this.updateUI();
        } else {
            this.game.showNewsPopup("Insufficient global credits to restore district operations. 1,500,000 required.", "FUNDS DEPLETED");
        }
    }

    getSelectedDistrict() {
        return this.districts[this.selectedDistrictIndex];
    }
}
