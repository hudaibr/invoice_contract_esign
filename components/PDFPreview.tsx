"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { pdf } from "@react-pdf/renderer";
import { Document, Page, pdfjs } from "react-pdf";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs";
}

export default function PDFPreview({ doc }: { doc: React.ReactElement }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateBlob = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const instance = pdf(doc as React.ReactElement<import("@react-pdf/renderer").DocumentProps>);
      const blob = await instance.toBlob();
      setBlobUrl(URL.createObjectURL(blob));
    } catch {
      setError("PDF generation failed");
    } finally {
      setLoading(false);
    }
  }, [doc]);

  useEffect(() => {
    generateBlob();
  }, [generateBlob]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const paperPadding = 40;
  const maxPaperWidth = Math.min(width, 700);
  const pageWidth = maxPaperWidth - paperPadding * 2;

  return (
    <div ref={containerRef} className="w-full flex items-center justify-center" style={{ minHeight: 500 }}>
      {loading && <span className="text-sm text-neutral-400">Loading preview…</span>}
      {error && <span className="text-sm text-red-500">{error}</span>}
      {blobUrl && !loading && (
        <div
          className="bg-white shadow-xl overflow-hidden"
          style={{
            width: maxPaperWidth,
            padding: paperPadding,
            minHeight: pageWidth * 1.414 + paperPadding * 2,
          }}
        >
          <Document
            file={blobUrl}
            loading={<span className="text-sm text-neutral-400">Loading preview…</span>}
            error={<span className="text-sm text-red-500">Failed to load preview</span>}
          >
            <Page
              pageIndex={0}
              width={pageWidth}
              canvasBackground="#ffffff"
              renderTextLayer={false}
              renderAnnotationLayer={false}
              devicePixelRatio={typeof window !== "undefined" ? Math.max(window.devicePixelRatio, 2) : 2}
            />
          </Document>
        </div>
      )}
    </div>
  );
}