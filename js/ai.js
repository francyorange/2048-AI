class SimulatedGame {
    constructor(gameManager = null) {
        if (gameManager) {
            // Clone from existing game manager
            this.size = gameManager.size || 4;
            this.score = gameManager.score || 0;

            // Clone the grid
            this.grid = {
                size: this.size,
                cells: []
            };

            // Initialize empty grid
            for (let x = 0; x < this.size; x++) {
                this.grid.cells[x] = [];
                for (let y = 0; y < this.size; y++) {
                    this.grid.cells[x][y] = null;
                }
            }

            // Copy tiles from original game
            if (gameManager.grid && gameManager.grid.cells) {
                for (let x = 0; x < this.size; x++) {
                    for (let y = 0; y < this.size; y++) {
                        const originalTile = gameManager.grid.cells[x][y];
                        if (originalTile) {
                            this.grid.cells[x][y] = {
                                x: originalTile.x,
                                y: originalTile.y,
                                value: originalTile.value
                            };
                        }
                    }
                }
            }
        } else {
            // Create empty game
            this.size = 4;
            this.score = 0;
            this.grid = {
                size: 4,
                cells: []
            };

            for (let x = 0; x < 4; x++) {
                this.grid.cells[x] = [];
                for (let y = 0; y < 4; y++) {
                    this.grid.cells[x][y] = null;
                }
            }
        }
    }

    // Clone the current simulated game
    clone() {
        const cloned = new SimulatedGame();
        cloned.size = this.size;
        cloned.score = this.score;

        // Deep clone the grid
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                const tile = this.grid.cells[x][y];
                if (tile) {
                    cloned.grid.cells[x][y] = {
                        x: tile.x,
                        y: tile.y,
                        value: tile.value
                    };
                } else {
                    cloned.grid.cells[x][y] = null;
                }
            }
        }

        return cloned;
    }

    // Add a tile at specific position with specific value
    addTile(x, y, value) {
        this.grid.cells[x][y] = {
            x: x,
            y: y,
            value: value
        };
    }

    // Get available cells (empty positions)
    availableCells() {
        const cells = [];
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                if (!this.grid.cells[x][y]) {
                    cells.push({ x: x, y: y });
                }
            }
        }
        return cells;
    }

    // Check if game is terminated
    isGameTerminated() {
        // Check for available cells
        if (this.availableCells().length > 0) {
            return false;
        }

        // Check for possible merges
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                const tile = this.grid.cells[x][y];
                if (tile) {
                    // Check right neighbor
                    if (x < this.size - 1) {
                        const rightTile = this.grid.cells[x + 1][y];
                        if (rightTile && tile.value === rightTile.value) {
                            return false;
                        }
                    }
                    // Check bottom neighbor
                    if (y < this.size - 1) {
                        const bottomTile = this.grid.cells[x][y + 1];
                        if (bottomTile && tile.value === bottomTile.value) {
                            return false;
                        }
                    }
                }
            }
        }

        return true;
    }

    // Get vector for direction
    getVector(direction) {
        const map = {
            0: { x: 0, y: -1 }, // Up
            1: { x: 1, y: 0 },  // Right
            2: { x: 0, y: 1 },  // Down
            3: { x: -1, y: 0 }  // Left
        };
        return map[direction];
    }

    // Build traversals for direction
    buildTraversals(vector) {
        const traversals = { x: [], y: [] };

        for (let pos = 0; pos < this.size; pos++) {
            traversals.x.push(pos);
            traversals.y.push(pos);
        }

        // Always traverse from the farthest cell in the chosen direction
        if (vector.x === 1) traversals.x = traversals.x.reverse();
        if (vector.y === 1) traversals.y = traversals.y.reverse();

        return traversals;
    }

    // Find the farthest position and next cell in that direction
    findFarthestPosition(cell, vector) {
        let previous;

        // Progress towards the vector direction until an obstacle is found
        do {
            previous = cell;
            cell = { x: previous.x + vector.x, y: previous.y + vector.y };
        } while (this.withinBounds(cell) && this.cellAvailable(cell));

        return {
            farthest: previous,
            next: cell // Used to check if a merge is required
        };
    }

    // Check if position is within bounds
    withinBounds(position) {
        return position.x >= 0 && position.x < this.size &&
            position.y >= 0 && position.y < this.size;
    }

    // Check if cell is available
    cellAvailable(cell) {
        return !this.cellOccupied(cell);
    }

    // Check if cell is occupied
    cellOccupied(cell) {
        return !!this.grid.cells[cell.x][cell.y];
    }

    // Get cell content
    cellContent(cell) {
        if (this.withinBounds(cell)) {
            return this.grid.cells[cell.x][cell.y];
        } else {
            return null;
        }
    }

    // Remove tile
    removeTile(tile) {
        this.grid.cells[tile.x][tile.y] = null;
    }

    // Insert tile
    insertTile(tile) {
        this.grid.cells[tile.x][tile.y] = tile;
    }

    move(direction) {
        const vector = this.getVector(direction);
        const traversals = this.buildTraversals(vector);
        let moved = false;


        traversals.x.forEach((x) => {
            traversals.y.forEach((y) => {
                const cell = { x: x, y: y };
                const tile = this.cellContent(cell);
                if (!tile) return;

                const positions = this.findFarthestPosition(cell, vector);
                const next = this.cellContent(positions.next);

                if (next && next.value === tile.value && !next.mergedFrom) {
                    this.removeTile(tile);
                    this.removeTile(next);

                    const merged = {
                        x: next.x,
                        y: next.y,
                        value: tile.value * 2,
                        mergedFrom: [tile, next]
                    };
                    this.insertTile(merged);
                    this.score += merged.value;
                    moved = true;
                } else {
                    if (positions.farthest.x !== tile.x || positions.farthest.y !== tile.y) {
                        this.removeTile(tile);
                        tile.x = positions.farthest.x;
                        tile.y = positions.farthest.y;
                        this.insertTile(tile);
                        moved = true;
                    }
                }
            });
        });
        // Clear mergedFrom flags for next move
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                const tile = this.grid.cells[x][y];
                if (tile && tile.mergedFrom) {
                    delete tile.mergedFrom;
                }
            }
        }

        return moved;
    }
}
// Get current grid and transform it into a 2D array
function getGrid(game) {
    var grid = [];
    for (var i = 0; i < game.grid.size; i++) {
        grid[i] = [];
        for (var j = 0; j < game.grid.size; j++) {
            const tile = game.grid.cells[i][j];
            if (tile) {
                grid[i][j] = tile.value;
            } else {
                grid[i][j] = 0;
            }
        }
    }
    return grid;
}





