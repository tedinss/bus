class NewsSystem {
    constructor(game) {
        this.game = game || window.game;
        this.element = document.getElementById('news-content');
        this.label = document.getElementById('news-label');
        this.messages = [
            "Welcome to the Undergrid. Keep your signals clean.",
            "Local district reports minor latency in residential zones.",
            "Net-watchers claim 'nothing is happening' in Sector 7."
        ];
        
        this.districts = [
            "Neon Plaza", "Sector 7", "The Slums", "Core Terminal", 
            "Binary Alley", "Static District", "Chrome Heights", 
            "The Ghost-Grid", "Data-Haven", "The Black-Market Loop",
            "Silicon Valley 2.0", "Zero-Day Plaza", "Firewall Ridge",
            "The Packet-Graveyard", "Encrypted Alley", "Neural Nexus"
        ];
        this.lastUpdateTime = 0;
        this.updateInterval = 8000; // 8 seconds

        this.shownPopups = new Set();
        this.shownPopups.add('welcome'); // Prevent accidental welcome repeats if we added logic here
    }

    update(time, economy, grid) {
        if (time - this.lastUpdateTime > this.updateInterval) {
            this.lastUpdateTime = time;
            this.generateNews(economy, grid);
        }
    }

    generateNews(economy, grid) {
        if (this.game.gameMode === 'destruction' && this.game.grid !== grid && Math.random() > 0.2) {
            return;
        }

        const detection = economy.detection;
        const credits = economy.credits;
        const wave = economy.wave;
        const district = this.districtName || this.districts[Math.floor(Math.random() * this.districts.length)];
        let pool = [];

        // Critical pop-up checks
        if (detection >= 50 && !this.shownPopups.has('detection50')) {
            this.showImportantNews(`POLICE INVESTIGATING STRANGE NETWORK ACTIVITY IN ${district.toUpperCase()}!`, "POLICE SCAN INITIATED");
            this.shownPopups.add('detection50');
            return;
        }
        if (detection >= 80 && !this.shownPopups.has('detection80')) {
            this.showImportantNews(`SECRET SIGNAL CARTEL SUSPECTED! MASSIVE POLICE SWEEP DEPLOYED.`, "CRITICAL ALERT");
            this.shownPopups.add('detection80');
            return;
        }

        // Flavor news
        pool.push(`Stock market in ${district} hit by sudden data spikes.`);
        pool.push(`Rival hacker group 'Null-Void' claims responsibility for net-lag.`);
        pool.push(`Cyber-coffee sales up 200% in ${district}.`);
        pool.push(`RUMOR: Legendary operator 'Cipher' seen near ${district}.`);
        pool.push(`NEW TECH: Holographic ads now 400% brighter in ${district}.`);
        pool.push(`WEATHER: Acid rain expected in ${district}. Hardware shielding recommended.`);
        pool.push(`HEALTH: Cyber-eye fatigue on the rise among data-miners.`);
        pool.push(`ECONOMY: Crypto-shards value fluctuates wildly in ${district} markets.`);
        pool.push(`AD: Upgrade your RAM today at 'The Giga-Shop' in ${district}.`);
        pool.push(`TRAFFIC: Mag-lev delays reported in the ${district} transit hub.`);

        // Detection-based news
        if (detection < 20) {
            pool.push(`Police scanners report quiet night in ${district}.`);
            pool.push(`Minor packet loss detected in local grid.`);
            pool.push(`Patrol drones in ${district} scheduled for routine maintenance.`);
            pool.push(`NET-SEC update: Most residents still using 'password123'.`);
        } else if (detection < 50) {
            pool.push(`Police investigate 'strange network activity' in ${district}.`);
            pool.push(`NET-WATCH: Unauthorized signal relays found in ${district}.`);
            pool.push(`Suspicious neon pulses reported by local residents.`);
            pool.push(`Citizen report: 'My toaster is broadcasting encrypted radio signals'.`);
            pool.push(`LOCAL NEWS: ${district} residents complain about flickering neon.`);
        } else if (detection < 80) {
            pool.push(`POLICE ALERT: SECRET SIGNAL CARTEL ACTIVITY SUSPECTED.`);
            pool.push(`Cyber-crime unit deploying additional scanners in ${district}.`);
            pool.push(`GRID OVERLOAD: Multiple illegal extractors detected.`);
            pool.push(`WANTED: Information leading to the capture of the Signal Cartel.`);
            pool.push(`CITIZEN WARNING: Stay away from suspicious terminal nodes.`);
        } else {
            pool.push(`CITY-WIDE PURGE INITIATED. ALL ILLEGAL NODES WILL BE ERASED.`);
            pool.push(`SWAT-NET teams breaching encrypted sectors in ${district}.`);
            pool.push(`WARNING: Total network collapse imminent.`);
            pool.push(`POLICE CHIEF: 'We will scrub the undergrid clean of this filth'.`);
            pool.push(`EMERGENCY BROADCAST: ALL NETWORK ACCESS SUSPENDED IN ${district.toUpperCase()}.`);
        }

        // Action-based news
        if (grid.nodes.length > 15) {
            pool.push(`Massive network growth detected in ${district} undergrid.`);
        }
        if (credits > 1000) {
            pool.push(`A new millionaire rises in the shadows. Is it the Cartel?`);
        }
        if (wave > 5) {
            pool.push(`The Undergrid complexity has increased. Efficiency is key.`);
        }
        if (grid.nodes.filter(n => n.type === 'extractor').length > 5) {
            pool.push(`Industrial-scale extraction detected. Power grid struggling.`);
        }

        const msg = pool[Math.floor(Math.random() * pool.length)];
        this.displayMessage(msg.toUpperCase(), detection > 50 ? '#ff0033' : '#00ff66');
    }

    showImportantNews(content, header) {
        this.game.showNewsPopup(content, header);
    }

    displayMessage(msg, color) {
        if (!this.element || !this.label) return;
        this.element.style.animation = 'none';
        this.element.offsetHeight; // trigger reflow
        this.element.textContent = msg.toUpperCase();
        this.element.style.color = color || '#fff';
        this.label.style.color = color || '#00ff66';
        this.element.style.animation = 'ticker 15s linear infinite';
    }
}
