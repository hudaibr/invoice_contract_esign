"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

interface Props {
  onSave: (dataUrl: string) => void;
}

export function SignaturePad({ onSave }: Props) {
  const ref = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  function clear() {
    ref.current?.clear();
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
      <div className="flex items-center justify-between text-xs">
        <span className="text-neutral-400">Draw your signature above</span>
        {!isEmpty && (
          <button onClick={clear} className="text-red-500 hover:underline">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