const directions = [0, 1, 2, 3]; // 0: up, 1: right, 2: down, 3: left

// Heuristic function to calculate the score of the current game state

const bestSnake = [
    [65536, 32768, 16384, 8192],
    [512, 1024, 2048, 4096],
    [256, 128, 64, 32],
    [2, 4, 8, 16]
];
function originalSnakeScore(game) {
    if (game.isGameTerminated()) {
        return -Infinity;
    }
    const grid = getGrid(game);
    let score = 0;
    for (var i = 0; i < grid.length; i++) {
        for (var j = 0; j < grid.length; j++) {
            score += grid[i][j] * bestSnake[i][j];
        }
    }
    const emptyCells = game.availableCells().length;
    for (let i = 0; i < emptyCells; i++) {
        score *= 2;
    }
    return score;
}



// Yanling's version of the snake score function: added more strategies with agressive weight
function yanlingScore(game) {
    if (game.isGameTerminated()) {
        return -Infinity; // Return a very low score if the game is over
    }

    var grid = getGrid(game);
    var score = game.score; // real score from the game

    // space reward
    var emptyCells = game.availableCells().length;
    emptyCells = Math.min(emptyCells, 8);
    if (emptyCells >= 4) {
        score *= Math.pow(2, emptyCells);
    }

    // monotonicity reward (row)
    for (let row of grid) {
        if (isMonotonic(row)) {
            score *= 2;
        }
    }

    // find max value position
    let maxX = 0, maxY = 0, maxN = 0;
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid.length; j++) {
            if (grid[i][j] > maxN) {
                maxN = grid[i][j];
                maxX = i;
                maxY = j;
            }
        }
    }

    // corner positions(max value in any corner)
    if ((maxX === 0 || maxX === grid.length - 1) && (maxY === 0 || maxY === grid.length - 1)) {
        score *= 100;
    }

    return score;
}

// check monotonicity of an array
function isMonotonic(arr) {
    const filtered = arr.filter(x => x !== 0);
    if (filtered.length < 2) return true;

    let increasing = true;
    let decreasing = true;

    for (let i = 1; i < filtered.length; i++) {
        if (filtered[i] > filtered[i - 1]) decreasing = false;
        if (filtered[i] < filtered[i - 1]) increasing = false;
    }

    return increasing || decreasing;
}


// configurable snakescore: defaufult superSnake
let debugWeights = {
    baseScoreWeight: 0.1,
    emptyCellBonus: 500,
    emptyCellThreshold: 4,
    emptyCellMultiplier: 2,
    monotonicBonus: 10000,
    cornerMultiplier: 500,
    snakeWeight: 2,  // snake weight: the lower the better
    snakeBonus: 5     // snake bonus multiplier
};


