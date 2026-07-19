import { useMemo, useState } from "react";

type SetEntry = {
  weightKg: string;
  reps: string;
  note: string;
  synced: boolean;
};

type Exercise = {
  id: string;
  name: string;
  target: string;
  guide: string;
  sets: SetEntry[];
};

type WorkoutState = {
  date: string;
  sessionName: string;
  endpointUrl: string;
  exercises: Exercise[];
};

const STORAGE_KEY = "arm-workout-tracker-v1";

const initialExercises: Exercise[] = [
  {
    id: "ez-bar-curl",
    name: "EZバーカール",
    target: "8〜12回 × 3セット",
    guide: "立ったまま。肩幅の外側グリップ。反動なしで下ろしをゆっくり。",
    sets: Array.from({ length: 3 }, () => ({ weightKg: "20", reps: "", note: "", synced: false })),
  },
  {
    id: "overhead-extension",
    name: "ケーブル・オーバーヘッドエクステンション",
    target: "10〜12回 × 3セット",
    guide: "片側のケーブルにロープを付け、背を向けて斜め前上へ伸ばす。",
    sets: Array.from({ length: 3 }, () => ({ weightKg: "10", reps: "", note: "", synced: false })),
  },
  {
    id: "hammer-curl",
    name: "ハンマーカール",
    target: "10〜15回 × 3セット",
    guide: "親指を上にして、肘を体の横に固定。今日は片手重量を記録。",
    sets: Array.from({ length: 3 }, () => ({ weightKg: "7", reps: "", note: "", synced: false })),
  },
  {
    id: "rope-pushdown",
    name: "ローププレスダウン",
    target: "10〜15回 × 3セット",
    guide: "肘を脇腹に固定し、肘から先だけを伸ばす。背中で押さない。",
    sets: Array.from({ length: 3 }, () => ({ weightKg: "12.5", reps: "", note: "", synced: false })),
  },
];

function todayString(): string {
  return new Date().toLocaleDateString("sv-SE");
}

function loadState(): WorkoutState {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved) as WorkoutState;
    } catch {
      // Fall back to defaults.
    }
  }
  return {
    date: todayString(),
    sessionName: "Day A",
    endpointUrl: "",
    exercises: initialExercises,
  };
}

