class Input {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game || window.game;
        this.mouse = { x: 0, y: 0, down: false, clicked: false };
        
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            // Map window mouse coordinates to 1920x1080 virtual space
            const scale = this.game ? this.game.scale : 1;
            this.mouse.x = (e.clientX - rect.left) / scale;
            this.mouse.y = (e.clientY - rect.top) / scale;
        });

        canvas.addEventListener('mousedown', () => {
            this.mouse.down = true;
            this.mouse.clicked = true;
        });

        canvas.addEventListener('mouseup', () => {
            this.mouse.down = false;
        });
    }

    update() {
        // Reset clicked state after each frame's check
        this.mouse.clicked = false;
    }
}
