import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import "./BinarySketch.css";

type Tool = "pen" | "eraser";
type ShareStatus = "idle" | "sharing" | "shared" | "fallback" | "error";

type Point = {
  x: number;
  y: number;
};

const canvasCssSize = 720;
const penWidth = 16;
const eraserWidth = 34;
const imageFileName = "binary-sketch.png";

function getCanvasPoint(canvas: HTMLCanvasElement, event: ReactPointerEvent<HTMLCanvasElement>): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function fillCanvasWhite(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.save();
  context.globalCompositeOperation = "source-over";
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.restore();
}

function createCanvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to export canvas."));
        return;
      }

      resolve(blob);
    }, "image/png");
  });
}

function downloadBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = imageFileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function BinarySketch() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPointRef = useRef<Point | null>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [isDrawing, setIsDrawing] = useState(false);
  const [shareStatus, setShareStatus] = useState<ShareStatus>("idle");

  const resetCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    fillCanvasWhite(canvas);
    setShareStatus("idle");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(canvasCssSize * pixelRatio);
    canvas.height = Math.floor(canvasCssSize * pixelRatio);
    fillCanvasWhite(canvas);
  }, []);

  function drawLine(point: Point) {
    const canvas = canvasRef.current;
    const previousPoint = lastPointRef.current;
    if (!canvas || !previousPoint) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = tool === "pen" ? "#000000" : "#ffffff";
    context.lineWidth = (tool === "pen" ? penWidth : eraserWidth) * pixelRatio;
    context.beginPath();
    context.moveTo(previousPoint.x, previousPoint.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    context.restore();

    lastPointRef.current = point;
    setShareStatus("idle");
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const point = getCanvasPoint(canvas, event);
    canvas.setPointerCapture(event.pointerId);
    lastPointRef.current = point;
    setIsDrawing(true);
    drawLine(point);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!isDrawing) {
      return;
    }

    drawLine(getCanvasPoint(event.currentTarget, event));
  }

  function finishDrawing(event: ReactPointerEvent<HTMLCanvasElement>) {
    event.currentTarget.releasePointerCapture(event.pointerId);
    lastPointRef.current = null;
    setIsDrawing(false);
  }

  async function shareCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    setShareStatus("sharing");

    try {
      const blob = await createCanvasBlob(canvas);
      const file = new File([blob], imageFileName, { type: "image/png" });
      const shareData = {
        title: "Binary Sketch",
        text: "白黒キャンバスで描いた絵です。",
        files: [file],
      };

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share(shareData);
        setShareStatus("shared");
        return;
      }

      downloadBlob(blob);
      setShareStatus("fallback");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setShareStatus("idle");
        return;
      }

      setShareStatus("error");
    }
  }

  return (
    <section className="binary-sketch" aria-label="Binary Sketch drawing app">
      <div className="binary-sketch__toolbar" aria-label="drawing tools">
        <div className="binary-sketch__tool-group" role="group" aria-label="tool selection">
          <button
            type="button"
            className={tool === "pen" ? "is-active" : ""}
            onClick={() => setTool("pen")}
          >
            黒ペン
          </button>
          <button
            type="button"
            className={tool === "eraser" ? "is-active" : ""}
            onClick={() => setTool("eraser")}
          >
            白消しゴム
          </button>
        </div>
        <div className="binary-sketch__tool-group">
          <button type="button" onClick={resetCanvas}>
            クリア
          </button>
          <button type="button" className="binary-sketch__share" onClick={shareCanvas} disabled={shareStatus === "sharing"}>
            {shareStatus === "sharing" ? "共有中…" : "LINEで共有"}
          </button>
        </div>
      </div>

      <div className="binary-sketch__canvas-shell">
        <canvas
          ref={canvasRef}
          className="binary-sketch__canvas"
          aria-label="drawing canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrawing}
          onPointerCancel={finishDrawing}
        />
      </div>

      <p className="binary-sketch__status" aria-live="polite">
        {shareStatus === "shared" && "共有シートを開きました。共有先でLINEを選んでください。"}
        {shareStatus === "fallback" && "このブラウザでは画像共有が使えないため、PNGをダウンロードしました。"}
        {shareStatus === "error" && "共有に失敗しました。別のブラウザかスマホの共有メニューで試してください。"}
        {shareStatus === "idle" && "黒と白だけで描けます。スマホでは指、PCではマウスやペンで描けます。"}
        {shareStatus === "sharing" && "PNGを書き出しています。"}
      </p>
    </section>
  );
}
