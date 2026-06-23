/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Image as ImageIcon, Maximize, Crop, Scissors, Paintbrush, Download, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE FORMAT CONVERTER
// ─────────────────────────────────────────────────────────────────────────────
export function ImageConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<"image/jpeg" | "image/png" | "image/webp">("image/webp");
  const [quality, setQuality] = useState<number>(90);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [outBlobUrl, setOutBlobUrl] = useState<string | null>(null);
  const [outSize, setOutSize] = useState<number>(0);
  const [converting, setConverting] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
      setOutBlobUrl(null);
    }
  };

  const executeConvert = () => {
    if (!file || !previewUrl) return;
    setConverting(true);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              setOutBlobUrl(URL.createObjectURL(blob));
              setOutSize(blob.size);
            }
            setConverting(false);
          },
          format,
          format === "image/png" ? undefined : quality / 100
        );
      } else {
        setConverting(false);
      }
    };
    img.src = previewUrl;
  };

  const getFormatExtension = (mime: string) => {
    if (mime === "image/jpeg") return "jpg";
    if (mime === "image/webp") return "webp";
    return "png";
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md">
          <div className="border-b border-neutral-800 pb-3 mb-5">
            <span className="text-xs font-mono text-lime-400 font-bold uppercase tracking-widest">// Conversion parameters</span>
          </div>

          <div className="border-2 border-dashed border-neutral-800 hover:border-lime-400 bg-neutral-950/55 p-8 rounded-md text-center cursor-pointer transition relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <ImageIcon className="mx-auto text-lime-400 mb-2 h-10 w-10" />
            <span className="block font-bold text-sm text-neutral-200">
              {file ? file.name : "Select source image"}
            </span>
            <span className="block text-xs text-neutral-500 mt-1 uppercase font-mono">
              {file ? `${(file.size / 1024).toFixed(1)} KB loaded` : "Supports JPEG, PNG, WEBP, GIF"}
            </span>
          </div>

          {file && (
            <div className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Target Format Extension</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["image/png", "image/jpeg", "image/webp"] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setFormat(opt)}
                      className={`py-2 text-xs font-semibold rounded font-mono uppercase tracking-wider text-center cursor-pointer border transition ${
                        format === opt
                          ? "bg-lime-400 border-lime-400 text-black"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      {getFormatExtension(opt)}
                    </button>
                  ))}
                </div>
              </div>

              {format !== "image/png" && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Transcode Quality</label>
                    <span className="text-xs font-mono text-lime-400">{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                    className="w-full accent-lime-400 bg-neutral-850 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}

              <button
                onClick={executeConvert}
                disabled={converting}
                className="w-full font-mono font-bold text-xs uppercase tracking-wider py-3 px-4 rounded bg-lime-400 hover:bg-lime-500 text-black transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {converting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-black" />
                    Transcoding colors...
                  </>
                ) : (
                  "Execute format transformation"
                )}
              </button>
            </div>
          )}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md flex flex-col justify-between">
          <div>
            <div className="border-b border-neutral-800 pb-3 mb-5">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">// Formatted canvas preview</span>
            </div>

            {outBlobUrl ? (
              <div className="space-y-4">
                <div className="p-2 bg-neutral-950 border border-neutral-850 rounded flex items-center justify-center min-h-[180px]">
                  <img
                    ref={imageRef}
                    src={outBlobUrl}
                    alt="Converted output preview"
                    className="max-h-64 object-contain rounded"
                  />
                </div>

                <div className="bg-neutral-950 p-4 border border-neutral-800 rounded text-center">
                  <CheckCircle className="mx-auto text-lime-400 mb-1.5 h-6 w-6" />
                  <span className="block font-bold text-xs text-lime-400 uppercase tracking-wider">Converted Successfully</span>
                  <span className="block text-[11px] font-mono text-neutral-500 mt-1 uppercase">
                    Container: {format.split("/")[1].toUpperCase()} · File Size: {(outSize / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
            ) : previewUrl ? (
              <div className="space-y-4">
                <div className="p-2 bg-neutral-950 border border-neutral-850 rounded flex items-center justify-center min-h-[180px]">
                  <img
                    src={previewUrl}
                    alt="Original source preview"
                    className="max-h-64 object-contain rounded opacity-40"
                  />
                </div>
                <div className="text-center text-neutral-500 text-xs font-mono uppercase tracking-wider">
                  Press Execute on the left to compress.
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-neutral-500 text-xs font-mono uppercase tracking-wider">
                Awaiting graphics inputs...
              </div>
            )}
          </div>

          {outBlobUrl && (
            <div className="mt-6">
              <a
                href={outBlobUrl}
                download={`kee2solv_export.${getFormatExtension(format)}`}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-950 text-xs font-mono font-bold uppercase tracking-wider transition"
              >
                <Download className="h-4 w-4" />
                Download transformed asset
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE RESIZER & CROPPER
// ─────────────────────────────────────────────────────────────────────────────
export function ImageResizer() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [lockRatio, setLockRatio] = useState(true);
  const [ratioMode, setRatioMode] = useState<"free" | "1:1" | "4:3" | "16:9" | "3:4" | "9:16">("free");
  const [scale, setScale] = useState<number>(100);
  const [outBlobUrl, setOutBlobUrl] = useState<string | null>(null);
  const [outSize, setOutSize] = useState(0);
  const [resizing, setResizing] = useState(false);

  const [origWidth, setOrigWidth] = useState(0);
  const [origHeight, setOrigHeight] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
      setOutBlobUrl(null);

      const img = new Image();
      img.onload = () => {
        setOrigWidth(img.naturalWidth);
        setOrigHeight(img.naturalHeight);
        setWidth(img.naturalWidth);
        setHeight(img.naturalHeight);
        setScale(100);
      };
      img.src = url;
    }
  };

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (lockRatio && origHeight > 0) {
      setHeight(Math.max(1, Math.round(val * (origHeight / origWidth))));
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (lockRatio && origWidth > 0) {
      setWidth(Math.max(1, Math.round(val * (origWidth / origHeight))));
    }
  };

  const handleScaleChange = (scVal: number) => {
    setScale(scVal);
    if (origWidth > 0) {
      const w = Math.max(1, Math.round(origWidth * (scVal / 100)));
      const h = Math.max(1, Math.round(origHeight * (scVal / 100)));
      setWidth(w);
      setHeight(h);
    }
  };

  const executeResize = () => {
    if (!file || !previewUrl) return;
    setResizing(true);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            setOutBlobUrl(URL.createObjectURL(blob));
            setOutSize(blob.size);
          }
          setResizing(false);
        }, file.type);
      } else {
        setResizing(false);
      }
    };
    img.src = previewUrl;
  };

  const setRatioPreset = (mode: typeof ratioMode) => {
    setRatioMode(mode);
    if (mode === "free") return;

    const parts = mode.split(":").map(Number);
    const targetRatio = parts[0] / parts[1];

    if (origWidth > 0) {
      const h = Math.max(1, Math.round(width / targetRatio));
      setHeight(h);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md space-y-4">
          <div className="border-b border-neutral-800 pb-3 mb-1">
            <span className="text-xs font-mono text-lime-400 font-bold uppercase tracking-widest">// Scale & Proportion Setup</span>
          </div>

          <div className="border-2 border-dashed border-neutral-800 hover:border-lime-400 bg-neutral-950/55 p-6 rounded-md text-center cursor-pointer transition relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Maximize className="mx-auto text-lime-400 mb-2 h-10 w-10" />
            <span className="block font-bold text-sm text-neutral-200">
              {file ? file.name : "Choose raw source image"}
            </span>
            <span className="block text-xs text-neutral-500 mt-1 uppercase font-mono">
              {file ? `${origWidth} × ${origHeight} px` : "Rescale securely in sandbox"}
            </span>
          </div>

          {file && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Aspect Ratio Constraint</label>
                <div className="grid grid-cols-6 gap-1">
                  {(["free", "1:1", "4:3", "16:9", "3:4", "9:16"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRatioPreset(r)}
                      className={`py-1.5 text-[10px] font-semibold font-mono rounded text-center cursor-pointer border transition ${
                        ratioMode === r
                          ? "bg-lime-400 border-lime-400 text-black"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Target Width (px)</label>
                  <input
                    type="number"
                    value={width || ""}
                    onChange={(e) => handleWidthChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-lime-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Target Height (px)</label>
                  <input
                    type="number"
                    value={height || ""}
                    onChange={(e) => handleHeightChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-lime-400"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="lockRatioInp"
                  checked={lockRatio}
                  onChange={(e) => setLockRatio(e.target.checked)}
                  className="rounded text-lime-400 focus:ring-lime-400 bg-neutral-950 border-neutral-800 text-neutral-900 cursor-pointer h-4 w-4"
                />
                <label htmlFor="lockRatioInp" className="text-xs font-mono text-neutral-400 uppercase tracking-wider cursor-pointer">
                  Maintain proportional ratios
                </label>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Scale multiplier</label>
                  <span className="text-xs font-mono text-lime-400">{scale}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={scale}
                  onChange={(e) => handleScaleChange(parseInt(e.target.value, 10))}
                  className="w-full accent-lime-400 bg-neutral-850 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <button
                onClick={executeResize}
                disabled={resizing}
                className="w-full font-mono font-bold text-xs uppercase tracking-wider py-3 px-4 rounded bg-lime-400 hover:bg-lime-500 text-black transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {resizing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-black" />
                    Scaling matrix...
                  </>
                ) : (
                  "Execute image resizing"
                )}
              </button>
            </div>
          )}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md flex flex-col justify-between">
          <div>
            <div className="border-b border-neutral-800 pb-3 mb-5">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">// Scaled output preview</span>
            </div>

            {outBlobUrl ? (
              <div className="space-y-4">
                <div className="p-2 bg-neutral-950 border border-neutral-850 rounded flex items-center justify-center min-h-[180px]">
                  <img
                    src={outBlobUrl}
                    alt="Resized output preview"
                    className="max-h-64 object-contain rounded"
                  />
                </div>

                <div className="bg-neutral-950 p-4 border border-neutral-800 rounded text-center">
                  <CheckCircle className="mx-auto text-lime-400 mb-1.5 h-6 w-6" />
                  <span className="block font-bold text-xs text-lime-400 uppercase tracking-wider">Rescaled Successfully</span>
                  <span className="block text-[11px] font-mono text-neutral-500 mt-1 uppercase">
                    Dimensions: {width} × {height} px · Size: {(outSize / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
            ) : previewUrl ? (
              <div className="space-y-4">
                <div className="p-2 bg-neutral-950 border border-neutral-850 rounded flex items-center justify-center min-h-[180px]">
                  <img
                    src={previewUrl}
                    alt="Original source preview"
                    className="max-h-64 object-contain rounded opacity-40"
                  />
                </div>
                <div className="text-center text-neutral-500 text-xs font-mono uppercase tracking-wider">
                  Select new scale dimensions and apply.
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-neutral-500 text-xs font-mono uppercase tracking-wider">
                Awaiting scale variables...
              </div>
            )}
          </div>

          {outBlobUrl && (
            <div className="mt-6">
              <a
                href={outBlobUrl}
                download={`kee2solv_rescaled_${width}x${height}.${file?.type.split("/")[1] || "png"}`}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-950 text-xs font-mono font-bold uppercase tracking-wider transition"
              >
                <Download className="h-4 w-4" />
                Download resized image
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND REMOVER (Chroma Threshold & Transparency Builder)
// ─────────────────────────────────────────────────────────────────────────────
export function BackgroundRemover() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [bgMode, setBgMode] = useState<"transparent" | "white" | "black" | "color">("transparent");
  const [bgColor, setBgColor] = useState("#c5f51e");
  const [tolerance, setTolerance] = useState(30);
  const [outBlobUrl, setOutBlobUrl] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [keyColor, setKeyColor] = useState<{ r: number; g: number; b: number }>({ r: 255, g: 255, b: 255 }); // Defaults to White Backdrop key
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
      setOutBlobUrl(null);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height);

    try {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      setKeyColor({ r: pixel[0], g: pixel[1], b: pixel[2] });
    } catch (err) {
      // Ignore click reading errors (security constraints or bounds)
    }
  };

  const executeRemoveBg = () => {
    if (!file || !previewUrl) return;
    setRemoving(true);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setRemoving(false);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Chroma key thresholds loop
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const rDiff = Math.abs(r - keyColor.r);
        const gDiff = Math.abs(g - keyColor.g);
        const bDiff = Math.abs(b - keyColor.b);

        // Euclidean metrics check or max element difference
        const distance = Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);

        if (distance < tolerance) {
          // Transparent segment
          data[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Compositing background layers
      if (bgMode !== "transparent") {
        const bgCanvas = document.createElement("canvas");
        bgCanvas.width = canvas.width;
        bgCanvas.height = canvas.height;
        const bgCtx = bgCanvas.getContext("2d");
        if (bgCtx) {
          bgCtx.fillStyle = bgMode === "white" ? "#ffffff" : bgMode === "black" ? "#000000" : bgColor;
          bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
          bgCtx.drawImage(canvas, 0, 0);
          bgCanvas.toBlob((blob) => {
            if (blob) setOutBlobUrl(URL.createObjectURL(blob));
            setRemoving(false);
          }, "image/png");
          return;
        }
      }

      canvas.toBlob((blob) => {
        if (blob) setOutBlobUrl(URL.createObjectURL(blob));
        setRemoving(false);
      }, "image/png");
    };
    img.src = previewUrl;
  };

  // Keep internal canvas updated with selected image preview
  useEffect(() => {
    if (previewUrl && canvasRef.current) {
      const canvas = canvasRef.current;
      const img = new Image();
      img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d")?.drawImage(img, 0, 0);
      };
      img.src = previewUrl;
    }
  }, [previewUrl]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md space-y-4">
          <div className="border-b border-neutral-800 pb-3 mb-1">
            <span className="text-xs font-mono text-lime-400 font-bold uppercase tracking-widest">// Intelligent Chroma Threshold</span>
          </div>

          <div className="border-2 border-dashed border-neutral-800 hover:border-lime-400 bg-neutral-950/55 p-6 rounded-md text-center cursor-pointer transition relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Scissors className="mx-auto text-lime-400 mb-2 h-10 w-10" />
            <span className="block font-bold text-sm text-neutral-200">
              {file ? file.name : "Select foreground photo"}
            </span>
            <span className="block text-xs text-neutral-500 mt-1 uppercase font-mono">
              Click photo on the right to auto-select backdrop color key!
            </span>
          </div>

          {file && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-neutral-950 p-3 rounded border border-neutral-800">
                  <span className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1">Selected Key Color</span>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-5 h-5 rounded border border-neutral-700"
                      style={{ backgroundColor: `rgb(${keyColor.r},${keyColor.g},${keyColor.b})` }}
                    />
                    <span className="text-xs font-mono text-neutral-300">
                      RGB({keyColor.r},{keyColor.g},{keyColor.b})
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-widest">Similarity filter</label>
                    <span className="text-xs font-mono text-lime-400">{tolerance}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="180"
                    value={tolerance}
                    onChange={(e) => setTolerance(parseInt(e.target.value, 10))}
                    className="w-full accent-lime-400 bg-neutral-850 h-1 rounded appearance-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider font-semibold">Chroma Backdrop Layer</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["transparent", "white", "black", "color"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setBgMode(m)}
                      className={`py-1.5 text-[10px] font-semibold font-mono rounded text-center cursor-pointer border transition capitalize ${
                        bgMode === m
                          ? "bg-lime-400 border-lime-400 text-black"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {bgMode === "color" && (
                <div className="flex items-center gap-3 bg-neutral-950 p-2 border border-neutral-800 rounded">
                  <label className="text-xs font-mono text-neutral-400 uppercase">Overwrite Hex:</label>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded shrink-0 border border-neutral-800 bg-neutral-900 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="bg-neutral-900 border border-neutral-800 font-mono text-xs text-neutral-200 px-2 py-1 rounded w-24 uppercase"
                  />
                </div>
              )}

              <button
                onClick={executeRemoveBg}
                disabled={removing}
                className="w-full font-mono font-bold text-xs uppercase tracking-wider py-3 px-4 rounded bg-lime-400 hover:bg-lime-500 text-black transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {removing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-black" />
                    Filtering pixels...
                  </>
                ) : (
                  "Execute segment cut-out"
                )}
              </button>
            </div>
          )}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md flex flex-col justify-between">
          <div>
            <div className="border-b border-neutral-800 pb-3 mb-5">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">// Local rendering canvas viewport</span>
            </div>

            {outBlobUrl ? (
              <div className="space-y-4">
                <div className="p-3 bg-neutral-950 border border-neutral-850 rounded flex items-center justify-center min-h-[180px] bg-[repeating-conic-gradient(#1a1a1a_0_25%,#0a0a0a_0_50%)_50%_/_16px_16px]">
                  <img src={outBlobUrl} alt="Cutout preview" className="max-h-64 object-contain rounded" />
                </div>
                <div className="bg-lime-950/20 border border-lime-900 p-4 rounded text-center">
                  <span className="block text-xs font-mono text-lime-400 uppercase tracking-widest font-bold">Cutout rendered securely on device</span>
                </div>
              </div>
            ) : previewUrl ? (
              <div className="space-y-3">
                <p className="text-[10px] uppercase font-mono text-lime-400 font-bold mb-1">// Click the canvas color area you want to disappear</p>
                <div className="p-1 bg-neutral-950 border border-neutral-850 rounded flex items-center justify-center min-h-[180px]">
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    className="max-h-64 max-w-full object-contain rounded cursor-crosshair border border-neutral-800"
                  />
                </div>
                <div className="text-center text-neutral-400 text-xs font-mono leading-none">
                  Backdrop Selector Active.
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-neutral-500 text-xs font-mono uppercase tracking-wider">
                Awaiting foreground canvas...
              </div>
            )}
          </div>

          {outBlobUrl && (
            <div className="mt-6">
              <a
                href={outBlobUrl}
                download="kee2solv_mask_cutout.png"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-950 text-xs font-mono font-bold uppercase tracking-wider transition"
              >
                <Download className="h-4 w-4" />
                Export transparent PNG PNG
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG VECTOR EDITOR & ATTRIBUTE OVERWRITER
// ─────────────────────────────────────────────────────────────────────────────
export function SvgEditor() {
  const [svgMarkup, setSvgMarkup] = useState<string>(
    `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">\n  <circle cx="50" cy="50" r="40" fill="#c5f51e" />\n  <rect x="35" y="35" width="30" height="30" fill="#000" />\n</svg>`
  );
  const [fillColor, setFillColor] = useState<string>("#c5f51e");

  // Applies fill color replacement to the SVG markup
  const applyColorOverwrite = () => {
    let clean = svgMarkup;
    // Replace all existing fill attributes in elements or inject a general fill
    if (fillColor.trim()) {
      clean = clean.replace(/fill="[^"]*"/gi, `fill="${fillColor}"`);
    }
    setSvgMarkup(clean);
  };

  const handleDownload = () => {
    const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kee2solv_vector.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md space-y-4">
          <div className="border-b border-neutral-800 pb-3 mb-1">
            <span className="text-xs font-mono text-lime-400 font-bold uppercase tracking-widest">// Vector source editor XML</span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Raw Input SVG Text Markup</label>
            <textarea
              rows={8}
              value={svgMarkup}
              onChange={(e) => setSvgMarkup(e.target.value)}
              placeholder="Paste SVG code..."
              className="w-full bg-neutral-950 border border-neutral-800 text-lime-400 rounded p-3 text-xs font-mono focus:outline-none focus:border-lime-400 min-h-[160px] resize-y"
            />
          </div>

          <div className="bg-neutral-950 p-4 border border-neutral-800 rounded space-y-3.5">
            <span className="block text-xs font-mono text-neutral-400 uppercase tracking-wider font-bold">Quick fill color substitution fill=""</span>
            <div className="flex gap-2.5">
              <input
                type="color"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                className="w-10 h-10 border border-neutral-850 bg-neutral-900 rounded cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                placeholder="Hex or Color name"
                className="bg-neutral-900 border border-neutral-800 text-neutral-200 font-mono text-xs p-2 rounded flex-grow focus:outline-none focus:border-lime-400 uppercase"
              />
              <button
                onClick={applyColorOverwrite}
                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-950 px-4 rounded text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
              >
                Overwrite fill
              </button>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md flex flex-col justify-between">
          <div>
            <div className="border-b border-neutral-800 pb-3 mb-5">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">// Live SVG vector rendering node</span>
            </div>

            <div className="p-10 bg-white border border-neutral-200 rounded flex items-center justify-center min-h-[220px] shadow-inner">
              <div
                className="max-h-64 object-contain max-w-full flex items-center justify-center select-none"
                dangerouslySetInnerHTML={{ __html: svgMarkup }}
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleDownload}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-950 text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Download vector SVG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
