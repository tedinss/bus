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

// Start game safely
window.onload = () => {
    try {
        console.log("SIGNAL CARTEL: Initializing system...");
        new Game();
        console.log("SIGNAL CARTEL: System online.");
    } catch (e) {
        console.error("SIGNAL CARTEL: CRITICAL SYSTEM FAILURE:", e);
    }
};
