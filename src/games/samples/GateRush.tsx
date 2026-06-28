import { useEffect, useMemo, useState, type CSSProperties } from "react";
import "./GateRush.css";

type Lane = "left" | "right";
type GameStatus = "ready" | "running" | "won" | "lost";

type Gate = {
  label: string;
  tone: "boost" | "danger";
  apply: (value: number) => number;
};

type Stage = {
  gates: Record<Lane, Gate>;
};

type CrowdDot = {
  id: number;
  style: CSSProperties;
};

const goalCrowd = 120;
const tickMs = 32;
const stageDurationMs = 2500;
const progressStep = tickMs / stageDurationMs;

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

function getLaneOffset(lane: Lane): string {
  return lane === "left" ? "-5.2rem" : "5.2rem";
}

function getLaneLabel(lane: Lane): string {
  return lane === "left" ? "Left" : "Right";
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

export function GateRush() {
  const [status, setStatus] = useState<GameStatus>("ready");
  const [lane, setLane] = useState<Lane>("left");
  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [crowd, setCrowd] = useState(14);
  const [history, setHistory] = useState<string[]>([]);

  const activeStage = stages[Math.min(stageIndex, stages.length - 1)];
  const selectedGate = activeStage.gates[lane];
  const crowdDots = useMemo(() => getCrowdDots(crowd), [crowd]);
  const totalProgress = Math.round(((stageIndex + progress) / stages.length) * 100);
  const laneProgress = Math.min(1, progress);
  const gateScale = 0.44 + laneProgress * 0.96;
  const gateTop = 12 + laneProgress * 64;
  const runnerScale = 0.92 + Math.min(crowd, 180) / 900;
  const isFinished = status === "won" || status === "lost";

  const sceneStyle = {
    "--runner-x": getLaneOffset(lane),
    "--gate-top": `${gateTop}%`,
    "--gate-scale": gateScale.toFixed(3),
    "--road-shift": `${Math.round(laneProgress * 180)}px`,
    "--runner-scale": runnerScale.toFixed(3),
  } as CSSProperties;

  useEffect(() => {
    if (status !== "running") {
      return;
    }

    const intervalId = window.setInterval(() => {
      setProgress((currentProgress) => Math.min(1, currentProgress + progressStep));
    }, tickMs);

    return () => window.clearInterval(intervalId);
  }, [status]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        setLane("left");
      }

      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        setLane("right");
      }

      if (event.key === " " && status === "ready") {
        event.preventDefault();
        startGame();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status]);

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
    setLane("left");
    setStageIndex(0);
    setProgress(0);
    setCrowd(14);
    setHistory([]);
  }

  function resolveStage() {
    const gate = activeStage.gates[lane];
    const nextCrowd = gate.apply(crowd);
    const nextStageIndex = stageIndex + 1;
    const passedText = `${getLaneLabel(lane)} ${gate.label}: ${crowd} -> ${nextCrowd}`;

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

      <div className="gate-rush-scene" style={sceneStyle}>
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
            {(["left", "right"] as Lane[]).map((gateLane) => {
              const gate = activeStage.gates[gateLane];
              return (
                <button
                  key={gateLane}
                  type="button"
                  className={`gate-3d gate-3d--${gateLane} gate-3d--${gate.tone} ${lane === gateLane ? "is-selected" : ""}`}
                  onClick={() => setLane(gateLane)}
                  aria-label={`Move to ${gateLane} gate ${gate.label}`}
                >
                  <span>{gate.label}</span>
                </button>
              );
            })}
          </div>
        )}

        <button
          type="button"
          className="lane-touch lane-touch--left"
          onClick={() => setLane("left")}
          aria-label="Move left"
        />
        <button
          type="button"
          className="lane-touch lane-touch--right"
          onClick={() => setLane("right")}
          aria-label="Move right"
        />

        <div className="runner-pack" aria-label={`Crowd size ${crowd}`}>
          {crowdDots.map((dot) => (
            <span key={dot.id} style={dot.style} />
          ))}
          <strong>{crowd}</strong>
        </div>

        {status === "ready" && (
          <div className="gate-rush-overlay">
            <h2>Run through the best gates</h2>
            <p>Use left/right, A/D, or tap a lane. Reach {goalCrowd}+ people by the finish.</p>
            <button type="button" onClick={startGame}>
              Start Run
            </button>
          </div>
        )}

        {isFinished && (
          <div className="gate-rush-overlay">
            <h2>{status === "won" ? "Clear" : "Failed"}</h2>
            <p>
              {status === "won"
                ? `Finished with ${crowd} people.`
                : `Finished with ${crowd} people. Target was ${goalCrowd}.`}
            </p>
            <button type="button" onClick={resetGame}>
              Retry
            </button>
          </div>
        )}
      </div>

      <div className="gate-rush-controls">
        <button
          type="button"
          className={lane === "left" ? "is-active" : ""}
          onClick={() => setLane("left")}
        >
          Left
        </button>
        <div>
          <span>Next gate</span>
          <strong>{selectedGate.label}</strong>
        </div>
        <button
          type="button"
          className={lane === "right" ? "is-active" : ""}
          onClick={() => setLane("right")}
        >
          Right
        </button>
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
