class Game {
    constructor() {
        window.game = this; // Set early
        this.canvas = document.getElementById('game-canvas');
        this.container = document.getElementById('game-container');
        this.renderer = new Renderer(this.canvas);
        this.input = new Input(this.canvas, this);
        this.grid = new Grid(60);
        
        // Initialize core logic first
        this.policeAI = new GlobalPoliceAI();
        this.economy = new Economy(this);
        this.chaos = new Chaos(this);
        this.hud = new HUD(this);
        this.news = new NewsSystem(this);
        this.replay = new ReplaySystem();
        this.worldMap = new WorldMap(this);
        
        // Removed global this.signals
        
        this.selectedType = 'extractor';
        this.selectedCost = 10;
        this.connectingFrom = null;
        this._signals = [];
        this.paused = false;
        this.gameStarted = false;
        this.gameMode = 'normal';
        this.scale = 1;
        this.platform = 'pc';
        this.globalCredits = 0;
        this.optionsFromPause = false;

        // Timing for recording
        this.lastRecordTime = 0;
        this.recordInterval = 2000; // ms

        // Options
        this.options = {
            sfx: true,
            fpsCounter: false,
            fpsLimit: 144,
            ghostRouter: false,
            chaosHarvest: 0,
            symbioVirus: false,
            riskMultiplier: false
        };

        // FPS tracking
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        this.fpsElement = document.getElementById('fps-counter');

        this.lastTime = 0;
        this.initUIHandlers();
        this.setupEventListeners();
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
        
        // Auto-start (wait for user platform selection)
        // this.setPlatform('pc'); // Removed auto-start

        requestAnimationFrame((t) => this.loop(t));
    }

    initUIHandlers() {
        const setClick = (id, fn) => {
            const el = document.getElementById(id);
            if (el) el.onclick = fn;
            else console.warn(`Button ${id} not found`);
        };

        const setChange = (id, fn) => {
            const el = document.getElementById(id);
            if (el) el.onchange = fn;
        };

        const setInput = (id, fn) => {
            const el = document.getElementById(id);
            if (el) el.oninput = fn;
        };

        // Platform Menu
        setClick('platform-pc', () => this.setPlatform('pc'));
        setClick('platform-phone', () => this.setPlatform('phone'));

        // Main Menu
        setClick('main-play', () => this.showPlayMenu());
        setClick('main-options', () => this.showOptionsMenu(false));

        // Play Menu
        setClick('play-normal', () => this.startGame('normal'));
        setClick('play-hard', () => this.startGame('hard'));
        setClick('play-destruction', () => this.startGame('destruction'));
        setClick('play-sandbox', () => this.startGame('sandbox'));
        setClick('play-back', () => this.showMainMenu());

        // Options Menu
        setChange('sfx-toggle', () => this.updateOptions());
        setChange('fps-toggle', () => this.updateOptions());
        setInput('fps-limit', () => this.updateOptions());
        setClick('options-back', () => {
            this.hideAllMenus();
            if (this.optionsFromPause) {
                const pauseMenu = document.getElementById('pause-menu');
                if (pauseMenu) pauseMenu.classList.remove('hidden');
            } else {
                this.showMainMenu();
            }
        });

        // Pause Menu
        setClick('pause-resume', () => this.resumeGame());
        setClick('pause-options', () => this.showOptionsMenu(true));
        setClick('pause-quit', () => this.showMainMenu());

        // HUD
        setClick('hud-menu-btn', () => this.togglePause());
        setClick('hud-map-btn', () => {
            if (this.gameMode === 'destruction') this.showWorldMap();
        });

        // News Popup
        setClick('news-ack-btn', () => this.closeNewsPopup());

        // Game Over
        setClick('game-over-replay', () => this.startReplay());
        setClick('game-over-reconnect', () => location.reload());

        // Replay
        setClick('replay-close-btn', () => this.stopReplay());

        // World Map
        setClick('world-map-cascade', () => this.initiateFinalCascade());
        setClick('world-map-enter', () => this.resumeFromWorldMap());
    }

