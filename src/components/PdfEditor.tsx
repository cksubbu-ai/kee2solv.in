/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import {
  FileText,
  Type,
  Square,
  Image as ImageIcon,
  CheckCircle,
  Download,
  RefreshCw,
  AlertTriangle,
  Trash2,
  Plus,
  HelpCircle
} from "lucide-react";

// Setup pdf.js worker using matching CDN
const isMjs = !pdfjsLib.version || parseInt(pdfjsLib.version.split(".")[0]) >= 4;
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.${isMjs ? "mjs" : "js"}`;

interface EditItem {
  id: string;
  type: "replace" | "text" | "redact" | "image";
  pageIdx: number;
  xPx: number;
  yPx: number;
  wPx?: number;
  hPx?: number;
  originalStr?: string;
  newStr?: string;
  text?: string;
  size?: number;
  imageId?: string;
  // CSS styles for rendering
  cssColor?: string;
  cssBgColor?: string;
  cssFontFamily?: string;
  isBold?: boolean;
  isItalic?: boolean;
  fontName?: string;
  fontHeight?: number;
  item?: any;
}

interface ImageLibraryItem {
  id: string;
  dataUrl: string;
  bytes: ArrayBuffer;
  kind: "png" | "jpg";
  name: string;
  w: number;
  h: number;
}

interface PageData {
  pageIdx: number;
  ptW: number;
  ptH: number;
  pxW: number;
  pxH: number;
  textEdits: any[];
}

const rgbToHex = (rgbStr?: string, fallback: string = "#000000") => {
  if (!rgbStr) return fallback;
  if (rgbStr.startsWith("#")) return rgbStr;
  const m = rgbStr.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (m) {
    const r = parseInt(m[1]).toString(16).padStart(2, "0");
    const g = parseInt(m[2]).toString(16).padStart(2, "0");
    const b = parseInt(m[3]).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }
  return fallback;
};

export function PdfEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState<PageData[]>([]);
  const [edits, setEdits] = useState<EditItem[]>([]);
  const [activeTool, setActiveTool] = useState<"none" | "text" | "redact" | "image">("none");
  const [textSize, setTextSize] = useState<number>(14);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Image insertion library
  const [imageLibrary, setImageLibrary] = useState<Record<string, ImageLibraryItem>>({});
  const [currentImageId, setCurrentImageId] = useState<string | null>(null);
  const imageCounterRef = useRef(0);

  // Drawing state (for redact/image drag placements)
  const [drawing, setDrawing] = useState<{
    pageIdx: number;
    startX: number;
    startY: number;
    tool: "redact" | "image";
  } | null>(null);
  const [drawRect, setDrawRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Inline text editing state
  const [activeIte, setActiveIte] = useState<{
    id: string;
    entry: any;
    pageIdx: number;
    value: string;
    x: number;
    y: number;
    w: number;
    isBold?: boolean;
    isItalic?: boolean;
    cssColor?: string;
    cssBgColor?: string;
  } | null>(null);

  // Text modal placement state
  const [pendingPos, setPendingPos] = useState<{ pageIdx: number; x: number; y: number } | null>(null);
  const [newTextVal, setNewTextVal] = useState("");
  const [showTextModal, setShowTextModal] = useState(false);

  // References
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileReaderRef = useRef<FileReader | null>(null);
  const canvasRefs = useRef<Record<string, HTMLCanvasElement>>({});
  const fileBytesRef = useRef<ArrayBuffer | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      loadPdf(e.target.files[0]);
    }
  };

  const loadPdf = async (targetFile: File) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setEdits([]);
    setPages([]);
    canvasRefs.current = {};
    setActiveIte(null);

    try {
      const arrayBuffer = await targetFile.arrayBuffer();
      fileBytesRef.current = arrayBuffer;
      setFile(targetFile);

      // Parse with PDF.js
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
      const pagesList: PageData[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const renderScale = 1.5;
        const viewport = page.getViewport({ scale: renderScale });

        const ptW = page.view[2] - page.view[0];
        const ptH = page.view[3] - page.view[1];
        const pxW = Math.floor(viewport.width);
        const pxH = Math.floor(viewport.height);

        // Extract text layer items
        let textItems: any[] = [];
        let fontMap: Record<string, any> = {};
        try {
          const tc = await page.getTextContent({ includeMarkedContent: false });
          textItems = tc.items || [];
          fontMap = tc.styles || {};
        } catch (e) {
          console.warn("Could not read text content layers", e);
        }

        const pageTextEdits: any[] = [];
        textItems.forEach((item: any, itemIdx: number) => {
          if (!item.str || !item.str.trim()) return;

          const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
          const fontHeight = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);
          const spanX = tx[4];
          const spanY = tx[5] - fontHeight;
          const spanW = item.width * renderScale;

          const styleInfo = fontMap[item.fontName] || {};
          const isBold = !!(
            styleInfo.bold ||
            /bold|heavy|black|semibold|medium|w700|w800/i.test(item.fontName || "") ||
            /bold/i.test(styleInfo.fontFamily || "")
          );
          const isItalic = !!(styleInfo.italic || /italic|oblique/i.test(item.fontName || ""));
          const cssFontFamily = styleInfo.fontFamily || "serif";

          // Base styling
          const entry = {
            id: `entry_${i - 1}_${itemIdx}`,
            item,
            originalStr: item.str,
            fontHeight,
            x: spanX,
            y: spanY,
            w: spanW,
            pageIdx: i - 1,
            isBold,
            isItalic,
            cssFontFamily,
            cssColor: "#000000",
            cssBgColor: "#ffffff",
            fontName: item.fontName || "",
          };
          pageTextEdits.push(entry);
        });

        pagesList.push({
          pageIdx: i - 1,
          ptW,
          ptH,
          pxW,
          pxH,
          textEdits: pageTextEdits,
        });
      }

      setPages(pagesList);

      // Render individual pages on frame tick
      setTimeout(() => {
        pagesList.forEach(async (p) => {
          const canvas = canvasRefs.current[`canvas_${p.pageIdx}`];
          if (!canvas) return;
          const page = await pdf.getPage(p.pageIdx + 1);
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          const renderScale = 1.5;
          const viewport = page.getViewport({ scale: renderScale });
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, p.pxW, p.pxH);

          await page.render({ canvasContext: ctx, viewport } as any).promise;

          // Attempt to analyze rendered text colors and backgrounds from pixel samples
          p.textEdits.forEach((entry) => {
            try {
              // 1. Sample background color at several locations around the text bounding box (just outside)
              const bgSamples = [
                { x: entry.x - 3, y: entry.y + entry.fontHeight * 0.5 },
                { x: entry.x + entry.w + 3, y: entry.y + entry.fontHeight * 0.5 },
                { x: entry.x + entry.w * 0.5, y: entry.y - 3 },
                { x: entry.x + entry.w * 0.5, y: entry.y + entry.fontHeight + 3 }
              ];
              
              let bgR = 255, bgG = 255, bgB = 255;
              let validBgCount = 0;
              let sumR = 0, sumG = 0, sumB = 0;
              
              bgSamples.forEach((pt) => {
                const sx = Math.min(Math.max(0, Math.round(pt.x)), p.pxW - 1);
                const sy = Math.min(Math.max(0, Math.round(pt.y)), p.pxH - 1);
                const px = ctx.getImageData(sx, sy, 1, 1).data;
                sumR += px[0];
                sumG += px[1];
                sumB += px[2];
                validBgCount++;
              });
              
              if (validBgCount > 0) {
                bgR = Math.round(sumR / validBgCount);
                bgG = Math.round(sumG / validBgCount);
                bgB = Math.round(sumB / validBgCount);
                entry.cssBgColor = `rgb(${bgR},${bgG},${bgB})`;
              }

              // 2. Sample foreground (text) color by finding the pixel inside the box with max contrast to the background
              const fgSamplePoints = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
              let bestFg = [0, 0, 0];
              let maxDistSq = -1;
              
              fgSamplePoints.forEach((frac) => {
                const sx = Math.min(Math.max(0, Math.round(entry.x + entry.w * frac)), p.pxW - 1);
                // Sample at 3 different vertical levels inside the text line
                [0.3, 0.5, 0.7].forEach((yFrac) => {
                  const sy = Math.min(Math.max(0, Math.round(entry.y + entry.fontHeight * yFrac)), p.pxH - 1);
                  const px = ctx.getImageData(sx, sy, 1, 1).data;
                  const distSq = Math.pow(px[0] - bgR, 2) + Math.pow(px[1] - bgG, 2) + Math.pow(px[2] - bgB, 2);
                  if (distSq > maxDistSq) {
                    maxDistSq = distSq;
                    bestFg = [px[0], px[1], px[2]];
                  }
                });
              });

              // Only set text color if we found a high contrast pixel, otherwise default to black/white contrast
              if (maxDistSq > 300) {
                entry.cssColor = `rgb(${bestFg[0]},${bestFg[1]},${bestFg[2]})`;
              } else {
                // Default high contrast color
                const bgBrightness = (bgR + bgG + bgB) / 3;
                entry.cssColor = bgBrightness > 127 ? "rgb(0,0,0)" : "rgb(255,255,255)";
              }
            } catch (colorErr) {
              // Fail-safe color sampling
            }
          });
        });
      }, 50);

      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Error parsing PDF document. Check security permissions or format integrity.");
    } finally {
      setLoading(false);
    }
  };

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>, pageIdx: number) => {
    if (activeTool !== "text") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPendingPos({ pageIdx, x, y });
    setNewTextVal("");
    setShowTextModal(true);
  };

  const handleTextModalConfirm = () => {
    if (!newTextVal.trim() || !pendingPos) {
      setShowTextModal(false);
      return;
    }

    const newEdit: EditItem = {
      id: Math.random().toString(36).slice(2, 9),
      type: "text",
      pageIdx: pendingPos.pageIdx,
      xPx: pendingPos.x,
      yPx: pendingPos.y,
      text: newTextVal,
      size: textSize,
    };

    setEdits((prev) => [...prev, newEdit]);
    setShowTextModal(false);
    setPendingPos(null);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, pageIdx: number) => {
    if (activeTool !== "redact" && activeTool !== "image") return;
    if (activeTool === "image" && !currentImageId) {
      setError("Please choose or select a stamp image in the panel first.");
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDrawing({
      pageIdx,
      startX: x,
      startY: y,
      tool: activeTool,
    });
    setDrawRect({ x, y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!drawing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const x = Math.min(currentX, drawing.startX);
    const y = Math.min(currentY, drawing.startY);
    const w = Math.abs(currentX - drawing.startX);
    const h = Math.abs(currentY - drawing.startY);

    setDrawRect({ x, y, w, h });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!drawing || !drawRect) return;

    if (drawRect.w > 3 && drawRect.h > 3) {
      const newEdit: EditItem = {
        id: Math.random().toString(36).slice(2, 9),
        type: drawing.tool,
        pageIdx: drawing.pageIdx,
        xPx: drawRect.x,
        yPx: drawRect.y,
        wPx: drawRect.w,
        hPx: drawRect.h,
        imageId: drawing.tool === "image" ? currentImageId || undefined : undefined,
      };
      setEdits((prev) => [...prev, newEdit]);
    }

    setDrawing(null);
    setDrawRect(null);
  };

  const handleOpenInlineEditor = (entry: any) => {
    setActiveIte({
      id: entry.id,
      entry,
      pageIdx: entry.pageIdx,
      value: entry.item.str,
      x: entry.x,
      y: entry.y,
      w: entry.w,
      isBold: entry.isBold,
      isItalic: entry.isItalic,
      cssColor: entry.cssColor || "#000000",
      cssBgColor: entry.cssBgColor || "#ffffff",
    });
  };

  const handleInlineConfirm = () => {
    if (!activeIte) return;

    // Check if we already have an edit for this specific text entry ID
    setEdits((prev) => {
      const filtered = prev.filter((ed) => ed.id !== activeIte.id);
      if (activeIte.value === activeIte.entry.originalStr) {
        return filtered; // If set back to original, just remove edit
      }
      const replEdit: EditItem = {
        id: activeIte.id,
        type: "replace",
        pageIdx: activeIte.pageIdx,
        originalStr: activeIte.entry.originalStr,
        newStr: activeIte.value,
        xPx: activeIte.x,
        yPx: activeIte.y,
        wPx: Math.max(activeIte.w, 10),
        hPx: activeIte.entry.fontHeight + 4,
        fontHeight: activeIte.entry.fontHeight,
        cssColor: activeIte.cssColor !== undefined ? activeIte.cssColor : (activeIte.entry.cssColor || "#000000"),
        cssBgColor: activeIte.cssBgColor !== undefined ? activeIte.cssBgColor : (activeIte.entry.cssBgColor || "#ffffff"),
        cssFontFamily: activeIte.entry.cssFontFamily,
        isBold: activeIte.isBold !== undefined ? activeIte.isBold : activeIte.entry.isBold,
        isItalic: activeIte.isItalic !== undefined ? activeIte.isItalic : activeIte.entry.isItalic,
        fontName: activeIte.entry.fontName,
        item: activeIte.entry.item,
      };
      return [...filtered, replEdit];
    });

    setActiveIte(null);
  };

  const handleImagePick = () => {
    imageInputRef.current?.click();
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const fileObj = e.target.files[0];
      if (!/^image\/(png|jpe?g)$/i.test(fileObj.type)) {
        setError("Only PNG and JPEG formats are supported for image stamps.");
        return;
      }

      try {
        const bytes = await fileObj.arrayBuffer();
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(fileObj);
        });

        // Natural dimension check
        const dims = await new Promise<{ w: number; h: number }>((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
          img.src = dataUrl;
        });

        const kind = /png/i.test(fileObj.type) ? "png" : "jpg";
        imageCounterRef.current += 1;
        const id = `stamp_img_${imageCounterRef.current}`;

        const newLibraryItem: ImageLibraryItem = {
          id,
          dataUrl,
          bytes,
          kind,
          name: fileObj.name,
          w: dims.w,
          h: dims.h,
        };

        setImageLibrary((prev) => ({ ...prev, [id]: newLibraryItem }));
        setCurrentImageId(id);
        setSuccess(`Image stamp "${fileObj.name}" loaded. Draw a box to stamp it.`);
      } catch (err) {
        setError("Could not load image resource.");
      }
    }
  };

  const removeEdit = (id: string) => {
    setEdits((prev) => prev.filter((e) => e.id !== id));
  };

  const applyEditsAndDownload = async () => {
    if (!fileBytesRef.current || !file) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const pdfDoc = await PDFDocument.load(fileBytesRef.current);
      const standardFonts = {
        helvetica: {
          n: await pdfDoc.embedFont(StandardFonts.Helvetica),
          b: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
          i: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
          bi: await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique),
        },
        times: {
          n: await pdfDoc.embedFont(StandardFonts.TimesRoman),
          b: await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
          i: await pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
          bi: await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic),
        },
        courier: {
          n: await pdfDoc.embedFont(StandardFonts.Courier),
          b: await pdfDoc.embedFont(StandardFonts.CourierBold),
          i: await pdfDoc.embedFont(StandardFonts.CourierOblique),
          bi: await pdfDoc.embedFont(StandardFonts.CourierBoldOblique),
        },
      };

      // Fallback fallback
      const defaultFont = standardFonts.helvetica.n;

      const resolveFont = (isBold?: boolean, isItalic?: boolean, fontName?: string) => {
        const name = (fontName || "").toLowerCase();
        let family = standardFonts.helvetica;
        if (/times|roman|georgia|serif/i.test(name)) family = standardFonts.times;
        else if (/courier|mono|consolas/i.test(name)) family = standardFonts.courier;

        if (isBold && isItalic) return family.bi;
        if (isBold) return family.b;
        if (isItalic) return family.i;
        return family.n;
      };

      const parseColor = (colorStr?: string) => {
        if (!colorStr) return rgb(0, 0, 0);
        const rgbMatch = colorStr.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
        if (rgbMatch) {
          return rgb(parseInt(rgbMatch[1]) / 255, parseInt(rgbMatch[2]) / 255, parseInt(rgbMatch[3]) / 255);
        }
        if (colorStr.startsWith("#")) {
          const hex = colorStr.replace("#", "");
          const r = parseInt(hex.substring(0, 2), 16) || 0;
          const g = parseInt(hex.substring(2, 4), 16) || 0;
          const b = parseInt(hex.substring(4, 6), 16) || 0;
          return rgb(r / 255, g / 255, b / 255);
        }
        return rgb(0, 0, 0);
      };

      // Pre-embed used stamp images
      const embeddedImages: Record<string, any> = {};
      const uniqueImageIds = Array.from(new Set(edits.filter((e) => e.type === "image").map((e) => e.imageId)));
      for (const id of uniqueImageIds) {
        if (!id) continue;
        const libItem = imageLibrary[id as string];
        if (libItem) {
          embeddedImages[id as string] = libItem.kind === "png"
            ? await pdfDoc.embedPng(libItem.bytes)
            : await pdfDoc.embedJpg(libItem.bytes);
        }
      }

      const pdfPages = pdfDoc.getPages();

      for (const edit of edits) {
        const page = pdfPages[edit.pageIdx];
        const pageMeta = pages[edit.pageIdx];
        if (!page || !pageMeta) continue;

        const { width: pdfW, height: pdfH } = page.getSize();
        const scaleX = pdfW / pageMeta.pxW;
        const scaleY = pdfH / pageMeta.pxH;

        if (edit.type === "replace" && edit.item) {
          // Replace text by whitening out original bounds and overlaying new string
          const tx = edit.item.transform;
          const fs = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]) || Math.abs(tx[3]) || 12;
          const originX = tx[4];
          const originY = tx[5];
          const textWidth = edit.item.width || (edit.wPx! * scaleX);

          const descent = fs * 0.28;
          const ascent = fs * 0.88;
          const rectH = ascent + descent + 3;
          const rectY = originY - descent - 1;
          const coverW = Math.max(textWidth + 8, 12);

          // White background block
          const bgCol = parseColor(edit.cssBgColor || "rgb(255,255,255)");
          page.drawRectangle({
            x: originX - 2,
            y: rectY,
            width: coverW,
            height: rectH,
            color: bgCol,
          });

          // Overlay new text
          const targetFont = resolveFont(edit.isBold, edit.isItalic, edit.fontName);
          const fontColor = parseColor(edit.cssColor);
          const lines = (edit.newStr || "").split(/\r?\n/);
          lines.forEach((line, lineIdx) => {
            if (!line) return;
            page.drawText(line, {
              x: originX,
              y: originY - lineIdx * fs * 1.2,
              size: Math.max(4, fs),
              font: targetFont,
              color: fontColor,
            });
          });
        } else if (edit.type === "redact") {
          const x = edit.xPx * scaleX;
          const w = edit.wPx! * scaleX;
          const h = edit.hPx! * scaleY;
          const yTop = edit.yPx * scaleY;
          const yBot = pdfH - yTop - h;

          page.drawRectangle({
            x,
            y: yBot,
            width: w,
            height: h,
            color: rgb(1, 1, 1),
          });
        } else if (edit.type === "text" && edit.text) {
          const x = edit.xPx * scaleX;
          const yTop = edit.yPx * scaleY;
          const sizePdf = edit.size || 14;
          const yBot = pdfH - yTop - sizePdf * 0.9;

          const lines = edit.text.split(/\r?\n/);
          lines.forEach((line, lineIdx) => {
            page.drawText(line, {
              x,
              y: yBot - lineIdx * sizePdf * 1.2,
              size: sizePdf,
              font: defaultFont,
              color: rgb(0, 0, 0),
            });
          });
        } else if (edit.type === "image" && edit.imageId) {
          const embedded = embeddedImages[edit.imageId];
          if (embedded) {
            const x = edit.xPx * scaleX;
            const w = edit.wPx! * scaleX;
            const h = edit.hPx! * scaleY;
            const yTop = edit.yPx * scaleY;
            const yBot = pdfH - yTop - h;

            page.drawImage(embedded, {
              x,
              y: yBot,
              width: w,
              height: h,
            });
          }
        }
      }

      const modifiedBytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([modifiedBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = file.name.replace(/\.pdf$/i, "") + "_edited.pdf";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();

      setSuccess(`Successfully compiled all (${edits.length}) annotative layers!`);
    } catch (saveErr: any) {
      console.error(saveErr);
      setError("An error occurred while compiling modified layers: " + (saveErr?.message || "Verify document compatibility."));
    } finally {
      setLoading(false);
    }
  };

  const clearWorkspace = () => {
    setFile(null);
    setPages([]);
    setEdits([]);
    setError(null);
    setSuccess(null);
    setActiveIte(null);
    setImageLibrary({});
    setCurrentImageId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left Side: Controller / Workspace Sidebar */}
        <div className="w-full xl:w-80 shrink-0 space-y-5">
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl space-y-6">
            <div className="border-b border-neutral-800 pb-3 flex justify-between items-center">
              <span className="text-xs font-mono text-lime-400 font-bold uppercase tracking-widest">// Toolbar settings</span>
              {file && (
                <button
                  onClick={clearWorkspace}
                  className="text-[10px] text-neutral-500 hover:text-neutral-300 uppercase font-mono tracking-wider transition"
                >
                  Clear File
                </button>
              )}
            </div>

            {!file ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-800 hover:border-lime-400 bg-neutral-950/40 p-8 rounded-md text-center cursor-pointer transition relative"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <FileText className="mx-auto text-lime-400 mb-2 h-10 w-10 animate-pulse" />
                <span className="block font-bold text-sm text-neutral-200">Load PDF Document</span>
                <span className="block text-[10px] text-neutral-500 mt-1.5 uppercase font-mono leading-relaxed">
                  Extracts text layer cleanly for local edits
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Active Tool selection */}
                <div className="space-y-2">
                  <span className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Select Edit Tool</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setActiveTool("none");
                        setActiveIte(null);
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded border text-center transition cursor-pointer ${
                        activeTool === "none"
                          ? "bg-lime-400 border-lime-400 text-black font-bold"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <FileText className="h-4 w-4 mb-1" />
                      <span className="text-[10px] uppercase tracking-wider font-mono">Edit Text</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTool("text");
                        setActiveIte(null);
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded border text-center transition cursor-pointer ${
                        activeTool === "text"
                          ? "bg-lime-400 border-lime-400 text-black font-bold"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <Type className="h-4 w-4 mb-1" />
                      <span className="text-[10px] uppercase tracking-wider font-mono">Add Text</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTool("redact");
                        setActiveIte(null);
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded border text-center transition cursor-pointer ${
                        activeTool === "redact"
                          ? "bg-lime-400 border-lime-400 text-black font-bold"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <Square className="h-4 w-4 mb-1" />
                      <span className="text-[10px] uppercase tracking-wider font-mono">Whiteout</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTool("image");
                        setActiveIte(null);
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded border text-center transition cursor-pointer ${
                        activeTool === "image"
                          ? "bg-lime-400 border-lime-400 text-black font-bold"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <ImageIcon className="h-4 w-4 mb-1" />
                      <span className="text-[10px] uppercase tracking-wider font-mono">Image Stamp</span>
                    </button>
                  </div>
                </div>

                {/* Additional Tool Options */}
                {activeTool === "text" && (
                  <div className="space-y-1.5 p-3 bg-neutral-950 border border-neutral-800 rounded">
                    <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400 uppercase">
                      <span>Font Size</span>
                      <span className="text-lime-400 font-bold">{textSize} px</span>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="48"
                      value={textSize}
                      onChange={(e) => setTextSize(parseInt(e.target.value))}
                      className="w-full accent-lime-400"
                    />
                  </div>
                )}

                {activeTool === "image" && (
                  <div className="space-y-2 p-3 bg-neutral-950 border border-neutral-800 rounded">
                    <span className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1">
                      Load PNG/JPG Stamp
                    </span>
                    <input
                      type="file"
                      ref={imageInputRef}
                      accept="image/png, image/jpeg"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    <button
                      onClick={handleImagePick}
                      className="w-full py-1.5 bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 text-neutral-300 rounded font-mono text-[10px] uppercase transition cursor-pointer"
                    >
                      Choose Stamp Image
                    </button>
                    {currentImageId && imageLibrary[currentImageId] && (
                      <div className="text-[9px] font-mono text-lime-400 truncate mt-1">
                        Selected: {imageLibrary[currentImageId].name}
                      </div>
                    )}
                  </div>
                )}

                {/* Edits Queue */}
                <div className="space-y-2 pt-2 border-t border-neutral-800">
                  <span className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">
                    Modifications log ({edits.length})
                  </span>
                  {edits.length === 0 ? (
                    <span className="block text-[10px] font-mono text-neutral-500 italic uppercase">
                      Awaiting workspace interactions...
                    </span>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {edits.map((e) => (
                        <div
                          key={e.id}
                          className="flex items-center justify-between text-[10px] bg-neutral-950 px-2.5 py-1.5 border border-neutral-850 rounded"
                        >
                          <div className="truncate text-neutral-300">
                            <span className="font-mono text-neutral-500 mr-1.5">P{e.pageIdx + 1}</span>
                            {e.type === "replace" && `✏️ "${e.originalStr?.slice(0, 8)}..." → "${e.newStr?.slice(0, 8)}"`}
                            {e.type === "text" && `＋ Add "${e.text?.slice(0, 10)}..."`}
                            {e.type === "redact" && `⬜ Whiteout block`}
                            {e.type === "image" && `🖼️ Stamp image`}
                          </div>
                          <button
                            onClick={() => removeEdit(e.id)}
                            className="p-0.5 text-neutral-500 hover:text-red-400 transition"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    onClick={applyEditsAndDownload}
                    disabled={loading}
                    className="w-full font-mono font-bold text-xs uppercase tracking-wider py-3 px-4 rounded bg-lime-400 hover:bg-lime-500 text-black transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-45"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-black" />
                        Compiling edits...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Apply & Download PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Informational Tip Box */}
          <div className="p-4 bg-neutral-950 border border-neutral-850 rounded-xl text-xs text-neutral-400 leading-relaxed">
            <HelpCircle className="h-4 w-4 text-lime-400 mb-2" />
            <span className="font-bold block text-neutral-200 mb-1">Local Sandboxed Processing</span>
            <p>
              Your files never traverse external servers. Redactions, text adjustments, and image placements take place
              entirely inside your browser stack.
            </p>
          </div>
        </div>

        {/* Right Side: Interactive Rendering Canvas Grid */}
        <div className="flex-grow min-w-0 space-y-6">
          {error && (
            <div className="bg-red-950/40 border border-red-900 text-red-200 p-4 rounded text-xs flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block uppercase tracking-wider mb-1">Interactive Editor Error</span>
                {error}
              </div>
            </div>
          )}

          {success && (
            <div className="bg-emerald-950/40 border border-emerald-900 text-emerald-200 p-4 rounded text-xs flex items-start gap-2.5">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block uppercase tracking-wider mb-1">Compilation Success</span>
                {success}
              </div>
            </div>
          )}

          {!file ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-16 text-center text-neutral-500 font-mono text-xs uppercase tracking-wider space-y-2">
              <FileText className="mx-auto h-8 w-8 text-neutral-700 animate-pulse" />
              <span>Awaiting input document load...</span>
            </div>
          ) : (
            <div className="space-y-8 flex flex-col items-center">
              {pages.map((p) => {
                const isDrawingThisPage = drawing && drawing.pageIdx === p.pageIdx;

                return (
                  <div
                    key={p.pageIdx}
                    className="relative bg-white shadow-xl rounded border border-neutral-800 cursor-crosshair group select-none"
                    style={{
                      width: p.pxW,
                      height: p.pxH,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, p.pageIdx)}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onClick={(e) => handlePageClick(e, p.pageIdx)}
                  >
                    {/* Header bar */}
                    <div className="absolute top-[-26px] left-0 right-0 flex justify-between text-[10px] font-mono text-neutral-400 uppercase tracking-wider px-1">
                      <span>Page {p.pageIdx + 1} / {pages.length}</span>
                      <span>{Math.round(p.ptW)} × {Math.round(p.ptH)} pt</span>
                    </div>

                    {/* Render Canvas */}
                    <canvas
                      ref={(el) => {
                        if (el) canvasRefs.current[`canvas_${p.pageIdx}`] = el;
                      }}
                      width={p.pxW}
                      height={p.pxH}
                      className="block rounded"
                    />

                    {/* Interactive Annotation Overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Interactive click-to-edit elements */}
                      {activeTool === "none" &&
                        p.textEdits.map((entry) => {
                          const isCurrentlyReplaced = edits.some((e) => e.id === entry.id);
                          if (isCurrentlyReplaced) return null;

                          return (
                            <div
                              key={entry.id}
                              className="absolute hover:bg-lime-400/20 hover:ring-1 hover:ring-lime-400 pointer-events-auto cursor-text rounded-sm transition-all"
                              style={{
                                left: entry.x,
                                top: entry.y,
                                width: Math.max(entry.w, 4),
                                height: entry.fontHeight + 4,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenInlineEditor(entry);
                              }}
                              title={`Click to edit text: "${entry.originalStr}"`}
                            />
                          );
                        })}

                      {/* Display active edits on the canvas */}
                      {edits
                        .filter((e) => e.pageIdx === p.pageIdx)
                        .map((e) => {
                          if (e.type === "replace") {
                            // Cover box using background color
                            const style: React.CSSProperties = {
                              position: "absolute",
                              left: e.xPx,
                              top: e.yPx,
                              minWidth: e.wPx,
                              height: e.hPx,
                              backgroundColor: e.cssBgColor || "#ffffff",
                              zIndex: 10,
                            };

                            // Overlay text
                            const textStyle: React.CSSProperties = {
                              position: "absolute",
                              left: e.xPx,
                              top: e.yPx,
                              fontSize: e.fontHeight,
                              fontFamily: e.cssFontFamily || "serif",
                              fontWeight: e.isBold ? "bold" : "normal",
                              fontStyle: e.isItalic ? "italic" : "normal",
                              color: e.cssColor || "#000",
                              lineHeight: 1.15,
                              whiteSpace: "pre",
                              zIndex: 11,
                              cursor: "text",
                              pointerEvents: "auto",
                            };

                            return (
                              <React.Fragment key={e.id}>
                                <div style={style} />
                                <div
                                  style={textStyle}
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    // Re-open inline editor
                                    setActiveIte({
                                      id: e.id,
                                      entry: e.entry || e,
                                      pageIdx: e.pageIdx,
                                      value: e.newStr || "",
                                      x: e.xPx,
                                      y: e.yPx,
                                      w: e.wPx || 10,
                                      isBold: e.isBold,
                                      isItalic: e.isItalic,
                                      cssColor: e.cssColor || "#000000",
                                      cssBgColor: e.cssBgColor || "#ffffff",
                                    });
                                  }}
                                  title="Click to re-edit modified text"
                                >
                                  {e.newStr}
                                </div>
                              </React.Fragment>
                            );
                          }

                          if (e.type === "redact") {
                            return (
                              <div
                                key={e.id}
                                className="absolute bg-white border border-neutral-300 shadow-sm"
                                style={{
                                  left: e.xPx,
                                  top: e.yPx,
                                  width: e.wPx,
                                  height: e.hPx,
                                  zIndex: 12,
                                }}
                              />
                            );
                          }

                          if (e.type === "text") {
                            return (
                              <div
                                key={e.id}
                                className="absolute text-black font-sans bg-lime-400/10 px-1 py-0.5 rounded border border-dashed border-lime-400/40"
                                style={{
                                  left: e.xPx,
                                  top: e.yPx,
                                  fontSize: e.size,
                                  lineHeight: 1.1,
                                  zIndex: 12,
                                }}
                              >
                                {e.text}
                              </div>
                            );
                          }

                          if (e.type === "image" && e.imageId && imageLibrary[e.imageId]) {
                            return (
                              <div
                                key={e.id}
                                className="absolute bg-contain bg-no-repeat bg-center border border-dashed border-lime-500/50"
                                style={{
                                  left: e.xPx,
                                  top: e.yPx,
                                  width: e.wPx,
                                  height: e.hPx,
                                  backgroundImage: `url("${imageLibrary[e.imageId].dataUrl}")`,
                                  zIndex: 12,
                                }}
                              />
                            );
                          }

                          return null;
                        })}

                      {/* Active Drawing/Drag Rect Preview */}
                      {isDrawingThisPage && drawRect && (
                        <div
                          className="absolute border border-dashed border-lime-400 bg-lime-400/15"
                          style={{
                            left: drawRect.x,
                            top: drawRect.y,
                            width: drawRect.w,
                            height: drawRect.h,
                            zIndex: 100,
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* INLINE TEXT EDITOR ELEMENT POPUP */}
      {activeIte && (
        <div
          className="fixed z-[500] bg-neutral-900 border border-neutral-800 rounded-lg p-3 shadow-2xl space-y-3"
          style={{
            // Compute dynamic coordinate offset cleanly to position below selection
            left: "50%",
            top: "40%",
            transform: "translate(-50%, -50%)",
            minWidth: "300px",
            maxWidth: "90%",
          }}
        >
          <div className="text-[10px] font-mono text-lime-400 uppercase tracking-widest border-b border-neutral-850 pb-1.5 flex justify-between items-center">
            <span>Edit PDF Text Layer</span>
            <span className="text-[8px] bg-neutral-950 px-1.5 py-0.5 rounded text-neutral-500">
              ORIGINAL: "{activeIte.entry.originalStr?.slice(0, 15)}"
            </span>
          </div>

          <textarea
            value={activeIte.value}
            onChange={(e) => setActiveIte({ ...activeIte, value: e.target.value })}
            className="w-full h-24 bg-neutral-950 border border-neutral-800 text-neutral-100 p-2.5 rounded font-mono text-xs focus:outline-none focus:border-lime-400 resize-none"
            spellCheck={false}
          />

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setActiveIte(null)}
              className="px-3 py-1.5 rounded border border-neutral-800 text-neutral-400 hover:text-neutral-200 font-mono text-[10px] uppercase transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleInlineConfirm}
              className="px-3 py-1.5 rounded bg-lime-400 text-black font-mono text-[10px] font-bold uppercase hover:bg-lime-500 transition cursor-pointer"
            >
              Save Change
            </button>
          </div>
        </div>
      )}

      {/* TEXT PLACEMENT MODAL */}
      {showTextModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="border-b border-neutral-800 pb-2">
              <span className="text-xs font-mono text-lime-400 font-bold uppercase tracking-widest">// Add new text</span>
            </div>

            <textarea
              placeholder="Enter text to place..."
              value={newTextVal}
              onChange={(e) => setNewTextVal(e.target.value)}
              className="w-full h-24 bg-neutral-950 border border-neutral-800 text-neutral-100 p-3 rounded text-xs focus:outline-none focus:border-lime-400 resize-none"
            />

            <div className="flex gap-2 justify-end pt-2 border-t border-neutral-800">
              <button
                onClick={() => {
                  setShowTextModal(false);
                  setPendingPos(null);
                }}
                className="px-3 py-1.5 rounded border border-neutral-800 text-neutral-400 hover:text-neutral-200 font-mono text-[10px] uppercase transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleTextModalConfirm}
                className="px-4 py-1.5 rounded bg-lime-400 text-black font-mono text-[10px] font-bold uppercase hover:bg-lime-500 transition cursor-pointer"
              >
                Confirm Placement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
