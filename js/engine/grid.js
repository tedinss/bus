class Grid {
    constructor(gridSize) {
        this.gridSize = gridSize;
        this.nodes = [];
        this.nodeMap = new Map();
    }

    worldToGrid(x, y) {
        return {
            x: Math.floor(x / this.gridSize),
            y: Math.floor(y / this.gridSize)
        };
    }

    gridToWorld(gx, gy) {
        return {
            x: gx * this.gridSize + this.gridSize / 2,
            y: gy * this.gridSize + this.gridSize / 2
        };
    }

    addNode(node) {
        const g = this.worldToGrid(node.x, node.y);
        const key = `${g.x}_${g.y}`;
        if (!this.nodeMap.has(key)) {
            const worldPos = this.gridToWorld(g.x, g.y);
            node.x = worldPos.x;
            node.y = worldPos.y;
            this.nodes.push(node);
            this.nodeMap.set(key, node);
            return true;
        }
        return false;
    }

    getNodeAtGrid(gx, gy) {
        return this.nodeMap.get(`${gx}_${gy}`);
    }

    getNodeAtWorld(x, y) {
        const g = this.worldToGrid(x, y);
        return this.getNodeAtGrid(g.x, g.y);
    }
}