export function ArmWorkoutTracker() {
  const [state, setState] = useState<WorkoutState>(loadState);
  const [status, setStatus] = useState("入力内容はこの端末に自動保存されます。");

  const completedSets = useMemo(
    () => state.exercises.flatMap((exercise) => exercise.sets).filter((set) => set.reps.trim() !== "").length,
    [state.exercises],
  );

  function persist(next: WorkoutState) {
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function updateSet(exerciseIndex: number, setIndex: number, field: keyof Omit<SetEntry, "synced">, value: string) {
    const next = structuredClone(state);
    next.exercises[exerciseIndex].sets[setIndex][field] = value;
    next.exercises[exerciseIndex].sets[setIndex].synced = false;
    persist(next);
  }

  async function syncSet(exerciseIndex: number, setIndex: number) {
    const exercise = state.exercises[exerciseIndex];
    const set = exercise.sets[setIndex];
    if (!set.weightKg || !set.reps) {
      setStatus("重量と回数を入力してください。");
      return;
    }
    if (!state.endpointUrl) {
      setStatus("設定欄にGoogle Apps ScriptのWebアプリURLを入力してください。");
      return;
    }

    const payload = {
      date: state.date,
      session: state.sessionName,
      exerciseId: exercise.id,
      exercise: exercise.name,
      setNumber: setIndex + 1,
      weightKg: Number(set.weightKg),
      reps: Number(set.reps),
      note: set.note,
      recordedAt: new Date().toISOString(),
    };

    try {
      await fetch(state.endpointUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      const next = structuredClone(state);
      next.exercises[exerciseIndex].sets[setIndex].synced = true;
      persist(next);
      setStatus(`${exercise.name} Set ${setIndex + 1} を送信しました。`);
    } catch {
      setStatus("送信に失敗しました。URLと通信状態を確認してください。");
    }
  }

  function copyForChatGpt() {
    const data = {
      date: state.date,
      session: state.sessionName,
      exercises: state.exercises.map((exercise) => ({
        name: exercise.name,
        sets: exercise.sets
          .filter((set) => set.reps.trim() !== "")
          .map((set, index) => ({ set: index + 1, weightKg: Number(set.weightKg), reps: Number(set.reps), note: set.note })),
      })),
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setStatus("ChatGPT向けJSONをコピーしました。");
  }

  function downloadCsv() {
    const rows = [["date", "session", "exercise", "set", "weight_kg", "reps", "note"]];
    state.exercises.forEach((exercise) => {
      exercise.sets.forEach((set, index) => {
        if (set.reps.trim() !== "") {
          rows.push([state.date, state.sessionName, exercise.name, String(index + 1), set.weightKg, set.reps, set.note]);
        }
      });
    });
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `arm-workout-${state.date}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function resetSession() {
    persist({ ...state, date: todayString(), exercises: initialExercises });
    setStatus("新しいセッションを開始しました。");
  }

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "18px 14px 64px", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ marginBottom: 18 }}>
        <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>30分・腕を太くする Day A</p>
        <h1 style={{ margin: "4px 0 8px", fontSize: 30 }}>腕トレ記録</h1>
        <p style={{ margin: 0, color: "#475569" }}>{completedSets}/12 セット完了</p>
      </header>

      <section style={{ display: "grid", gap: 10, marginBottom: 18 }}>
        <label>
          <span style={{ display: "block", fontSize: 13, marginBottom: 4 }}>日付</span>
          <input type="date" value={state.date} onChange={(event) => persist({ ...state, date: event.target.value })} style={inputStyle} />
        </label>
        <label>
          <span style={{ display: "block", fontSize: 13, marginBottom: 4 }}>Google Apps Script WebアプリURL</span>
          <input
            value={state.endpointUrl}
            onChange={(event) => persist({ ...state, endpointUrl: event.target.value })}
            placeholder="https://script.google.com/macros/s/.../exec"
            style={inputStyle}
          />
        </label>
      </section>

      <div style={{ display: "grid", gap: 14 }}>
        {state.exercises.map((exercise, exerciseIndex) => (
          <section key={exercise.id} style={{ border: "1px solid #cbd5e1", borderRadius: 16, padding: 14, background: "#fff" }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 20 }}>{exercise.name}</h2>
            <p style={{ margin: "0 0 4px", fontWeight: 700 }}>{exercise.target}</p>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "#475569" }}>{exercise.guide}</p>
            <div style={{ display: "grid", gap: 10 }}>
              {exercise.sets.map((set, setIndex) => (
                <div key={setIndex} style={{ display: "grid", gridTemplateColumns: "48px 1fr 1fr", gap: 8, alignItems: "end" }}>
                  <strong style={{ paddingBottom: 10 }}>#{setIndex + 1}</strong>
                  <label>
                    <span style={smallLabelStyle}>kg</span>
                    <input inputMode="decimal" value={set.weightKg} onChange={(event) => updateSet(exerciseIndex, setIndex, "weightKg", event.target.value)} style={inputStyle} />
                  </label>
                  <label>
                    <span style={smallLabelStyle}>回数</span>
                    <input inputMode="numeric" value={set.reps} onChange={(event) => updateSet(exerciseIndex, setIndex, "reps", event.target.value)} style={inputStyle} />
                  </label>
                  <div />
                  <input
                    value={set.note}
                    onChange={(event) => updateSet(exerciseIndex, setIndex, "note", event.target.value)}
                    placeholder="メモ（反動、痛みなど）"
                    style={{ ...inputStyle, gridColumn: "span 1" }}
                  />
                  <button onClick={() => syncSet(exerciseIndex, setIndex)} style={buttonStyle}>
                    {set.synced ? "送信済み" : "保存"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section style={{ display: "grid", gap: 10, marginTop: 18 }}>
        <button onClick={copyForChatGpt} style={primaryButtonStyle}>ChatGPT向けJSONをコピー</button>
        <button onClick={downloadCsv} style={buttonStyle}>CSVを保存</button>
        <button onClick={resetSession} style={{ ...buttonStyle, color: "#b91c1c" }}>新しいセッション</button>
      </section>

      <p style={{ marginTop: 14, padding: 10, borderRadius: 10, background: "#f1f5f9", fontSize: 13 }}>{status}</p>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  border: "1px solid #94a3b8",
  borderRadius: 10,
  padding: "10px 11px",
  fontSize: 16,
  background: "#fff",
};

const smallLabelStyle = { display: "block", fontSize: 12, marginBottom: 3, color: "#64748b" };

const buttonStyle = {
  border: "1px solid #94a3b8",
  borderRadius: 10,
  padding: "10px 12px",
  fontWeight: 700,
  background: "#fff",
  cursor: "pointer",
};

const primaryButtonStyle = {
  ...buttonStyle,
  border: "none",
  background: "#0f172a",
  color: "#fff",
};
