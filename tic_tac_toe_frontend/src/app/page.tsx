"use client";
import { useState, useEffect } from "react";

// Color Theme
const COLORS = {
  primary: "#1a73e8",
  accent: "#34a853",
  secondary: "#fbbc05",
  x: "#1a73e8",
  o: "#34a853",
  boardBg: "#f9fafb",
  border: "#e0e0e0",
};

enum Player {
  X = "X",
  O = "O"
}

type CellValue = Player | "";

type GameMode = "single" | "multi";

const emptyBoard: CellValue[] = Array(9).fill("");

/* (removed unused getNextPlayer to fix lint error) */

const winCombos = [
  [0,1,2],[3,4,5],[6,7,8], // rows
  [0,3,6],[1,4,7],[2,5,8], // cols
  [0,4,8],[2,4,6] // diagonals
]

function checkWinner(board: CellValue[]): Player | "draw" | null {
  for (const combo of winCombos) {
    const [a, b, c] = combo;
    if (
      board[a] &&
      board[a] === board[b] &&
      board[a] === board[c]
    ) {
      return board[a] as Player;
    }
  }
  if (board.every(c => c)) return "draw";
  return null;
}

// Simple AI: pick winning move, block opponent, or pick random.
function computeAIMove(board: CellValue[], aiPlayer: Player, humanPlayer: Player): number {
  // Try to win
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      const newBoard = [...board];
      newBoard[i] = aiPlayer;
      if (checkWinner(newBoard) === aiPlayer) return i;
    }
  }
  // Block human
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      const newBoard = [...board];
      newBoard[i] = humanPlayer;
      if (checkWinner(newBoard) === humanPlayer) return i;
    }
  }
  // Pick center if free
  if (!board[4]) return 4;
  // Pick random available
  const available = board.map((c, i) => [c, i]).filter(([c]) => !c).map(([, i]) => i);
  return available[Math.floor(Math.random() * available.length)];
}