function configurableSnakeScore(game) {
    if (game.isGameTerminated()) {
        return -Infinity;
    }

    var grid = getGrid(game);
    var score = game.score * debugWeights.baseScoreWeight;

    const details = {
        baseScore: game.score * debugWeights.baseScoreWeight,
        components: []
    };

    // space reward
    var emptyCells = Math.min(game.availableCells().length, 8);
    const emptyCellScore = emptyCells * debugWeights.emptyCellBonus;
    score += emptyCellScore;
    details.components.push(`space reward: ${emptyCells} × ${debugWeights.emptyCellBonus} = +${emptyCellScore}`);

    if (emptyCells >= debugWeights.emptyCellThreshold) {
        score *= debugWeights.emptyCellMultiplier;
        details.components.push(`space multiplier: ×${debugWeights.emptyCellMultiplier} (≥${debugWeights.emptyCellThreshold}spaces)`);
    }

    // monotonicity reward
    var monotonicBonus = 0;
    let monotonicCount = 0;

    // monotonicity in rows
    for (let row of grid) {
        if (isMonotonic(row)) {
            monotonicBonus += debugWeights.monotonicBonus;
            monotonicCount++;
        }
    }

    // monotonicity in columns
    for (let j = 0; j < 4; j++) {
        let col = [grid[0][j], grid[1][j], grid[2][j], grid[3][j]];
        if (isMonotonic(col)) {
            monotonicBonus += debugWeights.monotonicBonus;
            monotonicCount++;
        }
    }

    score += monotonicBonus;
    details.components.push(`monotonicity: ${monotonicCount} × ${debugWeights.monotonicBonus} = +${monotonicBonus}`);

    // corner positions (max value in any corner)
    let maxX = 0, maxY = 0, maxN = 0;
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid.length; j++) {
            if (grid[i][j] > maxN) {
                maxN = grid[i][j];
                maxX = i;
                maxY = j;
            }
        }
    }

    const isInCorner = (maxX === 0 || maxX === grid.length - 1) && (maxY === 0 || maxY === grid.length - 1);
    if (isInCorner) {
        score *= debugWeights.cornerMultiplier;
        details.components.push(`corner reward: ×${debugWeights.cornerMultiplier} (Max value${maxN}in corner[${maxX},${maxY}])`);
    }

    // snake reward
    const corners = [
        [[16, 15, 14, 13], [9, 10, 11, 12], [8, 7, 6, 5], [1, 2, 3, 4]],
        [[13, 14, 15, 16], [12, 11, 10, 9], [5, 6, 7, 8], [4, 3, 2, 1]],
        [[4, 3, 2, 1], [5, 6, 7, 8], [12, 11, 10, 9], [13, 14, 15, 16]],
        [[1, 2, 3, 4], [8, 7, 6, 5], [9, 10, 11, 12], [16, 15, 14, 13]]
    ];

    let bestSnakeScore = 0;
    let bestSnakeIndex = 0;

    for (let k = 0; k < corners.length; k++) {
        let snakeScore = 0;
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                snakeScore += grid[i][j] * corners[k][i][j];
            }
        }
        if (snakeScore > bestSnakeScore) {
            bestSnakeScore = snakeScore;
            bestSnakeIndex = k;
        }
    }

    // big snake bonus
    const snakeBonus = (bestSnakeScore / debugWeights.snakeWeight) * debugWeights.snakeBonus;
    score += snakeBonus;

    const cornerNames = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];
    details.components.push(`snake path: ${bestSnakeScore} ÷ ${debugWeights.snakeWeight} × ${debugWeights.snakeBonus} = +${snakeBonus.toFixed(2)} (${cornerNames[bestSnakeIndex]})`);

    details.finalScore = score;
    details.emptyCells = emptyCells;
    details.monotonicCount = monotonicCount;
    details.maxValue = maxN;
    details.maxPosition = [maxX, maxY];
    details.isInCorner = isInCorner;
    details.bestSnakeScore = bestSnakeScore;
    details.bestSnakePattern = cornerNames[bestSnakeIndex];

    configurableSnakeScore.lastDetails = details;
    return score;
}



// choose one of the snake score functions to use
function snakeScore(game) {
    // return originalSnakeScore(game);    
    // return yanlingScore(game); 
    return configurableSnakeScore(game);
}



function expectimax(simulatedGame, depth, direction) {
    if (depth < 0 || simulatedGame.isGameTerminated()) {
        const score = simulatedGame.isGameTerminated() ? -Infinity : snakeScore(simulatedGame);
        return { score: score, direction: direction };
    }
    const isPlayerTurn = (depth === Math.floor(depth));

    if (isPlayerTurn) {
        let bestScore = -Infinity;
        let bestScoreDirection = null;

        for (let move = 0; move < directions.length; move++) {
            const newGame = simulatedGame.clone();
            if (!newGame.move(move)) {
                continue;
            }
            const score = expectimax(newGame, depth - 0.5, move).score;
            if (score >= bestScore) {
                bestScore = score;
                bestScoreDirection = move;
            }
        }

        return {
            score: bestScore,
            direction: bestScoreDirection
        }
    } else {
        // computer's turn
        const cells = simulatedGame.availableCells();
        if (cells.length === 0) {
            return { score: snakeScore(simulatedGame), direction: direction };
        }
        const scores = [];
        for (var i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const newGame2 = simulatedGame.clone();
            newGame2.addTile(cell.x, cell.y, 2);
            const score = expectimax(newGame2, depth - 0.5, direction).score;
            // Simulate adding a 4 tile (10% chance) - didn't use because it was too slow and didn't improve results much
            // var newGame4 = simulatedGame.clone();
            // newGame4.addTile(cell.x, cell.y, 4);
            // score += expectimax(newGame4, depth - 0.5, direction).score * 0.1;
            scores.push(score);
        }

        return {
            score: scores.reduce((a, b) => a + b, 0) / scores.length,
            direction: direction
        }
    }
}
