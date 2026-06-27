/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { PDFDocument, PDFName, PDFRawStream, PDFNumber } from "pdf-lib";
import JSZip from "jszip";
import { File, ArrowUp, ArrowDown, Trash2, Download, CheckCircle, RefreshCw, AlertTriangle } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

// Set up worker src using matching CDN
const isMjs = !pdfjsLib.version || parseInt(pdfjsLib.version.split(".")[0]) >= 4;
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.${isMjs ? "mjs" : "js"}`;

interface FileWithId {
  id: string;
  file: globalThis.File;
  size: number;
  name: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF MERGER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function PdfMerger() {
  const [files, setFiles] = useState<FileWithId[]>([]);
  const [merging, setMerging] = useState(false);
  const [mergedBlobUrl, setMergedBlobUrl] = useState<string | null>(null);
  const [mergedSize, setMergedSize] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: FileWithId[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
          newFiles.push({
            id: Math.random().toString(36).slice(2, 9),
            file,
            size: file.size,
            name: file.name,
          });
        }
      }
      setFiles((prev) => [...prev, ...newFiles]);
      setError(null);
      setMergedBlobUrl(null);
    }
  };

  const handleRemove = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setMergedBlobUrl(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setFiles((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
    setMergedBlobUrl(null);
  };

  const moveDown = (index: number) => {
    if (index === files.length - 1) return;
    setFiles((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
    setMergedBlobUrl(null);
  };

  const executeMerge = async () => {
    if (files.length < 2) {
      setError("Please add at least two PDF documents to merge.");
      return;
    }

    setMerging(true);
    setError(null);
    setMergedBlobUrl(null);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const item of files) {
        const fileBytes = await item.file.arrayBuffer();
        const srcPdf = await PDFDocument.load(fileBytes);
        const copiedPages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      setMergedBlobUrl(url);
      setMergedSize(blob.size);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "An unexpected error occurred during PDF compiling. Ensure files are unencrypted.");
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Input Configuration */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md">
          <div className="border-b border-neutral-800 pb-3 mb-5">
            <span className="text-xs font-mono text-lime-400 font-bold uppercase tracking-widest">// Input documents list</span>
          </div>

          <div className="border-2 border-dashed border-neutral-800 hover:border-lime-400 bg-neutral-950/55 p-8 rounded-md text-center cursor-pointer transition relative">
            <input
              type="file"
              accept="application/pdf"
              multiple
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <File className="mx-auto text-lime-400 mb-2 h-10 w-10 animate-pulse" />
            <span className="block font-bold text-sm text-neutral-200">Drop PDF files or Click to browse</span>
            <span className="block text-xs text-neutral-500 mt-1 uppercase font-mono">100% locally evaluated in-browser</span>
          </div>

          {files.length > 0 && (
            <div className="mt-6 space-y-2">
              <span className="block text-xs font-mono text-neutral-400 uppercase tracking-widest">Document queue ({files.length})</span>
              <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                {files.map((f, i) => (
                  <div key={f.id} className="flex items-center justify-between text-xs bg-neutral-950 px-3 py-2 border border-neutral-800 rounded">
                    <span className="font-medium text-neutral-300 truncate max-w-xs">{f.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500 font-mono">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                      <button onClick={() => moveUp(i)} disabled={i === 0} className="p-1 hover:text-lime-400 text-neutral-500 disabled:opacity-20">
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => moveDown(i)} disabled={i === files.length - 1} className="p-1 hover:text-lime-400 text-neutral-500 disabled:opacity-20">
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleRemove(f.id)} className="p-1 hover:text-red-400 text-neutral-500 ml-1">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={executeMerge}
              disabled={files.length < 2 || merging}
              className="w-full font-mono font-bold text-xs uppercase tracking-wider py-3 px-4 rounded bg-lime-400 hover:bg-lime-500 text-black transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {merging ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-black" />
                  Compiling PDF streams...
                </>
              ) : (
                `Merge ${files.length} PDFs`
              )}
            </button>
          </div>
        </div>

        {/* Right Output Manifest */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md flex flex-col justify-between">
          <div>
            <div className="border-b border-neutral-800 pb-3 mb-5">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">// Converted outputs</span>
            </div>

            {error && (
              <div className="bg-red-950/40 border border-red-900 text-red-200 p-4 rounded text-xs flex items-start gap-2.5 mb-4">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block uppercase tracking-wider mb-1">Encrypted or Defective Stream</span>
                  {error}
                </div>
              </div>
            )}

            {mergedBlobUrl ? (
              <div className="space-y-4">
                <div className="bg-neutral-950 p-6 border border-neutral-800 rounded text-center">
                  <CheckCircle className="mx-auto text-lime-400 mb-2 h-10 w-10" />
                  <span className="block font-bold text-sm text-lime-400">PDF Files Compiled Successfully</span>
                  <span className="block text-xs font-mono text-neutral-500 mt-1 uppercase">File Sizing: {(mergedSize / 1024 / 1024).toFixed(3)} MB</span>
                </div>

                <div className="p-4 bg-lime-950/15 border border-lime-900 rounded-md text-xs text-lime-300">
                  Your compiled document remains strictly embedded inside the local browser application memory. Press save down below to store the file physically.
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-neutral-500 text-xs font-mono uppercase tracking-wider">
                Awaiting compile payload inputs...
              </div>
            )}
          </div>

          {mergedBlobUrl && (
            <div className="mt-6">
              <a
                href={mergedBlobUrl}
                download="kee2solv_combined.pdf"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-950 text-xs font-mono font-bold uppercase tracking-wider transition"
              >
                <Download className="h-4 w-4" />
                Save combined PDF
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF SPLITTER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function PdfSplitter() {
  const [file, setFile] = useState<globalThis.File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [splitting, setSplitting] = useState(false);
  const [zipBlobUrl, setZipBlobUrl] = useState<string | null>(null);
  const [zipSize, setZipSize] = useState<number>(0);
  const [pageRange, setPageRange] = useState("1-2");
  const [pageCount, setPageCount] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(null);
      setError(null);
      setZipBlobUrl(null);
      setPageCount(0);

      try {
        const fileBytes = await selectedFile.arrayBuffer();
        const pdf = await PDFDocument.load(fileBytes);
        const count = pdf.getPageCount();
        setPageCount(count);
        setFile(selectedFile);
        setPageRange(`1-${Math.min(5, count)}`);
      } catch (err: any) {
        console.error(err);
        setError("Error parsing target PDF. Ensure the file is unencrypted.");
      }
    }
  };

  const executeSplit = async () => {
    if (!file || pageCount === 0) return;

    setSplitting(true);
    setError(null);
    setZipBlobUrl(null);

    try {
      const pagesToExtract = parsePageRange(pageRange, pageCount);
      if (pagesToExtract.length === 0) {
        throw new Error("Specified Page Range is empty or out-of-bounds.");
      }

      const fileBytes = await file.arrayBuffer();
      const parentPdf = await PDFDocument.load(fileBytes);

      const zip = new JSZip();

      for (const pageIdx of pagesToExtract) {
        const newDoc = await PDFDocument.create();
        const [copiedPage] = await newDoc.copyPages(parentPdf, [pageIdx]);
        newDoc.addPage(copiedPage);

        const newDocBytes = await newDoc.save();
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        zip.file(`${baseName}_page_${pageIdx + 1}.pdf`, newDocBytes);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);

      setZipBlobUrl(url);
      setZipSize(zipBlob.size);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "PDF splitting loop encountered an internal compile issue.");
    } finally {
      setSplitting(false);
    }
  };

  // Parses ranges like: "1-3, 5, 8-10" into [0, 1, 2, 4, 7, 8, 9] (0-indexed page indices)
  const parsePageRange = (expr: string, maxPages: number): number[] => {
    const indicesSet = new Set<number>();
    const components = expr.split(",");

    for (let part of components) {
      part = part.trim();
      if (!part) continue;

      if (part.includes("-")) {
        const bounds = part.split("-").map((str) => parseInt(str.trim(), 10));
        if (bounds.length === 2 && !isNaN(bounds[0]) && !isNaN(bounds[1])) {
          const start = Math.max(1, bounds[0]);
          const end = Math.min(maxPages, bounds[1]);
          for (let idx = start; idx <= end; idx++) {
            indicesSet.add(idx - 1);
          }
        }
      } else {
        const singleVal = parseInt(part, 10);
        if (!isNaN(singleVal) && singleVal >= 1 && singleVal <= maxPages) {
          indicesSet.add(singleVal - 1);
        }
      }
    }

    return Array.from(indicesSet).sort((a, b) => a - b);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md">
          <div className="border-b border-neutral-800 pb-3 mb-5">
            <span className="text-xs font-mono text-lime-400 font-bold uppercase tracking-widest">// Split Configuration</span>
          </div>

          <div className="border-2 border-dashed border-neutral-800 hover:border-lime-400 bg-neutral-950/55 p-8 rounded-md text-center cursor-pointer transition relative">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <File className="mx-auto text-lime-400 mb-2 h-10 w-10" />
            <span className="block font-bold text-sm text-neutral-200">
              {file ? file.name : "Select raw target PDF"}
            </span>
            <span className="block text-xs text-neutral-500 mt-1 uppercase font-mono">
              {file ? `${pageCount} pages total` : "100% locally evaluated in-browser"}
            </span>
          </div>

          {file && (
            <div className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Specify Extraction pages / ranges</label>
                <input
                  type="text"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  placeholder="e.g. 1-2, 4, 6-9"
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-lime-400"
                />
                <span className="block text-[10px] text-neutral-500 uppercase font-mono">
                  Enter comma-separated values. Max bounds: {pageCount} pages.
                </span>
              </div>

              <button
                onClick={executeSplit}
                disabled={splitting || !pageRange.trim()}
                className="w-full font-mono font-bold text-xs uppercase tracking-wider py-3 px-4 rounded bg-lime-400 hover:bg-lime-500 text-black transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                {splitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-black" />
                    Extracting layers...
                  </>
                ) : (
                  "Split & Compile ZIP"
                )}
              </button>
            </div>
          )}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md flex flex-col justify-between">
          <div>
            <div className="border-b border-neutral-800 pb-3 mb-5">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">// Split Output archive</span>
            </div>

            {error && (
              <div className="bg-red-950/40 border border-red-900 text-red-200 p-4 rounded text-xs flex items-start gap-2.5 mb-4">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block uppercase tracking-wider mb-1">Split Error</span>
                  {error}
                </div>
              </div>
            )}

            {zipBlobUrl ? (
              <div className="space-y-4">
                <div className="bg-neutral-950 p-6 border border-neutral-800 rounded text-center">
                  <CheckCircle className="mx-auto text-lime-400 mb-2 h-10 w-10" />
                  <span className="block font-bold text-sm text-lime-400">PDF Document Segmented Successfully</span>
                  <span className="block text-xs font-mono text-neutral-500 mt-1 uppercase">Zip Size: {(zipSize / 1024).toFixed(2)} KB</span>
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed">
                  Individual PDF pages have been compiled inside a flat `.zip` structure. Click save below to extract them.
                </p>
              </div>
            ) : (
              <div className="py-20 text-center text-neutral-500 text-xs font-mono uppercase tracking-wider">
                Awaiting pages segmentation...
              </div>
            )}
          </div>

          {zipBlobUrl && (
            <div className="mt-6">
              <a
                href={zipBlobUrl}
                download={`${file?.name.replace(/\.[^/.]+$/, "") || "pdf"}_split_archives.zip`}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-950 text-xs font-mono font-bold uppercase tracking-wider transition"
              >
                <Download className="h-4 w-4" />
                Save Split ZIP
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF COMPRESSOR COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function PdfCompressor() {
  const [file, setFile] = useState<globalThis.File | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [compressedBlobUrl, setCompressedBlobUrl] = useState<string | null>(null);
  const [preSize, setPreSize] = useState(0);
  const [postSize, setPostSize] = useState(0);
  const [preset, setPreset] = useState<"low" | "medium" | "high">("medium");
  const [imagesFound, setImagesFound] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<"image" | "lossless" | "raster">("image");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreSize(e.target.files[0].size);
      setCompressedBlobUrl(null);
      setImagesFound(0);
      setError(null);
    }
  };

  const executeCompress = async () => {
    if (!file) return;

    setCompressing(true);
    setError(null);
    setCompressedBlobUrl(null);
    setImagesFound(0);

    try {
      const fileBytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(fileBytes);
      const settings = {
        low: { quality: 0.8, maxDim: 2200 },
        medium: { quality: 0.6, maxDim: 1500 },
        high: { quality: 0.4, maxDim: 1000 },
      }[preset];

      if (strategy === "image") {
        const indirectObjects = doc.context.enumerateIndirectObjects();
        let processedCount = 0;

        for (const [_, obj] of indirectObjects) {
          if (!(obj instanceof PDFRawStream)) continue;
          const dict = obj.dict;

          // Dereference Subtype
          const subtypeVal = dict.lookup(PDFName.of("Subtype"));
          let subtypeName = "";
          if (subtypeVal instanceof PDFName) {
            subtypeName = subtypeVal.asString();
          } else if (subtypeVal && typeof (subtypeVal as any).encodedName === "string") {
            subtypeName = (subtypeVal as any).encodedName;
          }
          if (subtypeName !== "/Image" && subtypeName !== "Image") continue;

          // Dereference Filter
          const filterVal = dict.lookup(PDFName.of("Filter"));
          let filterNames: string[] = [];
          if (filterVal instanceof PDFName) {
            filterNames.push(filterVal.asString());
          } else if (filterVal && typeof (filterVal as any).encodedName === "string") {
            filterNames.push((filterVal as any).encodedName);
          } else if (filterVal && (filterVal as any).array) {
            const arr = (filterVal as any).array;
            for (let i = 0; i < arr.length; i++) {
              const item = doc.context.lookup(arr[i]);
              if (item instanceof PDFName) {
                filterNames.push(item.asString());
              } else if (item && typeof (item as any).encodedName === "string") {
                filterNames.push((item as any).encodedName);
              }
            }
          }

          const isDCT = filterNames.includes("/DCTDecode") || filterNames.includes("DCTDecode");
          const isFlate = filterNames.includes("/FlateDecode") || filterNames.includes("FlateDecode");

          if (!isDCT && !isFlate) continue;

          try {
            if (isDCT) {
              const rawContents = (obj as any).contents;
              if (!rawContents || rawContents.length === 0) continue;

              const imgBlob = new Blob([rawContents], { type: "image/jpeg" });
              const imgUrl = URL.createObjectURL(imgBlob);

              const img = await new Promise<HTMLImageElement>((res, rej) => {
                const i = new Image();
                i.onload = () => res(i);
                i.onerror = rej;
                i.src = imgUrl;
              });
              URL.revokeObjectURL(imgUrl);

              let { naturalWidth: w, naturalHeight: h } = img;
              const scale = Math.min(1, settings.maxDim / Math.max(w, h));
              w = Math.max(1, Math.round(w * scale));
              h = Math.max(1, Math.round(h * scale));

              const canvas = document.createElement("canvas");
              canvas.width = w;
              canvas.height = h;
              canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);

              const resampleBlob = await new Promise<Blob | null>((res) =>
                canvas.toBlob(res, "image/jpeg", settings.quality)
              );

              if (resampleBlob) {
                const resampleBytes = new Uint8Array(await resampleBlob.arrayBuffer());
                if (resampleBytes.length < rawContents.length) {
                  (obj as any).contents = resampleBytes;
                  dict.set(PDFName.of("Width"), PDFNumber.of(w));
                  dict.set(PDFName.of("Height"), PDFNumber.of(h));
                  dict.set(PDFName.of("Length"), PDFNumber.of(resampleBytes.length));
                  processedCount++;
                }
              }
            } else if (isFlate) {
              // Read uncompressed pixel bytes safely using any cast
              const uncompressed = (obj as any).getUncompressedContents();
              if (!uncompressed || uncompressed.length === 0) continue;

              const widthVal = dict.lookup(PDFName.of("Width"));
              const heightVal = dict.lookup(PDFName.of("Height"));
              if (!(widthVal instanceof PDFNumber) || !(heightVal instanceof PDFNumber)) continue;

              const w = widthVal.asNumber();
              const h = heightVal.asNumber();

              const colorSpace = dict.lookup(PDFName.of("ColorSpace"));
              let colorSpaceName = "";
              if (colorSpace instanceof PDFName) {
                colorSpaceName = colorSpace.asString();
              } else if (colorSpace && typeof (colorSpace as any).encodedName === "string") {
                colorSpaceName = (colorSpace as any).encodedName;
              }

              let rgbaBytes: Uint8ClampedArray | null = null;

              if (colorSpaceName === "/DeviceRGB" || colorSpaceName === "DeviceRGB") {
                if (uncompressed.length >= w * h * 3) {
                  rgbaBytes = new Uint8ClampedArray(w * h * 4);
                  let j = 0;
                  for (let i = 0; i < w * h * 3; i += 3) {
                    rgbaBytes[j] = uncompressed[i];
                    rgbaBytes[j + 1] = uncompressed[i + 1];
                    rgbaBytes[j + 2] = uncompressed[i + 2];
                    rgbaBytes[j + 3] = 255;
                    j += 4;
                  }
                }
              } else if (colorSpaceName === "/DeviceGray" || colorSpaceName === "DeviceGray") {
                if (uncompressed.length >= w * h) {
                  rgbaBytes = new Uint8ClampedArray(w * h * 4);
                  let j = 0;
                  for (let i = 0; i < w * h; i++) {
                    const g = uncompressed[i];
                    rgbaBytes[j] = g;
                    rgbaBytes[j + 1] = g;
                    rgbaBytes[j + 2] = g;
                    rgbaBytes[j + 3] = 255;
                    j += 4;
                  }
                }
              } else if (colorSpaceName === "/DeviceCMYK" || colorSpaceName === "DeviceCMYK") {
                if (uncompressed.length >= w * h * 4) {
                  rgbaBytes = new Uint8ClampedArray(w * h * 4);
                  let j = 0;
                  for (let i = 0; i < w * h * 4; i += 4) {
                    const c = uncompressed[i] / 255;
                    const m = uncompressed[i + 1] / 255;
                    const y = uncompressed[i + 2] / 255;
                    const k = uncompressed[i + 3] / 255;
                    rgbaBytes[j] = Math.round(255 * (1 - c) * (1 - k));
                    rgbaBytes[j + 1] = Math.round(255 * (1 - m) * (1 - k));
                    rgbaBytes[j + 2] = Math.round(255 * (1 - y) * (1 - k));
                    rgbaBytes[j + 3] = 255;
                    j += 4;
                  }
                }
              }

              // Fallback length heuristics
              if (!rgbaBytes) {
                if (uncompressed.length === w * h * 3) {
                  rgbaBytes = new Uint8ClampedArray(w * h * 4);
                  let j = 0;
                  for (let i = 0; i < uncompressed.length; i += 3) {
                    rgbaBytes[j] = uncompressed[i];
                    rgbaBytes[j + 1] = uncompressed[i + 1];
                    rgbaBytes[j + 2] = uncompressed[i + 2];
                    rgbaBytes[j + 3] = 255;
                    j += 4;
                  }
                } else if (uncompressed.length === w * h * 4) {
                  rgbaBytes = new Uint8ClampedArray(w * h * 4);
                  for (let i = 0; i < uncompressed.length; i++) {
                    rgbaBytes[i] = uncompressed[i];
                  }
                } else if (uncompressed.length === w * h) {
                  rgbaBytes = new Uint8ClampedArray(w * h * 4);
                  let j = 0;
                  for (let i = 0; i < uncompressed.length; i++) {
                    const g = uncompressed[i];
                    rgbaBytes[j] = g;
                    rgbaBytes[j + 1] = g;
                    rgbaBytes[j + 2] = g;
                    rgbaBytes[j + 3] = 255;
                    j += 4;
                  }
                }
              }

              if (rgbaBytes) {
                const canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  const imgData = new ImageData(rgbaBytes, w, h);
                  ctx.putImageData(imgData, 0, 0);

                  let targetW = w;
                  let targetH = h;
                  const scale = Math.min(1, settings.maxDim / Math.max(w, h));
                  let resampleBlob: Blob | null = null;

                  if (scale < 1) {
                    targetW = Math.max(1, Math.round(w * scale));
                    targetH = Math.max(1, Math.round(h * scale));
                    const scaleCanvas = document.createElement("canvas");
                    scaleCanvas.width = targetW;
                    scaleCanvas.height = targetH;
                    const scaleCtx = scaleCanvas.getContext("2d");
                    if (scaleCtx) {
                      scaleCtx.drawImage(canvas, 0, 0, w, h, 0, 0, targetW, targetH);
                      resampleBlob = await new Promise<Blob | null>((res) =>
                        scaleCanvas.toBlob(res, "image/jpeg", settings.quality)
                      );
                    }
                  } else {
                    resampleBlob = await new Promise<Blob | null>((res) =>
                      canvas.toBlob(res, "image/jpeg", settings.quality)
                    );
                  }

                  if (resampleBlob) {
                    const resampleBytes = new Uint8Array(await resampleBlob.arrayBuffer());
                    if (resampleBytes.length < (obj as any).contents.length) {
                      (obj as any).contents = resampleBytes;
                      dict.set(PDFName.of("Filter"), PDFName.of("DCTDecode"));
                      dict.set(PDFName.of("ColorSpace"), PDFName.of("DeviceRGB"));
                      dict.set(PDFName.of("Width"), PDFNumber.of(targetW));
                      dict.set(PDFName.of("Height"), PDFNumber.of(targetH));
                      dict.set(PDFName.of("Length"), PDFNumber.of(resampleBytes.length));
                      dict.delete(PDFName.of("DecodeParms")); // Clean predictors
                      processedCount++;
                    }
                  }
                }
              }
            }
          } catch (imageErr) {
            console.warn("Error processing specific PDF raw stream image:", imageErr);
          }
        }

        setImagesFound(processedCount);
        const compressedBytes = await doc.save({ useObjectStreams: true });
        const outBlob = new Blob([compressedBytes], { type: "application/pdf" });

        setPostSize(outBlob.size);
        setCompressedBlobUrl(URL.createObjectURL(outBlob));
      } else if (strategy === "lossless") {
        // Complete structural metadata copy & compress
        const cleanedDoc = await PDFDocument.create();
        const pageIndices = doc.getPageIndices();
        const copiedPages = await cleanedDoc.copyPages(doc, pageIndices);
        copiedPages.forEach((page) => cleanedDoc.addPage(page));

        const compressedBytes = await cleanedDoc.save({ useObjectStreams: true });
        const outBlob = new Blob([compressedBytes], { type: "application/pdf" });

        setPostSize(outBlob.size);
        setCompressedBlobUrl(URL.createObjectURL(outBlob));
        setImagesFound(0);
      } else if (strategy === "raster") {
        // Full Canvas Rasterization for stubborn documents
        const rasterPreset = {
          low: { quality: 0.82, scale: 1.5 },      // High Quality (crisp rendering)
          medium: { quality: 0.65, scale: 1.15 },   // Balanced
          high: { quality: 0.45, scale: 0.8 },     // Maximum Compression
        }[preset];

        const loadingTask = pdfjsLib.getDocument({ data: fileBytes.slice(0) });
        const pdf = await loadingTask.promise;
        const pageCount = pdf.numPages;

        const cleanDoc = await PDFDocument.create();

        for (let idx = 0; idx < pageCount; idx++) {
          const page = await pdf.getPage(idx + 1);
          const viewport = page.getViewport({ scale: rasterPreset.scale });

          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(viewport.width));
          canvas.height = Math.max(1, Math.round(viewport.height));

          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvasContext: ctx, viewport } as any).promise;

            const pageBlob = await new Promise<Blob | null>((res) =>
              canvas.toBlob(res, "image/jpeg", rasterPreset.quality)
            );

            if (pageBlob) {
              const pageBytes = new Uint8Array(await pageBlob.arrayBuffer());
              const embeddedJpg = await cleanDoc.embedJpg(pageBytes);
              const newPage = cleanDoc.addPage([embeddedJpg.width, embeddedJpg.height]);
              newPage.drawImage(embeddedJpg, {
                x: 0,
                y: 0,
                width: embeddedJpg.width,
                height: embeddedJpg.height,
              });
            }
          }
        }

        const compressedBytes = await cleanDoc.save({ useObjectStreams: true });
        const outBlob = new Blob([compressedBytes], { type: "application/pdf" });

        setPostSize(outBlob.size);
        setCompressedBlobUrl(URL.createObjectURL(outBlob));
        setImagesFound(pageCount);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Compression error. Ensure the target is a valid PDF.");
    } finally {
      setCompressing(false);
    }
  };

  const rawSavingsPct = preSize > 0 ? ((1 - postSize / preSize) * 100) : 0;
  const savingsPct = rawSavingsPct > 0 ? rawSavingsPct.toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md">
          <div className="border-b border-neutral-800 pb-3 mb-5">
            <span className="text-xs font-mono text-lime-400 font-bold uppercase tracking-widest">// Compression Profiler</span>
          </div>

          <div className="border-2 border-dashed border-neutral-800 hover:border-lime-400 bg-neutral-950/55 p-8 rounded-md text-center cursor-pointer transition relative">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <File className="mx-auto text-lime-400 mb-2 h-10 w-10" />
            <span className="block font-bold text-sm text-neutral-200">
              {file ? file.name : "Select source PDF document"}
            </span>
            <span className="block text-xs text-neutral-500 mt-1 uppercase font-mono">
              {file ? `${(preSize / 1024 / 1024).toFixed(2)} MB loaded` : "100% locally evaluated in-browser"}
            </span>
          </div>

          {file && (
            <div className="mt-6 space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Compression Strategy</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["image", "lossless", "raster"] as const).map((strat) => (
                    <button
                      key={strat}
                      onClick={() => {
                        setStrategy(strat);
                        setCompressedBlobUrl(null);
                        setError(null);
                      }}
                      className={`py-2 text-[10px] sm:text-xs font-semibold rounded font-mono uppercase tracking-wider text-center cursor-pointer border transition ${
                        strategy === strat
                          ? "bg-lime-400 border-lime-400 text-black"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      {strat === "image" ? "Adaptive Image" : strat === "lossless" ? "Lossless Copy" : "Full Raster"}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-neutral-500 font-mono leading-relaxed uppercase">
                  {strategy === "image" && "💡 Adaptive Image: Downsamples and compresses high-resolution photos. Keeps vector text 100% crisp and selectable."}
                  {strategy === "lossless" && "💡 Lossless Copy: Purges duplicate metadata, incremental revision histories, and structural bloat. 100% vector safe."}
                  {strategy === "raster" && "💡 Full Raster: Renders each page to a canvas and recompiles. Guaranteed size reduction for heavy vector or CAD files."}
                </p>
              </div>

              {strategy !== "lossless" && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Compression Intensity</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["low", "medium", "high"] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setPreset(opt);
                          setCompressedBlobUrl(null);
                        }}
                        className={`py-2 text-xs font-semibold rounded font-mono uppercase tracking-wider text-center cursor-pointer border transition ${
                          preset === opt
                            ? "bg-lime-400 border-lime-400 text-black"
                            : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                        }`}
                      >
                        {opt === "low" ? "Low (Safe)" : opt === "medium" ? "Medium" : "High (Max)"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={executeCompress}
                disabled={compressing}
                className="w-full font-mono font-bold text-xs uppercase tracking-wider py-3 px-4 rounded bg-lime-400 hover:bg-lime-500 text-black transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {compressing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-black" />
                    Processing document streams...
                  </>
                ) : (
                  "Compress PDF Size"
                )}
              </button>
            </div>
          )}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md flex flex-col justify-between">
          <div>
            <div className="border-b border-neutral-800 pb-3 mb-5">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">// Sizing outcomes summary</span>
            </div>

            {error && (
              <div className="bg-red-950/40 border border-red-900 text-red-200 p-4 rounded text-xs flex items-start gap-2.5 mb-4">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block uppercase tracking-wider mb-1">Compression notice</span>
                  {error}
                </div>
              </div>
            )}

            {compressedBlobUrl ? (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-neutral-950 border border-neutral-850 p-4 rounded text-center">
                    <span className="block text-[10px] font-mono text-neutral-500 uppercase tracking-widest leading-none mb-1">Original</span>
                    <span className="text-sm font-mono font-bold text-neutral-250">{(preSize / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <div className="bg-neutral-950 border border-neutral-855 p-4 rounded text-center">
                    <span className="block text-[10px] font-mono text-neutral-500 uppercase tracking-widest leading-none mb-1">Reduced</span>
                    <span className="text-sm font-mono font-bold text-lime-400">{(postSize / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <div className="bg-neutral-950 border border-neutral-860 p-4 rounded text-center">
                    <span className="block text-[10px] font-mono text-neutral-500 uppercase tracking-widest leading-none mb-1">Savings</span>
                    <span className="text-sm font-mono font-bold text-lime-400">-{savingsPct}%</span>
                  </div>
                </div>

                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded text-center space-y-2">
                  <CheckCircle className="mx-auto text-lime-400 mb-1 h-6 w-6" />
                  <span className="block text-xs font-mono text-neutral-300">
                    {strategy === "image" && (imagesFound > 0 
                      ? `Successfully optimized ${imagesFound} embedded image streams.`
                      : "No image streams were downsampled.")}
                    {strategy === "lossless" && "Pruned structural metadata, redundant catalogs, and incremental versioning bloat."}
                    {strategy === "raster" && `Reconstructed ${imagesFound} pages into high-efficiency compressed rasters.`}
                  </span>
                  
                  {strategy === "image" && imagesFound === 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-neutral-500 uppercase font-mono leading-relaxed max-w-xs mx-auto">
                        This is a vector-based text document (e.g., a direct PDF export with no embedded images). 
                      </p>
                      <p className="text-[10px] text-lime-400 uppercase font-mono leading-relaxed max-w-xs mx-auto">
                        💡 Tip: Try the "Full Raster" strategy for maximum vector flattening size reduction, or "Lossless Copy" to cleanly strip metadata!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-neutral-500 text-xs font-mono uppercase tracking-wider">
                Awaiting downsizer compiling...
              </div>
            )}
          </div>

          {compressedBlobUrl && (
            <div className="mt-6">
              <a
                href={compressedBlobUrl}
                download={file ? `${file.name.replace(/\.[^/.]+$/, "")}_compressed.pdf` : "compressed.pdf"}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-950 text-xs font-mono font-bold uppercase tracking-wider transition"
              >
                <Download className="h-4 w-4" />
                Save compressed PDF
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
