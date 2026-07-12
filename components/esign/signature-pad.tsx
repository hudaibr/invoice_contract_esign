"use client";

import { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";

interface Props {
  onSave: (dataUrl: string) => void;
}

type SignatureMode = "draw" | "type";

function typedSignatureDataUrl(text: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 100;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 400, 100);
  ctx.fillStyle = "#1F2937";
  ctx.font = "bold 40px 'Brush Script MT', 'Great Vibes', 'Dancing Script', cursive";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text || " ", 200, 55);
  return canvas.toDataURL("image/png");
}

export function SignaturePad({ onSave }: Props) {
  const ref = useRef<SignatureCanvas>(null);
  const [mode, setMode] = useState<SignatureMode>("draw");
  const [typedText, setTypedText] = useState("");
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (mode === "type") {
      const dataUrl = typedText.trim() ? typedSignatureDataUrl(typedText) : "";
      setIsEmpty(!typedText.trim());
      onSave(dataUrl);
    }
  }, [typedText, mode]);

  function clear() {
    ref.current?.clear();
    setTypedText("");
    setIsEmpty(true);
    onSave("");
  }

  function handleEnd() {
    const dataUrl = ref.current?.toDataURL("image/png") ?? "";
    setIsEmpty(false);
    onSave(dataUrl);
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => setMode("draw")}
          className={`text-xs px-3 py-1 rounded-full border transition ${mode === "draw" ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-600 border-neutral-300"}`}
        >
          Draw
        </button>
        <button
          type="button"
          onClick={() => setMode("type")}
          className={`text-xs px-3 py-1 rounded-full border transition ${mode === "type" ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-600 border-neutral-300"}`}
        >
          Type
        </button>
      </div>

      {mode === "draw" ? (
        <div className="rounded-lg border border-neutral-300 bg-white">
          <SignatureCanvas
            ref={ref}
            onEnd={handleEnd}
            penColor="#1F2937"
            canvasProps={{
              className: "w-full h-32 rounded-lg",
            }}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-300 bg-white">
          <input
            type="text"
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            placeholder="Type your signature"
            className="w-full h-32 rounded-lg px-4 text-center text-3xl font-bold font-['Brush_Script_MT','Great_Vibes','Dancing_Script',cursive] text-neutral-800 outline-none placeholder:text-neutral-300"
          />
        </div>
      )}

      <div className="flex items-center justify-between text-xs">
        {mode === "draw" ? (
          <span className="text-neutral-400">Draw your signature above</span>
        ) : (
          <span className="text-neutral-400">Type your full name above</span>
        )}
        {!isEmpty && (
          <button onClick={clear} className="text-red-500 hover:underline">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