// PUBLIC_INTERFACE
export default function Home() {
  // Main state
  const [mode, setMode] = useState<GameMode>("single");
  const [board, setBoard] = useState<CellValue[]>([...emptyBoard]);
  const [winner, setWinner] = useState<Player | "draw" | null>(null);
  const [current, setCurrent] = useState<Player>(Player.X);
  const [aiThinking, setAiThinking] = useState<boolean>(false);
  const [firstPlayer, setFirstPlayer] = useState<Player>(Player.X);

  // -- Game Logic --
  useEffect(() => {
    if (winner || mode === "multi") return;
    // AI is always O (second player) for simplicity
    if (mode === "single" && current === Player.O && !winner) {
      setAiThinking(true);
      const aiMoveTimer = setTimeout(() => {
        const move = computeAIMove(board, Player.O, Player.X);
        handleCellClick(move, true);
        setAiThinking(false);
      }, 500 + Math.random() * 500); // subtle delay for realism
      return () => clearTimeout(aiMoveTimer);
    }
  // eslint-disable-next-line
  }, [board, current, winner, mode]);

  function handleCellClick(idx: number, isAI = false) {
    if (winner || board[idx] || (mode === "single" && current === Player.O && !isAI)) {
      return;
    }
    const newBoard = [...board];
    newBoard[idx] = current;
    setBoard(newBoard);
    const gameResult = checkWinner(newBoard);
    if (gameResult) {
      setWinner(gameResult);
    } 
    setCurrent((prev) => prev === Player.X ? Player.O : Player.X);
  }

  function handleReset() {
    setBoard([...emptyBoard]);
    setWinner(null);
    // Alternate starter in single player: makes replay more fun
    if (mode === "single") {
      setFirstPlayer((fp) => fp === Player.X ? Player.O : Player.X);
      setCurrent(firstPlayer === Player.X ? Player.O : Player.X);
    } else {
      setCurrent(Player.X);
    }
  }

  function handleModeChange(newMode: GameMode) {
    setMode(newMode);
    setBoard([...emptyBoard]);
    setWinner(null);
    setFirstPlayer(Player.X);
    setCurrent(Player.X);
  }

  // Animations (simple grow on cell, fade in for winner bar, hover for reset)
  function cellAnimClass(idx: number): string {
    if (!board[idx]) return "animate-none";
    // pop-in animation on move
    return "animate-pop";
  }

  // Display helpers
  function renderStatus() {
    if (winner === "draw") return (
      <div className="text-center text-lg text-gray-700 fade-in">It&apos;s a draw!</div>
    );
    if (winner === Player.X || winner === Player.O) {
      return (
        <div className="text-center text-lg fade-in" style={{color: winner === Player.X ? COLORS.x : COLORS.o}}>
          {winner === Player.X ? "X" : "O"} wins!
        </div>
      );
    }
    return (
      <div className="text-center text-base text-gray-600 fade-in">
        {mode === "single"
          ? (current === Player.X ? "Your" : "AI") + "'s turn"
          : current + "'s turn"}
        {mode === "single" && aiThinking && current === Player.O && (
          <span className="ml-2 text-xs text-gray-400 animate-pulse">Thinking...</span>
        )}
      </div>
    );
  }

  return (
    <main className="min-h-screen px-2 flex flex-col items-center justify-center bg-white">
      <h1
        className="text-[2.45rem] md:text-5xl font-light mb-3 text-center"
        style={{color: COLORS.primary, letterSpacing: "-1px"}}
      >
        Tic Tac Toe
      </h1>

      <div
        className="flex flex-row justify-center gap-2 mb-5"
        aria-label="Game mode selection"
      >
        <button
          className={`px-4 py-2 text-base rounded-full bg-white border font-medium transition-all duration-150
            ${mode === "single" ? "ring-2 ring-primary border-primary" : "border-gray-300"}
          `}
          style={{
            color: COLORS.primary,
            borderColor: COLORS.primary,
            boxShadow: mode === "single" ? `0 1px 8px 0 #1a73e829` : undefined,
          }}
          onClick={() => handleModeChange("single")}
          aria-pressed={mode === "single"}
        >
          Single Player
        </button>
        <button
          className={`px-4 py-2 text-base rounded-full bg-white border font-medium transition-all duration-150
            ${mode === "multi" ? "ring-2 ring-secondary border-secondary" : "border-gray-300"}
          `}
          style={{
            color: COLORS.secondary,
            borderColor: COLORS.secondary,
            boxShadow: mode === "multi" ? `0 1px 8px 0 #fbbc0529` : undefined,
          }}
          onClick={() => handleModeChange("multi")}
          aria-pressed={mode === "multi"}
        >
          Two Player
        </button>
      </div>

      {/* Board */}
      <div
        className="w-full max-w-xs sm:max-w-sm aspect-square relative flex items-center justify-center"
        style={{
          background: COLORS.boardBg,
          boxShadow: "0 2px 32px 0 rgba(60,72,84,0.06)",
          borderRadius: "1.1rem"
        }}
      >
        <div
          role="grid"
          className="grid grid-cols-3 grid-rows-3 w-full h-full"
          style={{
            gap: "0.4rem",
            padding: "1.2rem"
          }}
        >
          {board.map((cell, idx) => (
            <button
              key={idx}
              aria-label={`Cell ${idx + 1}`}
              aria-disabled={!!cell || !!winner || (mode === "single" && aiThinking && current === Player.O)}
              disabled={!!cell || !!winner || (mode === "single" && aiThinking && current === Player.O)}
              onClick={() => handleCellClick(idx)}
              className={`
                w-full h-full bg-white border rounded-lg flex items-center justify-center
                text-5xl md:text-6xl font-extralight
                transition-transform duration-150 outline-none shadow-sm border
                ${cellAnimClass(idx)}
                ${cell === Player.X ? "text-x" : ""}
                ${cell === Player.O ? "text-o" : ""}
                hover:scale-[1.06] active:scale-[0.97]
                focus-visible:ring-4 focus-visible:ring-accent
                `}
              style={{
                borderColor: COLORS.border,
                cursor:
                  !!cell || !!winner || (mode === "single" && aiThinking && current === Player.O)
                    ? "not-allowed"
                    : "pointer",
                boxShadow: !!cell ? "0 0.5px 9px #9991" : undefined,
                background: !!cell ? "#f5fafd" : "#fff",
                transition: "box-shadow 0.23s, transform 0.15s",
                animationDelay: !!cell ? `${idx * 0.04 + 0.08}s` : undefined
              }}
            >
              <span
                style={{
                  color:
                    cell === Player.X
                      ? COLORS.x
                      : cell === Player.O
                      ? COLORS.o
                      : "#000",
                  filter: !!cell ? "drop-shadow(0 0 3px #8abcf6A6)" : undefined
                }}
              >
                {cell}
              </span>
            </button>
          ))}
        </div>
        {/* Animate winning line */}
        {winner && winner !== "draw" && (
          <WinningLine board={board} />
        )}
      </div>

      {/* Game State Display */}
      <div className="mt-5 mb-2" aria-live="polite">{renderStatus()}</div>

      <button
        className="px-5 py-2 mb-2 mt-1 rounded-full font-medium text-base bg-accent text-white shadow-md transition-colors fade-in focus-visible:ring-4 focus-visible:ring-accent/40 hover:bg-accent/90 hover:scale-105 active:scale-97"
        style={{
          background: COLORS.accent,
          color: "#fff",
          letterSpacing: "0.02em",
          minWidth: 120
        }}
        onClick={handleReset}
        tabIndex={0}
      >
        {winner ? "Play Again" : "Reset"}
      </button>

      {/* Attribution Footer */}
      <footer className="w-full mt-10 mb-2 flex flex-col items-center text-sm opacity-80">
        <span>
          Minimal Tic Tac Toe &middot;{" "}
          <span style={{ color: COLORS.primary, fontWeight: 500 }}>Next.js</span>
        </span>
      </footer>

      {/* --- Animation Keyframes (scoped) --- */}
      <style>
      {`
        @keyframes pop {
          0% { transform: scale(0.6); opacity: 0;}
          70%{ transform: scale(1.13);}
          100% {transform: scale(1); opacity: 1;}
        }
        .animate-pop {
          animation: pop 0.24s cubic-bezier(.6,1.4,.6,1.01);
        }
        .fade-in {
          animation: fadeIn 0.66s;
        }
        @keyframes fadeIn {
          from { opacity: 0;}
          to {opacity: 1;}
        }
        .text-x { color: ${COLORS.x}; }
        .text-o { color: ${COLORS.o}; }
        .bg-accent { background: ${COLORS.accent}; }
        .border-primary { border-color: ${COLORS.primary} !important;}
        .border-secondary { border-color: ${COLORS.secondary} !important;}
        .ring-primary { outline: 2px solid ${COLORS.primary}; }
        .ring-secondary { outline: 2px solid ${COLORS.secondary}; }
        .ring-accent { outline: 2px solid ${COLORS.accent}; }
      `}
      </style>
    </main>
  );
}

