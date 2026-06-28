import { useMemo, useState } from "react";

type Gate = {
  label: string;
  apply: (value: number) => number;
};

function createGatePair(round: number): [Gate, Gate] {
  const patterns: Array<[Gate, Gate]> = [
    [
      { label: "+18", apply: (value) => value + 18 },
      { label: "x2", apply: (value) => value * 2 },
    ],
    [
      { label: "-12", apply: (value) => Math.max(0, value - 12) },
      { label: "+9", apply: (value) => value + 9 },
    ],
    [
      { label: "x3", apply: (value) => value * 3 },
      { label: "/2", apply: (value) => Math.ceil(value / 2) },
    ],
    [
      { label: "+32", apply: (value) => value + 32 },
      { label: "-25", apply: (value) => Math.max(0, value - 25) },
    ],
  ];

  return patterns[round % patterns.length];
}

export function GateRush() {
  const [round, setRound] = useState(0);
  const [crowd, setCrowd] = useState(12);
  const [history, setHistory] = useState<string[]>([]);
  const gates = useMemo(() => createGatePair(round), [round]);
  const isFinished = round >= 8 || crowd <= 0;
  const isWin = isFinished && crowd >= 100;

  function chooseGate(gate: Gate) {
    if (isFinished) {
      return;
    }

    const nextCrowd = gate.apply(crowd);
    setCrowd(nextCrowd);
    setRound((currentRound) => currentRound + 1);
    setHistory((items) => [`${gate.label}: ${crowd} → ${nextCrowd}`, ...items].slice(0, 5));
  }

  function reset() {
    setRound(0);
    setCrowd(12);
    setHistory([]);
  }

  return (
    <section className="game-panel" aria-label="Gate Rush game">
      <div className="game-status">
        <div>
          <span className="status-label">Round</span>
          <strong>{Math.min(round + 1, 8)} / 8</strong>
        </div>
        <div>
          <span className="status-label">Crowd</span>
          <strong>{crowd}</strong>
        </div>
        <div>
          <span className="status-label">Goal</span>
          <strong>100+</strong>
        </div>
      </div>

      <div className="runner-lane">
        <div className="crowd" style={{ width: `${Math.min(100, crowd)}%` }}>
          <span>{crowd}</span>
        </div>
      </div>

      {isFinished ? (
        <div className="result-card">
          <h2>{isWin ? "Clear" : "Failed"}</h2>
          <p>
            {isWin
              ? "The crowd reached the target."
              : "The crowd did not reach 100 before the course ended."}
          </p>
          <button type="button" onClick={reset}>
            Retry
          </button>
        </div>
      ) : (
        <div className="gate-row">
          {gates.map((gate) => (
            <button key={gate.label} type="button" className="gate" onClick={() => chooseGate(gate)}>
              {gate.label}
            </button>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <ol className="history" aria-label="recent choices">
          {history.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      )}
    </section>
  );
}
