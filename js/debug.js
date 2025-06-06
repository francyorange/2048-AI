// Debugging weights
window.debugAI = {
    // View current weights
    showWeights: () => {
        console.log('Current weight configuration:');
        console.log(debugWeights);
        return debugWeights;
    },

    // Set individual weight
    setWeight: (key, value) => {
        if (debugWeights.hasOwnProperty(key)) {
            debugWeights[key] = value;
            console.log(`${key} set to ${value}`);
        } else {
            console.log('Available weight keys:', Object.keys(debugWeights));
        }
    },

    // Preset: Strong snake strategy
    useStrongSnake: () => {
        debugWeights.snakeWeight = 5;        // Lower divisor to enhance snake weighting
        debugWeights.snakeBonus = 3;         // Increase snake score multiplier
        debugWeights.cornerMultiplier = 200; // Enhance corner strategy
        debugWeights.monotonicBonus = 8000;  // Enhance monotonicity reward
        console.log('Switched to strong snake mode');
        return debugWeights;
    },

    // Preset: Super snake strategy
    useSuperSnake: () => {
        debugWeights.snakeWeight = 2;        // Greatly lower divisor
        debugWeights.snakeBonus = 5;         // Greatly boost multiplier
        debugWeights.cornerMultiplier = 500; // Strong corner strategy
        debugWeights.monotonicBonus = 10000; // Strong monotonicity reward
        debugWeights.emptyCellBonus = 500;   // Lower empty cell bonus to emphasize snake
        console.log('Switched to super snake mode');
        return debugWeights;
    },

    // Preset: Balanced strategy
    useBalanced: () => {
        debugWeights.snakeWeight = 10;
        debugWeights.snakeBonus = 1;
        debugWeights.cornerMultiplier = 100;
        debugWeights.monotonicBonus = 5000;
        debugWeights.emptyCellBonus = 1000;
        console.log('Switched to balanced mode');
        return debugWeights;
    },

    // Quickly adjust snake strength
    setSnakeStrength: (strength) => {
        // strength: 1=weak, 2=medium, 3=strong, 4=very strong, 5=extreme
        const configs = {
            1: { snakeWeight: 20, snakeBonus: 0.5 },
            2: { snakeWeight: 10, snakeBonus: 1 },
            3: { snakeWeight: 5, snakeBonus: 2 },
            4: { snakeWeight: 3, snakeBonus: 3 },
            5: { snakeWeight: 1, snakeBonus: 5 }
        };

        if (configs[strength]) {
            debugWeights.snakeWeight = configs[strength].snakeWeight;
            debugWeights.snakeBonus = configs[strength].snakeBonus;
            console.log(`Snake strength set to ${strength} (weight: ${debugWeights.snakeWeight}, bonus: ${debugWeights.snakeBonus})`);
        } else {
            console.log('Snake strength must be between 1 (weak) and 5 (extreme)');
        }
    }
};

function exportGridOnlyPrettyJSONStringTransposed(game) {
    const grid = game.grid.cells;
    let lines = [];

    for (let y = 0; y < 4; y++) {
        let row = [];
        for (let x = 0; x < 4; x++) {
            const tile = grid[x][y];
            const value = tile ? tile.value.toString().padStart(6, ' ') : '      ';
            row.push(value);
        }
        lines.push('[ ' + row.join(',') + ' ]');
    }

    return '[\n' + lines.join('\n') + '\n]';
}


function traceExpectimaxWithTopLevelScores(game, maxDepth = 2) {
    const topScores = new Map(); // direction → best terminal score

    for (let move = 0; move < 4; move++) {
        const dir = ['↑', '→', '↓', '←'][move];
        const newGame = game.clone();
        if (!newGame.move(move)) {
            console.log(`Direction ${dir} is invalid`);
            topScores.set(dir, null); // Mark as unmovable
            continue;
        }

        let maxTerminalScore = -Infinity;

        function recurse(g, depth, path = [dir], prefix = '') {
            if (depth < 0 || g.isGameTerminated()) {
                const score = snakeScore(g);
                if (score > maxTerminalScore) {
                    maxTerminalScore = score;
                }

                const gridStr = exportGridOnlyPrettyJSONStringTransposed(g)
                    .split('\n')
                    .map(line => prefix + line)
                    .join('\n');

                console.log(`Path: ${path.join(' | ')}\n Score: ${score.toExponential(3)}\n${gridStr}\n`);
                return;
            }

            const isPlayerTurn = (depth === Math.floor(depth));
            if (isPlayerTurn) {
                for (let m = 0; m < 4; m++) {
                    const newG = g.clone();
                    if (!newG.move(m)) continue;
                    recurse(newG, depth - 0.5, [...path, ['↑', '→', '↓', '←'][m]], prefix + '  ');
                }
            } else {
                const cells = g.availableCells();
                for (const cell of cells) {
                    const newG = g.clone();
                    newG.addTile(cell.x, cell.y, 2);
                    recurse(newG, depth - 0.5, [...path, `Add(2 @ ${cell.x},${cell.y})`], prefix + '  ');
                }
            }
        }

        recurse(newGame, maxDepth - 0.5);
        topScores.set(dir, maxTerminalScore);
    }

    // Print direction score summary
    console.log(`Max terminal scores per direction:`);
    for (const dir of ['↑', '→', '↓', '←']) {
        const val = topScores.get(dir);
        const scoreStr = val === null || val === -Infinity ? 'Invalid' : val.toExponential(3);
        console.log(`  ${dir} : ${scoreStr}`);
    }

    // Recommend best direction
    const filtered = [...topScores.entries()].filter(([_, v]) => v !== null && v !== -Infinity);
    if (filtered.length > 0) {
        const best = filtered.reduce((a, b) => (b[1] > a[1] ? b : a));
        console.log(`Recommended direction: ${best[0]} (score: ${best[1].toExponential(3)})`);
    } else {
        console.log(`No valid directions available`);
    }

    return topScores;
}

// Usage example:
// const topLevel = traceExpectimaxWithTopLevelScores(sim, 2);
// console.log('Summary:', Object.fromEntries(topLevel));