// Winning line animation overlay
function WinningLine({ board }: { board: CellValue[] }) {
  // Find the winning combo if any
  for (const combo of winCombos) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return (
        <LineOverlay combo={combo} player={board[a] as Player} />
      );
    }
  }
  return null;
}

function LineOverlay({ combo, player }: { combo: number[], player: Player }) {
  // Map combo to overlay position/rotation (board is 3x3)
  // rows: [0,1,2] (Y=11%), [3,4,5] (Y=47%), [6,7,8] (Y=83%)
  // cols: [0,3,6] (X=11%), [1,4,7] (X=47%), [2,5,8] (X=83%)
  // diags: [0,4,8] (\), [2,4,6] (/)
  let style: React.CSSProperties = {
    position: "absolute",
    background: player === Player.X ? COLORS.x : COLORS.o,
    borderRadius: 8,
    opacity: 0.13,
    zIndex: 20,
    transition: "all 0.33s cubic-bezier(.56,1,.32,.91)",
    boxShadow: "0 0 16px 0 #0002"
  };
  if (combo.join() === "0,1,2") style = {...style, left: 16, right: 16, top: "13.5%", height: 8};
  else if (combo.join() === "3,4,5") style = {...style, left: 16, right: 16, top: "47%", height: 8};
  else if (combo.join() === "6,7,8") style = {...style, left: 16, right: 16, top: "80.5%", height: 8};
  else if (combo.join() === "0,3,6") style = {...style, top: 16, bottom: 16, left: "13.5%", width: 8};
  else if (combo.join() === "1,4,7") style = {...style, top: 16, bottom: 16, left: "47.3%", width: 8};
  else if (combo.join() === "2,5,8") style = {...style, top: 16, bottom: 16, left: "80.5%", width: 8};
  else if (combo.join() === "0,4,8") style = {...style, left: "11%", right: "11%", top: "50%", height: 8, transform: "translateY(-50%) rotate(44.7deg)"};
  else if (combo.join() === "2,4,6") style = {...style, left: "11%", right: "11%", top: "50%", height: 8, transform: "translateY(-50%) rotate(-44.7deg)"};
  return (
    <div aria-hidden="true" className="animate-pop" style={style}></div>
  );
}
