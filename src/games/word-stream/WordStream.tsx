import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import wordsSource from "./words.ts?raw";
import "./word-stream.css";

type WordPair = {
  en: string;
  ja: string;
};

type PlaybackState = "idle" | "playing" | "paused";

const sequence = ["en", "ja", "en", "ja"] as const;
type SequenceLanguage = (typeof sequence)[number];

const rawWordsMatch = wordsSource.match(/const rawWords = `([\s\S]*?)`\.trim\(\);/);
if (!rawWordsMatch) {
  throw new Error("Could not parse the bundled word list");
}

const wordPairs: WordPair[] = rawWordsMatch[1]
  .trim()
  .split("\n")
  .slice(0, 500)
  .map((line) => {
    const [en, ja] = line.split("\t");
    return { en, ja };
  });

function randomIndex(excluding: number | null): number {
  if (wordPairs.length <= 1) {
    return 0;
  }

  let index = Math.floor(Math.random() * wordPairs.length);
  while (index === excluding) {
    index = Math.floor(Math.random() * wordPairs.length);
  }
  return index;
}

function wait(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(resolve, milliseconds);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

function speak(
  text: string,
  language: SequenceLanguage,
  rate: number,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === "en" ? "en-US" : "ja-JP";
    utterance.rate = rate;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    signal.addEventListener(
      "abort",
      () => {
        window.speechSynthesis.cancel();
        resolve();
      },
      { once: true },
    );

    window.speechSynthesis.speak(utterance);
  });
}

export function WordStream() {
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [currentIndex, setCurrentIndex] = useState(() => randomIndex(null));
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [intervalSeconds, setIntervalSeconds] = useState(1.2);
  const [speechRate, setSpeechRate] = useState(0.9);
  const [completedWords, setCompletedWords] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);
  const stateRef = useRef<PlaybackState>("idle");
  const currentIndexRef = useRef(currentIndex);
  const intervalRef = useRef(intervalSeconds);
  const rateRef = useRef(speechRate);

  const currentWord: WordPair = wordPairs[currentIndex];
  const currentLanguage = sequence[sequenceIndex];

  useEffect(() => {
    stateRef.current = playbackState;
  }, [playbackState]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    intervalRef.current = intervalSeconds;
  }, [intervalSeconds]);

  useEffect(() => {
    rateRef.current = speechRate;
  }, [speechRate]);

  const stopCurrentRun = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    window.speechSynthesis.cancel();
  }, []);

  useEffect(() => stopCurrentRun, [stopCurrentRun]);

  const run = useCallback(async () => {
    stopCurrentRun();
    const controller = new AbortController();
    controllerRef.current = controller;
    let localSequenceIndex = 0;

    while (!controller.signal.aborted) {
      while (stateRef.current === "paused" && !controller.signal.aborted) {
        await wait(100, controller.signal);
      }
      if (stateRef.current !== "playing" || controller.signal.aborted) {
        break;
      }

      const pair = wordPairs[currentIndexRef.current];
      const language = sequence[localSequenceIndex];
      setSequenceIndex(localSequenceIndex);
      await speak(
        language === "en" ? pair.en : pair.ja,
        language,
        rateRef.current,
        controller.signal,
      );

      if (controller.signal.aborted) {
        break;
      }

      await wait(intervalRef.current * 1000, controller.signal);
      if (controller.signal.aborted) {
        break;
      }

      localSequenceIndex += 1;
      if (localSequenceIndex === sequence.length) {
        localSequenceIndex = 0;
        const nextIndex = randomIndex(currentIndexRef.current);
        currentIndexRef.current = nextIndex;
        setCurrentIndex(nextIndex);
        setCompletedWords((value) => value + 1);
      }
    }
  }, [stopCurrentRun]);

  const start = () => {
    if (!("speechSynthesis" in window)) {
      window.alert("このブラウザはWeb Speech APIの音声合成に対応していません。");
      return;
    }

    stateRef.current = "playing";
    setPlaybackState("playing");
    void run();
  };

  const togglePause = () => {
    if (playbackState === "playing") {
      stateRef.current = "paused";
      setPlaybackState("paused");
      window.speechSynthesis.pause();
      return;
    }

    stateRef.current = "playing";
    setPlaybackState("playing");
    window.speechSynthesis.resume();
  };

  const stop = () => {
    stateRef.current = "idle";
    setPlaybackState("idle");
    setSequenceIndex(0);
    stopCurrentRun();
  };

  const skip = () => {
    const nextIndex = randomIndex(currentIndexRef.current);
    currentIndexRef.current = nextIndex;
    setCurrentIndex(nextIndex);
    setSequenceIndex(0);
    if (playbackState !== "idle") {
      stateRef.current = "playing";
      setPlaybackState("playing");
      void run();
    }
  };

  const statusText = useMemo(() => {
    if (playbackState === "playing") return "再生中";
    if (playbackState === "paused") return "一時停止中";
    return "停止中";
  }, [playbackState]);

  return (
    <section className="word-stream">
      <div className="word-stream__display" aria-live="polite">
        <div className="word-stream__status-row">
          <span className={`word-stream__status word-stream__status--${playbackState}`}>
            {statusText}
          </span>
          <span>{wordPairs.length} words</span>
        </div>
        <p className="word-stream__step">
          {currentLanguage === "en" ? "English" : "日本語"} · {sequenceIndex + 1}/4
        </p>
        <h2>{currentLanguage === "en" ? currentWord.en : currentWord.ja}</h2>
        <p className="word-stream__translation">
          {currentWord.en} / {currentWord.ja}
        </p>
        <p className="word-stream__counter">完了した単語: {completedWords}</p>
      </div>

      <div className="word-stream__controls">
        <label>
          発話後の間隔
          <output>{intervalSeconds.toFixed(1)}秒</output>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={intervalSeconds}
            onChange={(event) => setIntervalSeconds(Number(event.target.value))}
          />
        </label>
        <label>
          発話速度
          <output>{speechRate.toFixed(1)}×</output>
          <input
            type="range"
            min="0.5"
            max="1.8"
            step="0.1"
            value={speechRate}
            onChange={(event) => setSpeechRate(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="word-stream__buttons">
        {playbackState === "idle" ? (
          <button className="word-stream__primary" type="button" onClick={start}>
            Start
          </button>
        ) : (
          <button className="word-stream__primary" type="button" onClick={togglePause}>
            {playbackState === "playing" ? "Pause" : "Resume"}
          </button>
        )}
        <button type="button" onClick={skip}>Next word</button>
        <button type="button" onClick={stop} disabled={playbackState === "idle"}>
          Stop
        </button>
      </div>

      <p className="word-stream__note">
        Startはユーザー操作から呼び出されます。iPhoneでは消音モードや画面ロック中の挙動がブラウザにより異なります。
      </p>
    </section>
  );
}
