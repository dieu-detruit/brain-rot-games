import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import "./GateRush.css";
import "./GateRushCompat.css";

type GateSide = "left" | "right";
type GameStatus = "ready" | "running" | "won" | "lost";

type Gate = {
  label: string;
  tone: "boost" | "danger";
  apply: (value: number) => number;
};

type Stage = {
  gates: Record<GateSide, Gate>;
};

type CrowdDot = {
  id: number;
  style: CSSProperties;
};

const goalCrowd = 120;
const tickMs = 32;
const stageDurationMs = 2500;
const progressStep = tickMs / stageDurationMs;
const keyboardMoveStep = 0.045;
const runnerRangeRem = 7.2;

const stages: Stage[] = [
  {
    gates: {
      left: { label: "+12", tone: "boost", apply: (value) => value + 12 },
      right: { label: "x2", tone: "boost", apply: (value) => value * 2 },
    },
  },
  {
    gates: {
      left: { label: "-15", tone: "danger", apply: (value) => Math.max(0, value - 15) },
      right: { label: "+20", tone: "boost", apply: (value) => value + 20 },
    },
  },
  {
    gates: {
      left: { label: "x3", tone: "boost", apply: (value) => value * 3 },
      right: { label: "/2", tone: "danger", apply: (value) => Math.ceil(value / 2) },
    },
  },
  {
    gates: {
      left: { label: "+35", tone: "boost", apply: (value) => value + 35 },
      right: { label: "-30", tone: "danger", apply: (value) => Math.max(0, value - 30) },
    },
  },
  {
    gates: {
      left: { label: "-50", tone: "danger", apply: (value) => Math.max(0, value - 50) },
      right: { label: "x2", tone: "boost", apply: (value) => value * 2 },
    },
  },
  {
    gates: {
      left: { label: "+40", tone: "boost", apply: (value) => value + 40 },
      right: { label: "-70", tone: "danger", apply: (value) => Math.max(0, value - 70) },
    },
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getGateSide(playerX: number): GateSide {
  return playerX < 0 ? "left" : "right";
}

function getSideLabel(side: GateSide): string {
  return side === "left" ? "Left" : "Right";
}

function getCrowdDots(crowd: number): CrowdDot[] {
  const count = Math.max(5, Math.min(30, Math.round(crowd / 5)));

  return Array.from({ length: count }, (_, index) => {
    const angle = index * 2.399963;
    const radius = 9 + (index % 5) * 5 + Math.floor(index / 10) * 3;
    const left = 50 + Math.cos(angle) * radius * 0.72;
    const top = 50 + Math.sin(angle) * radius * 0.46;
    const width = 1.02 + (index % 3) * 0.08;
    const height = width * 1.28;

    return {
      id: index,
      style: {
        left: `${left}%`,
        top: `${top}%`,
        width: `${width}rem`,
        height: `${height}rem`,
        zIndex: index,
      },
    };
  });
}

function getPointerX(event: ReactPointerEvent<HTMLDivElement>): number {
  const rect = event.currentTarget.getBoundingClientRect();
  const normalized = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  return clamp(normalized, -1, 1);
}

export function GateRush() {
  const [status, setStatus] = useState<GameStatus>("ready");
  const [playerX, setPlayerX] = useState(0);
  const [keyboardDirection, setKeyboardDirection] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [crowd, setCrowd] = useState(14);
  const [history, setHistory] = useState<string[]>([]);

  const activeStage = stages[Math.min(stageIndex, stages.length - 1)];
  const selectedSide = getGateSide(playerX);
  const selectedGate = activeStage.gates[selectedSide];
  const crowdDots = useMemo(() => getCrowdDots(crowd), [crowd]);
  const totalProgress = Math.round(((stageIndex + progress) / stages.length) * 100);
  const laneProgress = Math.min(1, progress);
  const gateScale = 0.44 + laneProgress * 0.96;
  const gateTop = 12 + laneProgress * 64;
  const runnerScale = 0.92 + Math.min(crowd, 180) / 900;
  const isFinished = status === "won" || status === "lost";

  const sceneStyle = {
    "--runner-x": `${playerX * runnerRangeRem}rem`,
    "--gate-top": `${gateTop}%`,
    "--gate-scale": gateScale.toFixed(3),
    "--road-shift": `${Math.round(laneProgress * 180)}px`,
    "--runner-scale": runnerScale.toFixed(3),
    "--player-x": playerX.toFixed(3),
  } as CSSProperties;

  useEffect(() => {
    if (status !== "running") {
      return;
    }

    const intervalId = window.setInterval(() => {
      setProgress((currentProgress) => Math.min(1, currentProgress + progressStep));
      setPlayerX((currentX) => clamp(currentX + keyboardDirection * keyboardMoveStep, -1, 1));
    }, tickMs);

    return () => window.clearInterval(intervalId);
  }, [keyboardDirection, status]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        setKeyboardDirection(-1);
      }

      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        setKeyboardDirection(1);
      }

      if (event.key === " ") {
        event.preventDefault();

        if (status === "ready") {
          startGame();
        } else if (isFinished) {
          resetGame();
        }
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key.toLowerCase() === "a" ||
        event.key.toLowerCase() === "d"
      ) {
        setKeyboardDirection(0);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isFinished, status]);

  useEffect(() => {
    if (status !== "running" || progress < 1) {
      return;
    }

    resolveStage();
  }, [progress, status]);

  function startGame() {
    setStatus("running");
  }

  function resetGame() {
    setStatus("ready");
    setPlayerX(0);
    setKeyboardDirection(0);
    setStageIndex(0);
    setProgress(0);
    setCrowd(14);
    setHistory([]);
  }

  function moveByPointer(event: ReactPointerEvent<HTMLDivElement>) {
    if (status !== "running") {
      return;
    }

    setPlayerX(getPointerX(event));
  }

  function resolveStage() {
    const side = getGateSide(playerX);
    const gate = activeStage.gates[side];
    const nextCrowd = gate.apply(crowd);
    const nextStageIndex = stageIndex + 1;
    const passedText = `${getSideLabel(side)} ${gate.label}: ${crowd} -> ${nextCrowd}`;

    setCrowd(nextCrowd);
    setHistory((items) => [passedText, ...items].slice(0, 6));
    setProgress(0);

    if (nextCrowd <= 0) {
      setStatus("lost");
      return;
    }

    if (nextStageIndex >= stages.length) {
      setStageIndex(nextStageIndex);
      setStatus(nextCrowd >= goalCrowd ? "won" : "lost");
      return;
    }

    setStageIndex(nextStageIndex);
  }

  return (
    <section className="gate-rush-game" aria-label="Gate Rush game">
      <div className="gate-rush-hud">
        <div>
          <span className="status-label">Distance</span>
          <strong>{Math.min(100, totalProgress)}%</strong>
        </div>
        <div>
          <span className="status-label">Crowd</span>
          <strong>{crowd}</strong>
        </div>
        <div>
          <span className="status-label">Goal</span>
          <strong>{goalCrowd}+</strong>
        </div>
      </div>

      <div
        className="gate-rush-scene"
        style={sceneStyle}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          moveByPointer(event);
        }}
        onPointerMove={moveByPointer}
      >
        <div className="skyline" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="track-3d" aria-hidden="true">
          <div className="road-surface" />
          <div className="center-line" />
          <div className="side-rail side-rail--left" />
          <div className="side-rail side-rail--right" />
        </div>

        {status === "running" && (
          <div className="gate-pair" aria-label="approaching gates">
            {(["left", "right"] as GateSide[]).map((gateSide) => {
              const gate = activeStage.gates[gateSide];
              return (
                <div
                  key={gateSide}
                  className={`gate-3d gate-3d--${gateSide} gate-3d--${gate.tone} ${selectedSide === gateSide ? "is-selected" : ""}`}
                  aria-label={`${gateSide} gate ${gate.label}`}
                >
                  <span>{gate.label}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="runner-pack" aria-label={`Crowd size ${crowd}`}>
          {crowdDots.map((dot) => (
            <span key={dot.id} style={dot.style} />
          ))}
          <strong>{crowd}</strong>
        </div>

        {status === "ready" && (
          <div className="gate-rush-overlay" onPointerDown={startGame}>
            <h2>Drag to steer</h2>
            <p>Drag or swipe horizontally. Keyboard: hold left/right or A/D. Reach {goalCrowd}+ people.</p>
            <div className="overlay-cta">Tap to start</div>
          </div>
        )}

        {isFinished && (
          <div className="gate-rush-overlay" onPointerDown={resetGame}>
            <h2>{status === "won" ? "Clear" : "Failed"}</h2>
            <p>
              {status === "won"
                ? `Finished with ${crowd} people.`
                : `Finished with ${crowd} people. Target was ${goalCrowd}.`}
            </p>
            <div className="overlay-cta">Tap to retry</div>
          </div>
        )}
      </div>

      <div className="gate-rush-readout">
        <span>Horizontal position</span>
        <strong>{playerX.toFixed(2)}</strong>
        <span>Current gate</span>
        <strong>{selectedGate.label}</strong>
      </div>

      {history.length > 0 && (
        <ol className="gate-rush-history" aria-label="recent gates">
          {history.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      )}
    </section>
  );
}
