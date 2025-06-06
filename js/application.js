// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
  game_manager = new GameManager(4, KeyboardInputManager, HTMLActuator, LocalScoreManager);
});

function handle_undo() {
  game_manager.move(-1);
}

function getBestMoveExpectimax() {
  const simulatedGame = new SimulatedGame(game_manager);
  return expectimax(simulatedGame, 3, null).direction;
}


// reaturn bool stands for whether the move is successful
function step() {
  const move = getBestMoveExpectimax();
  if (move === null || move === undefined) {
    return false;
  }

  game_manager.move(move);
  return true;
}

// let AI run the game by calling step() every 100ms and stopping when the game is over or hit the button stop
let aiRunning = false;
let aiInterval = null;

function runAI() {
  if (aiRunning) return;
  aiRunning = true;
  document.getElementById("ai-start").style.display = "none";
  document.getElementById("ai-stop").style.display = "inline-block";

  function aiStep() {

    if (game_manager.isGameTerminated()) {
      stopAI();
      return;
    }

    const stepResult = step();

    if (!stepResult) {
      stopAI();
      return;
    }

    aiInterval = setTimeout(aiStep, 1);
  }
  aiStep();
}

function stopAI() {
  aiRunning = false;
  clearTimeout(aiInterval);
  document.getElementById("ai-start").style.display = "inline-block";
  document.getElementById("ai-stop").style.display = "none";
}