    handleResize() {
        const targetWidth = 1920;
        const targetHeight = 1080;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const scaleX = windowWidth / targetWidth;
        const scaleY = windowHeight / targetHeight;
        this.scale = Math.min(scaleX, scaleY);

        if (this.container) {
            this.container.style.transform = `translate(-50%, -50%) scale(${this.scale})`;
        }
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'p' && this.gameStarted && !this.paused) {
                // Check if any popup is open
                const news = document.getElementById('news-popup');
                const upgrade = document.getElementById('upgrade-screen');
                if ((!news || news.classList.contains('hidden')) && (!upgrade || upgrade.classList.contains('hidden'))) {
                    this.togglePause();
                }
            }
            if (e.key.toLowerCase() === 'm' && this.gameStarted && this.gameMode === 'destruction' && !this.paused) {
                this.showWorldMap();
            }
        });
    }

    // --- State Management ---

    get signals() {
        if (this.gameMode === 'destruction' && this.worldMap) {
            const active = this.worldMap.getSelectedDistrict();
            return active ? active.signals : [];
        }
        return this._signals || [];
    }

    set signals(val) {
        if (this.gameMode === 'destruction' && this.worldMap) {
            const active = this.worldMap.getSelectedDistrict();
            if (active) active.signals = val;
        } else {
            this._signals = val;
        }
    }

    setPlatform(platform) {
        this.platform = platform;
        if (platform === 'phone') {
            if (this.container) this.container.classList.add('mobile-mode');
        } else {
            if (this.container) this.container.classList.remove('mobile-mode');
        }
        this.showMainMenu();
    }

    showMainMenu() {
        this.gameStarted = false;
        this.paused = true;
        this.hideAllMenus();
        const main = document.getElementById('main-menu');
        const overlay = document.getElementById('ui-overlay');
        if (main) main.classList.remove('hidden');
        if (overlay) overlay.classList.add('hidden');
        if (this.renderer) this.renderer.clear();
        if (this.replay) this.replay.stopRecording();
    }

    showPlayMenu() {
        this.hideAllMenus();
        const play = document.getElementById('play-menu');
        if (play) play.classList.remove('hidden');
    }

    showOptionsMenu(fromPause = false) {
        this.hideAllMenus();
        this.optionsFromPause = fromPause;
        const menu = document.getElementById('options-menu');
        if (menu) menu.classList.remove('hidden');
        
        // Sync UI
        const sfx = document.getElementById('sfx-toggle');
        const fps = document.getElementById('fps-toggle');
        const limit = document.getElementById('fps-limit');
        const limitVal = document.getElementById('fps-limit-val');

        if (sfx) sfx.checked = this.options.sfx;
        if (fps) fps.checked = this.options.fpsCounter;
        if (limit) limit.value = this.options.fpsLimit;
        if (limitVal) {
            limitVal.textContent = this.options.fpsLimit >= 144 ? 'OFF' : this.options.fpsLimit;
        }
    }

    updateOptions() {
        const sfx = document.getElementById('sfx-toggle');
        const fps = document.getElementById('fps-toggle');
        const limit = document.getElementById('fps-limit');
        const limitVal = document.getElementById('fps-limit-val');

        if (sfx) this.options.sfx = sfx.checked;
        if (fps) this.options.fpsCounter = fps.checked;
        if (limit) this.options.fpsLimit = parseInt(limit.value);
        
        if (limitVal) {
            limitVal.textContent = this.options.fpsLimit >= 144 ? 'OFF' : this.options.fpsLimit;
        }
        if (this.fpsElement) {
            this.fpsElement.classList.toggle('hidden', !this.options.fpsCounter);
        }
    }

    hideAllMenus() {
        const menus = ['platform-menu', 'main-menu', 'play-menu', 'options-menu', 'pause-menu', 'upgrade-screen', 'news-popup', 'game-over', 'replay-overlay', 'world-map'];
        menus.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.add('hidden');
            }
        });
    }

    startGame(mode) {
        this.gameMode = mode;
        this.gameStarted = true;
        this.paused = false;
        this.hideAllMenus();
        const overlay = document.getElementById('ui-overlay');
        if (overlay) overlay.classList.remove('hidden');
        
        if (mode === 'destruction') {
            this.worldMap = new WorldMap(this);
            // Initialize first district nodes
            this.initMode('destruction');
            this.showWorldMap();
        } else {
            // Reset game state
            this.grid = new Grid(60);
            this.economy = new Economy(this);
            this.chaos = new Chaos(this);
            this._signals = [];
            this.news = new NewsSystem(this);

            // Reset Replay
            this.replay.startRecording();
            this.lastRecordTime = performance.now();

            this.initMode(mode);
        }
        this.lastTime = performance.now();
    }

    initMode(mode) {
        if (mode === 'destruction') {
            // Starting nodes ONLY in North Sector
            const district = this.worldMap.getSelectedDistrict();
            if (district && district.name === "North Sector" && district.grid.nodes.length === 0) {
                this.setupStartingNodes(district.grid);
            }
            return;
        }

        this.setupStartingNodes(this.grid);

        if (mode === 'hard') {
            this.economy.addCredits(20); 
            this.economy.addDetection(40);
        } else if (mode === 'sandbox') {
            this.economy.addCredits(1000);
        } else {
            this.economy.addCredits(50);
        }

        // Welcome News
        setTimeout(() => {
            let msg = "Welcome Operator. Establish your network and extract wealth. Watchers are everywhere.";
            if (mode === 'hard') msg = "Warning: ID flagged. Surveillance active.";
            if (mode === 'sandbox') msg = "Sandbox mode initialized. Build without limits.";
            
            this.showNewsPopup(msg, "CONNECTION ESTABLISHED");
        }, 500);
    }

    setupStartingNodes(grid) {
        const s = grid.gridToWorld(5, 5);
        const t = grid.gridToWorld(10, 5);
        
        const extractor = new Node(s.x, s.y, 'extractor');
        const storage = new Node(t.x, t.y, 'storage', { color: '#ff00ea' });
        
        grid.addNode(extractor);
        grid.addNode(storage);
        extractor.connect(storage);
    }

    showWorldMap() {
        this.paused = true;
        if (this.worldMap) this.worldMap.show();
        const uiOverlay = document.getElementById('ui-overlay');
        if (uiOverlay) uiOverlay.classList.add('hidden');
        const mapBtn = document.getElementById('hud-map-btn');
        if (mapBtn && this.gameMode === 'destruction') mapBtn.classList.remove('hidden');
    }

    resumeFromWorldMap() {
        const district = this.worldMap.getSelectedDistrict();
        if (district.locked) {
            this.showNewsPopup("This district is currently locked by police. You must restore it from the world map.", "ACCESS DENIED");
            return;
        }

        // Load district state directly
        this.grid = district.grid;
        this.economy = district.economy;
        
        // Sync credits with global pool
        if (this.gameMode === 'destruction') {
            this.economy.credits = this.globalCredits;
        }

        this.chaos = district.chaos;
        this.signals = district.signals;
        this.news = district.news;

        // Ensure this district has starting nodes if it's North Sector and empty
        this.initMode('destruction');

        if (this.worldMap) this.worldMap.hide();
        this.paused = false;
        const uiOverlay = document.getElementById('ui-overlay');
        const mapBtn = document.getElementById('hud-map-btn');
        if (uiOverlay) uiOverlay.classList.remove('hidden');
        if (mapBtn && this.gameMode === 'destruction') mapBtn.classList.remove('hidden');
        this.lastTime = performance.now();
    }

    initiateFinalCascade() {
        if (this.worldMap) this.worldMap.hide();
        this.paused = true;
        
        if (this.renderer) this.renderer.shake = 100;
        this.playSound('alert');
        
        setTimeout(() => {
            this.hideAllMenus();
            const gameOver = document.getElementById('game-over');
            if (gameOver) {
                gameOver.classList.remove('hidden');
                const h1 = gameOver.querySelector('h1');
                const p = gameOver.querySelector('p');
                if (h1) h1.textContent = "WORLD DESTROYED";
                if (p) p.textContent = "The final cascade has completed. Global network collapse achieved. You are the architect of the end.";
            }
        }, 3000);
    }

    togglePause() {
        this.paused = !this.paused;
        const pauseMenu = document.getElementById('pause-menu');
        if (this.paused) {
            if (pauseMenu) pauseMenu.classList.remove('hidden');
        } else {
            if (pauseMenu) pauseMenu.classList.add('hidden');
            this.lastTime = performance.now();
        }
    }

    resumeGame() {
        this.paused = false;
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu) pauseMenu.classList.add('hidden');
        this.lastTime = performance.now();
    }

    // --- Replay System ---

    startReplay() {
        this.hideAllMenus();
        const overlay = document.getElementById('replay-overlay');
        if (overlay) overlay.classList.remove('hidden');
        if (this.replay) this.replay.play();
    }

    stopReplay() {
        const overlay = document.getElementById('replay-overlay');
        const gameOver = document.getElementById('game-over');
        if (overlay) overlay.classList.add('hidden');
        if (gameOver) gameOver.classList.remove('hidden');
    }

    spawnSignal(x, y, target, config) {
        if (this.gameMode === 'destruction') {
            const active = this.worldMap.getSelectedDistrict();
            if (!active) return null;
            
            for (let i = 0; i < active.signalPool.length; i++) {
                const s = active.signalPool[i];
                if (s.completed || !s.targetNode) {
                    s.x = x;
                    s.y = y;
                    s.targetNode = target;
                    s.speed = config.speed || 2;
                    s.value = config.value || 1;
                    s.color = config.color || '#00f2ff';
                    s.completed = false;
                    this.signals.push(s);
                    return s;
                }
            }
            const newS = new Signal(x, y, target, config);
            active.signalPool.push(newS);
            this.signals.push(newS);
            return newS;
        } else {
            // Fallback for non-destruction modes
            const newS = new Signal(x, y, target, config);
            this.signals.push(newS);
            return newS;
        }
    }

    loop(time) {
        if (!this.gameStarted) {
            requestAnimationFrame((t) => this.loop(t));
            return;
        }
        if (this.paused) {
            requestAnimationFrame((t) => this.loop(t));
            return;
        }

        let dt = time - this.lastTime;
        if (dt > 100) dt = 16.67;
        
        if (this.options.fpsLimit < 144) {
            const frameTime = 1000 / this.options.fpsLimit;
            if (dt < frameTime) {
                requestAnimationFrame((t) => this.loop(t));
                return;
            }
        }

        this.lastTime = time;

        this.frameCount++;
        if (time - this.lastFpsUpdate > 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (time - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = time;
            if (this.options.fpsCounter && this.fpsElement) {
                this.fpsElement.textContent = `FPS: ${this.fps}`;
            }
        }

        if (time - this.lastRecordTime > this.recordInterval) {
            if (this.replay) this.replay.record(this.grid);
            this.lastRecordTime = time;
            if (this.replay && this.replay.snapshots.length > 500) {
                this.replay.snapshots.shift();
            }
        }

        this.update(time, dt);
        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }

    update(time, dt) {
        if (this.gameMode === 'destruction') {
            if (this.worldMap) this.worldMap.update();
            
            this.worldMap.districts.forEach(d => {
                const isActive = (d === this.worldMap.getSelectedDistrict());
                if (!isActive) {
                    // Background simulation: Economy/Chaos/News ONLY
                    d.chaos.update(time, d.economy, d.grid);
                    d.news.update(time, d.economy, d.grid);
                    // Background credit gen
                    const extractors = d.grid.nodes.filter(n => n.type === 'extractor').length;
                    if (extractors > 0) {
                        this.globalCredits += extractors * (dt / 1000);
                    }
                } else {
                    // Active simulation
                    d.update(time, dt);
                }
            });
            
            const activeDistrict = this.worldMap.getSelectedDistrict();
            if (activeDistrict && !this.paused) {
                // Hard-sync the game's active references
                this.grid = activeDistrict.grid;
                this.economy = activeDistrict.economy;
                this.chaos = activeDistrict.chaos;
                this.news = activeDistrict.news;
                
                // Ensure signals are strictly the active district's signals
                this.signals = activeDistrict.signals;
            }
            if (this.paused) return;
        } else {
            if (this.paused) return;
            if (this.input.mouse.clicked) {
                const nodeAtMouse = this.grid.getNodeAtWorld(this.input.mouse.x, this.input.mouse.y);
                if (nodeAtMouse) {
                    if (this.connectingFrom) {
                        if (this.connectingFrom.connect(nodeAtMouse)) {
                            this.connectingFrom = null;
                        }
                    } else {
                        this.connectingFrom = nodeAtMouse;
                    }
                } else {
                    if (this.economy.credits >= this.selectedCost) {
                        const gridPos = this.grid.worldToGrid(this.input.mouse.x, this.input.mouse.y);
                        const worldPos = this.grid.gridToWorld(gridPos.x, gridPos.y);
                        if (!this.grid.getNodeAtGrid(gridPos.x, gridPos.y)) {
                            const newNode = new Node(worldPos.x, worldPos.y, this.selectedType, {
                                color: this.selectedType === 'storage' ? '#ff00ea' : '#00f2ff'
                            });
                            if (this.grid.addNode(newNode)) {
                                this.economy.addCredits(-this.selectedCost);
                            }
                        }
                    }
                    this.connectingFrom = null;
                }
            }
            this.grid.nodes.forEach(node => node.update(time, this.signals));
            this.signals.forEach(signal => signal.update(dt));
            this.signals = this.signals.filter(s => !s.completed);

            if (this.gameMode !== 'sandbox' && this.chaos) {
                const oldThreatCount = this.chaos.threats.length;
                this.chaos.update(time, this.economy, this.grid);
                if (this.chaos.threats.length > oldThreatCount) {
                    if (this.renderer) this.renderer.shake = 10;
                    this.playSound('alert');
                }
            }
            if (this.news) this.news.update(time, this.economy, this.grid);
        }
        if (this.renderer) this.renderer.updateParticles();
        if (this.input) this.input.update();
    }

    draw() {
        if (!this.renderer) return;
        this.renderer.clear();
        
        // Use current grid size for visual grid
        const gSize = (this.grid && this.grid.gridSize) ? this.grid.gridSize : 60;
        this.renderer.drawGrid(gSize, { x: 0, y: 0 });

        this.grid.nodes.forEach(node => {
            node.connections.forEach(target => {
                this.renderer.drawConnection(node, target);
            });
        });
        this.grid.nodes.forEach(node => {
            this.renderer.drawNode(node);
        });

        // Get signals strictly from active district in destruction mode
        let currentSignals = this.signals;
        if (this.gameMode === 'destruction' && this.worldMap) {
            const active = this.worldMap.getSelectedDistrict();
            currentSignals = active ? active.signals : [];
        }
        
        currentSignals.forEach(signal => {
            this.renderer.drawSignal(signal.x, signal.y, signal.color);
        });
        this.chaos.threats.forEach(threat => {
            if (threat.type === 'police') {
                this.renderer.ctx.strokeStyle = 'rgba(255, 0, 51, ' + (0.1 + Math.sin(Date.now()/200)*0.1) + ')';
                this.renderer.ctx.beginPath();
                this.renderer.ctx.arc(threat.x, threat.y, threat.radius, 0, Math.PI * 2);
                this.renderer.ctx.stroke();
                this.renderer.drawCircle(threat.x, threat.y, 10);
            } else {
                this.renderer.drawTriangle(this.renderer.ctx, threat.x, threat.y, 20);
            }
        });
        if (this.connectingFrom) {
            this.renderer.drawConnection(this.connectingFrom, this.input.mouse, 'rgba(255, 0, 234, 0.5)');
        }
        this.renderer.drawParticles();
        this.renderer.postProcess();
    }

    playSound(type) {
        if (!this.options.sfx) return;
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        if (type === 'signal') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(440, this.audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.1);
        } else if (type === 'alert') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(220, this.audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(110, this.audioCtx.currentTime + 0.5);
            gain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.5);
            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.5);
        }
    }

    showUpgradeScreen() {
        this.paused = true;
        const screen = document.getElementById('upgrade-screen');
        const choices = document.getElementById('upgrade-choices');
        if (!screen || !choices) return;
        screen.classList.remove('hidden');
        choices.innerHTML = '';
        const pool = [
            { n: 'OVERCLOCK', d: 'Faster extractors (x0.8 cd)', a: () => {
                this.grid.nodes.forEach(n => { if(n.type === 'extractor') n.signalCooldown *= 0.8; });
            }},
            { n: 'STEALTH NET', d: '-20% Detection', a: () => {
                this.economy.detection = Math.max(0, this.economy.detection - 20);
            }},
            { n: 'DATA BOOSTER', d: '+1 Signal Value', a: () => {
                this.grid.nodes.forEach(n => { n.signalValueBonus = (n.signalValueBonus || 0) + 1; });
            }},
            { n: 'GHOST ROUTER', d: 'Routers now DUPLICATE signals', a: () => {
                this.options.ghostRouter = true;
            }},
            { n: 'CHAOS HARVEST', d: 'Active threats generate money', a: () => {
                this.options.chaosHarvest = (this.options.chaosHarvest || 0) + 5;
            }},
            { n: 'SYMBIO-VIRUS', d: 'Parasites now DOUBLE node speed', a: () => {
                this.options.symbioVirus = true;
            }},
            { n: 'RISK MULTIPLIER', d: 'Value scales with Detection', a: () => {
                this.options.riskMultiplier = true;
            }}
        ];
        const selected = pool.sort(() => 0.5 - Math.random()).slice(0, 3);
        selected.forEach(u => {
            const div = document.createElement('div');
            div.className = 'upgrade-card';
            div.innerHTML = `<h3>${u.n}</h3><p>${u.d}</p>`;
            div.onclick = () => {
                u.a();
                screen.classList.add('hidden');
                this.paused = false;
                this.lastTime = performance.now();
            };
            choices.appendChild(div);
        });
    }

    handleDistrictSeizure() {
        const activeDistrict = this.worldMap.getSelectedDistrict();
        if (activeDistrict) {
            activeDistrict.seize();
        }
    }

    gameOver() {
        this.paused = true;
        const gameOver = document.getElementById('game-over');
        if (gameOver) gameOver.classList.remove('hidden');
        if (this.replay) this.replay.stopRecording();
    }

    showNewsPopup(content, header) {
        this.paused = true;
        const popup = document.getElementById('news-popup');
        if (popup) {
            const h = document.getElementById('news-popup-header');
            const c = document.getElementById('news-popup-content');
            if (h) h.textContent = header || "BREAKING NEWS";
            if (c) c.textContent = content;
            popup.classList.remove('hidden');
        }
        this.playSound('alert');
    }

    closeNewsPopup() {
        const popup = document.getElementById('news-popup');
        if (popup) popup.classList.add('hidden');
        this.paused = false;
        this.lastTime = performance.now();
    }
}

window.onload = () => {
    try {
        console.log("SIGNAL CARTEL: Initializing system...");
        new Game();
        console.log("SIGNAL CARTEL: System online.");
    } catch (e) {
        console.error("SIGNAL CARTEL: CRITICAL SYSTEM FAILURE:", e);
    }
};
