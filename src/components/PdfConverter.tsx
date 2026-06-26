/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as XLSX from "xlsx";
import * as mammoth from "mammoth";
import {
  Image as ImageIcon,
  FileText,
  FileSpreadsheet,
  Mail,
  FilePlus,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2
} from "lucide-react";

type ConverterType = "image" | "text" | "csv" | "eml" | "excel" | "word";

interface ImageFile {
  id: string;
  file: File;
  name: string;
  size: number;
  url: string;
  excluded: boolean;
}

export function PdfConverter() {
  const [activeSubTab, setActiveSubTab] = useState<ConverterType>("image");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [outputBlobUrl, setOutputBlobUrl] = useState<string | null>(null);
  const [outputSize, setOutputSize] = useState<number>(0);
  const [outputFileName, setOutputSizeFileName] = useState("");

  // Options
  const [pageSize, setPageSize] = useState<"A4" | "letter" | "A3" | "fit">("A4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape" | "auto">("portrait");
  const [fitMode, setFitMode] = useState<"contain" | "fill" | "actual">("contain");
  const [fontSize, setFontSize] = useState<number>(11);
  const [margin, setMargin] = useState<number>(40);

  // 1. Image state
  const [images, setImages] = useState<ImageFile[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // 2. Text / HTML state
  const [textContent, setTextContent] = useState("");
  const textInputRef = useRef<HTMLInputElement>(null);

  // 3. CSV state
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [csvFileName, setCsvFileName] = useState("");

  // 4. Email state
  const [emlData, setEmlData] = useState<{
    from: string;
    to: string;
    cc: string;
    date: string;
    subject: string;
    body: string;
    attachments: string[];
  } | null>(null);
  const [emlFileName, setEmlFileName] = useState("");
  const [emlSections, setEmlSections] = useState({
    headers: true,
    body: true,
    attachments: true,
  });

  // 5. Excel state
  const [excelSheets, setExcelSheets] = useState<string[]>([]);
  const [excelActiveSheet, setExcelActiveSheet] = useState<string>("");
  const [excelSheetRows, setExcelSheetRows] = useState<Record<string, any[][]>>({});
  const [excelFileName, setExcelFileName] = useState("");
  const [selectedSheets, setSelectedSheets] = useState<Record<string, boolean>>({});

  // 6. Word (docx) state
  const [docxHtml, setDocxHtml] = useState("");
  const [docxText, setDocxText] = useState("");
  const [docxFileName, setDocxFileName] = useState("");
  const [docxStats, setDocxStats] = useState({ words: 0, size: 0 });

  // Helpers
  const formatBytes = (b: number) => {
    if (b < 1024) return b + " B";
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
    return (b / (1024 * 1024)).toFixed(2) + " MB";
  };

  const getPageDimensions = (sizeKey: "A4" | "letter" | "A3" | "fit", orient: "portrait" | "landscape" | "auto") => {
    const baseSizes = {
      A4: { w: 595.28, h: 841.89 },
      letter: { w: 612, h: 792 },
      A3: { w: 841.89, h: 1190.55 },
      fit: { w: 595.28, h: 841.89 }, // Fallback, handled individually
    };
    const s = sizes[sizeKey as keyof typeof sizes] || sizes.A4;
    if (orient === "landscape") {
      return { w: s.h, h: s.w };
    }
    return { w: s.w, h: s.h };
  };

  const sizes: Record<string, { w: number; h: number }> = {
    A4: { w: 595.28, h: 841.89 },
    letter: { w: 612, h: 792 },
    A3: { w: 841.89, h: 1190.55 },
  };

  const resetAllOutputs = () => {
    setCompressedBlobUrl(null);
    setError(null);
  };

  const setCompressedBlobUrl = (url: string | null) => {
    setMergedBlobUrl(url);
  };

  const [mergedBlobUrl, setMergedBlobUrl] = useState<string | null>(null);
  const [mergedSize, setMergedSize] = useState<number>(0);

  /* ═════════════════════════════════════════════
     A. IMAGE TO PDF
     ═════════════════════════════════════════════ */
  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const list: ImageFile[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        list.push({
          id: Math.random().toString(36).slice(2, 9),
          file,
          name: file.name,
          size: file.size,
          url: URL.createObjectURL(file),
          excluded: false,
        });
      }
      setImages((prev) => [...prev, ...list]);
      resetAllOutputs();
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((im) => im.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((im) => im.id !== id);
    });
    resetAllOutputs();
  };

  const toggleImageExclude = (id: string) => {
    setImages((prev) =>
      prev.map((im) => (im.id === id ? { ...im, excluded: !im.excluded } : im))
    );
    resetAllOutputs();
  };

  const convertImagesToPdf = async () => {
    const activeImages = images.filter((im) => !im.excluded);
    if (!activeImages.length) {
      setError("Please add at least one active image to convert.");
      return;
    }

    setLoading(true);
    setError(null);
    setMergedBlobUrl(null);

    try {
      const pdfDoc = await PDFDocument.create();

      for (let i = 0; i < activeImages.length; i++) {
        const item = activeImages[i];
        const buf = await item.file.arrayBuffer();
        const mime = item.file.type.toLowerCase();

        let img;
        if (mime.includes("png")) {
          img = await pdfDoc.embedPng(buf);
        } else {
          // Attempt jpeg embed, or use canvas fallback for gif/webp/etc
          try {
            img = await pdfDoc.embedJpg(buf);
          } catch (e) {
            const bmp = await createImageBitmap(item.file);
            const canvas = document.createElement("canvas");
            canvas.width = bmp.width;
            canvas.height = bmp.height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(bmp, 0, 0);
            const jpegBlob = await new Promise<Blob | null>((res) =>
              canvas.toBlob(res, "image/jpeg", 0.9)
            );
            if (!jpegBlob) throw new Error("Could not decode raster image asset.");
            const jpegBytes = await jpegBlob.arrayBuffer();
            img = await pdfDoc.embedJpg(jpegBytes);
          }
        }

        const iw = img.width;
        const ih = img.height;

        let pd = getPageDimensions(pageSize, orientation === "auto" ? "portrait" : orientation);
        if (pageSize === "fit") {
          pd = { w: iw, h: ih };
        } else if (orientation === "auto") {
          pd = getPageDimensions(pageSize, iw > ih ? "landscape" : "portrait");
        }

        const page = pdfDoc.addPage([pd.w, pd.h]);
        let dx = 0;
        let dy = 0;
        let dw = pd.w;
        let dh = pd.h;

        if (fitMode === "contain") {
          const scale = Math.min(pd.w / iw, pd.h / ih);
          dw = iw * scale;
          dh = ih * scale;
          dx = (pd.w - dw) / 2;
          dy = (pd.h - dh) / 2;
        } else if (fitMode === "actual") {
          dw = iw;
          dh = ih;
          dx = (pd.w - iw) / 2;
          dy = (pd.h - ih) / 2;
        }

        page.drawImage(img, { x: dx, y: dy, width: dw, height: dh });
      }

      const bytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([bytes], { type: "application/pdf" });
      setMergedBlobUrl(URL.createObjectURL(blob));
      setMergedSize(blob.size);
      setOutputSizeFileName("kee2solv_images_compiled.pdf");
      setSuccess(`Successfully converted ${activeImages.length} images to A4-compliant PDF!`);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Error bundling images into standard PDF container.");
    } finally {
      setLoading(false);
    }
  };

  /* ═════════════════════════════════════════════
     B. TEXT / HTML TO PDF
     ═════════════════════════════════════════════ */
  const handleTextFileLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const text = await file.text();
      setTextContent(text);
      resetAllOutputs();
    }
  };

  const convertTextToPdf = async () => {
    if (!textContent.trim()) {
      setError("Please load a text file or paste some characters first.");
      return;
    }

    setLoading(true);
    setError(null);
    setMergedBlobUrl(null);

    try {
      let finalString = textContent;

      // HTML strip fallback if detected
      if (/<[a-zA-Z]/.test(textContent.slice(0, 300))) {
        const div = document.createElement("div");
        div.innerHTML = textContent;
        finalString = div.innerText || div.textContent || textContent;
      }

      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const pd = getPageDimensions(pageSize === "fit" ? "A4" : pageSize, "portrait");
      const usableW = pd.w - margin * 2;
      const lineH = fontSize * 1.45;

      // Visual line wrapper helper
      const wrapText = (text: string, maxW: number): string[] => {
        const words = text.split(" ");
        const resultLines: string[] = [];
        let currentLine = "";

        for (const word of words) {
          const test = currentLine ? currentLine + " " + word : word;
          if (font.widthOfTextAtSize(test, fontSize) <= maxW) {
            currentLine = test;
          } else {
            if (currentLine) resultLines.push(currentLine);
            currentLine = word;
          }
        }
        if (currentLine) resultLines.push(currentLine);
        return resultLines;
      };

      const rawParas = finalString.split(/\n/);
      const allLines = rawParas.flatMap((p) => (p.trim() === "" ? [""] : wrapText(p, usableW)));

      let page = pdfDoc.addPage([pd.w, pd.h]);
      let y = pd.h - margin;

      allLines.forEach((line) => {
        if (y - lineH < margin) {
          page = pdfDoc.addPage([pd.w, pd.h]);
          y = pd.h - margin;
        }
        if (line !== "") {
          page.drawText(line, {
            x: margin,
            y: y - fontSize,
            size: fontSize,
            font,
            color: rgb(0.1, 0.1, 0.1),
          });
        }
        y -= lineH;
      });

      const bytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([bytes], { type: "application/pdf" });
      setMergedBlobUrl(URL.createObjectURL(blob));
      setMergedSize(blob.size);
      setOutputSizeFileName("kee2solv_text_compiled.pdf");
      setSuccess("Successfully typeset plain text into formatted vector PDF pages.");
    } catch (err: any) {
      console.error(err);
      setError("Typesetting loop failed: " + err?.message);
    } finally {
      setLoading(false);
    }
  };

  /* ═════════════════════════════════════════════
     C. SPREADSHEET (CSV) TO PDF
     ═════════════════════════════════════════════ */
  const handleCsvLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCsvFileName(file.name.replace(/\.[^.]+$/, ""));
      const text = await file.text();

      const sep = text.includes("\t") ? "\t" : ",";
      const lines = text.split(/\r?\n/).filter((l) => l.trim());

      if (lines.length > 0) {
        const parseLine = (line: string): string[] => {
          const cells: string[] = [];
          let cur = "";
          let inQ = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') inQ = !inQ;
            else if (char === sep && !inQ) {
              cells.push(cur.trim());
              cur = "";
            } else {
              cur += char;
            }
          }
          cells.push(cur.trim());
          return cells;
        };

        const hd = parseLine(lines[0]);
        const bdy = lines.slice(1).map((l) => parseLine(l));
        setCsvHeaders(hd);
        setCsvRows(bdy);
        resetAllOutputs();
      }
    }
  };

  const convertCsvToPdf = async () => {
    if (!csvHeaders.length) {
      setError("Please upload or select a CSV spreadsheet first.");
      return;
    }

    setLoading(true);
    setError(null);
    setMergedBlobUrl(null);

    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontB = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const pd = getPageDimensions("A4", "landscape");
      const marginSize = 30;
      const cellPad = 5;
      const calculatedFontSize = 9;
      const rowHeight = calculatedFontSize + cellPad * 2;
      const usableW = pd.w - marginSize * 2;
      const colWidth = usableW / csvHeaders.length;

      const drawRow = (p: any, cy: number, cells: string[], isHeader: boolean) => {
        const f = isHeader ? fontB : font;
        const textCol = isHeader ? rgb(1, 1, 1) : rgb(0.1, 0.1, 0.1);

        if (isHeader) {
          p.drawRectangle({
            x: marginSize,
            y: cy - rowHeight + cellPad / 2,
            width: usableW,
            height: rowHeight,
            color: rgb(0.12, 0.12, 0.15),
          });
        }

        cells.forEach((cell, ci) => {
          const val = String(cell || "").slice(0, 30);
          const cx = marginSize + ci * colWidth + cellPad;
          const maxCW = colWidth - cellPad * 2;

          let display = val;
          while (display.length > 0 && f.widthOfTextAtSize(display, calculatedFontSize) > maxCW) {
            display = display.slice(0, -1);
          }

          p.drawText(display, {
            x: cx,
            y: cy - calculatedFontSize - cellPad / 2,
            size: calculatedFontSize,
            font: f,
            color: textCol,
          });

          // Draw vertical divider
          if (ci < cells.length - 1) {
            p.drawLine({
              start: { x: marginSize + (ci + 1) * colWidth, y: cy - rowHeight + cellPad / 2 },
              end: { x: marginSize + (ci + 1) * colWidth, y: cy + cellPad / 2 },
              thickness: 0.5,
              color: rgb(0.7, 0.7, 0.7),
            });
          }
        });
      };

      let page = pdfDoc.addPage([pd.w, pd.h]);
      let y = pd.h - marginSize;

      // Header row
      drawRow(page, y, csvHeaders, true);
      y -= rowHeight;

      csvRows.forEach((row, ri) => {
        if (y - rowHeight < marginSize) {
          page = pdfDoc.addPage([pd.w, pd.h]);
          y = pd.h - marginSize;
          drawRow(page, y, csvHeaders, true);
          y -= rowHeight;
        }

        // Alternating row styling
        if (ri % 2 === 1) {
          page.drawRectangle({
            x: marginSize,
            y: y - rowHeight + cellPad / 2,
            width: usableW,
            height: rowHeight,
            color: rgb(0.96, 0.96, 0.98),
          });
        }

        drawRow(page, y, row, false);
        y -= rowHeight;
      });

      const bytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([bytes], { type: "application/pdf" });
      setMergedBlobUrl(URL.createObjectURL(blob));
      setMergedSize(blob.size);
      setOutputSizeFileName(`${csvFileName || "spreadsheet"}.pdf`);
      setSuccess("CSV parsed and drawn cleanly onto landscape grid PDF templates.");
    } catch (err: any) {
      console.error(err);
      setError("CSV rendering failed: " + err?.message);
    } finally {
      setLoading(false);
    }
  };

  /* ═════════════════════════════════════════════
     D. EMAIL (.eml / .msg) TO PDF
     ═════════════════════════════════════════════ */
  const handleEmlLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEmlFileName(file.name.replace(/\.[^.]+$/, ""));

      const arrayBuf = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuf);
      const isMSG = uint8[0] === 0xd0 && uint8[1] === 0xcf && uint8[2] === 0x11 && uint8[3] === 0xe0;

      let parsed: any;
      if (isMSG) {
        parsed = parseMsgFile(uint8);
      } else {
        let raw = "";
        for (let k = 0; k < uint8.length; k++) raw += String.fromCharCode(uint8[k]);
        parsed = parseEml(raw);
      }

      setEmlData(parsed);
      resetAllOutputs();
    }
  };

  // Outlook binary scan logic directly mirrored from HTML
  function parseMsgFile(data: Uint8Array) {
    function readUtf16Prop(tagHex: string, typeHex: string) {
      const marker = encodeUtf16LE(`__substg1.0_${tagHex}${typeHex}`);
      const idx = indexOfBytes(data, marker);
      if (idx === -1) return "";
      const scanStart = idx + marker.length + 4;
      const scanEnd = Math.min(scanStart + 65536, data.length);
      const chunk = data.slice(scanStart, scanEnd);
      const text = decodeUtf16LE(chunk);
      const clean = text
        .replace(/__substg1\.0_[0-9A-Fa-f]{8}/g, "")
        .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/g, "")
        .trim();
      const firstGarbage = clean.search(/\uFFFD{4,}|[\x00]{4,}/);
      return firstGarbage > 20 ? clean.slice(0, firstGarbage).trim() : clean;
    }

    function parseInternetHeaders(rawHeaders: string) {
      const lines = rawHeaders.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
      const h: Record<string, string> = {};
      let lastKey = "";
      for (const line of lines) {
        if (/^[ \t]/.test(line)) {
          if (lastKey) h[lastKey] = (h[lastKey] || "") + " " + line.trim();
        } else {
          const c = line.indexOf(":");
          if (c > 0) {
            lastKey = line.slice(0, c).toLowerCase().trim();
            h[lastKey] = line.slice(c + 1).trim();
          }
        }
      }
      return h;
    }

    function encodeUtf16LE(str: string) {
      const buf = new Uint8Array(str.length * 2);
      for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        buf[i * 2] = code & 0xff;
        buf[i * 2 + 1] = (code >> 8) & 0xff;
      }
      return buf;
    }

    function decodeUtf16LE(bytes: Uint8Array) {
      try {
        return new TextDecoder("utf-16le", { fatal: false }).decode(bytes);
      } catch (e) {
        let s = "";
        for (let i = 0; i + 1 < bytes.length; i += 2) s += String.fromCharCode(bytes[i] | (bytes[i + 1] << 8));
        return s;
      }
    }

    function indexOfBytes(haystack: Uint8Array, needle: Uint8Array) {
      outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
        for (let j = 0; j < needle.length; j++) if (haystack[i + j] !== needle[j]) continue outer;
        return i;
      }
      return -1;
    }

    const rawHeaders = readUtf16Prop("007D", "001F");
    const inetH = rawHeaders ? parseInternetHeaders(rawHeaders) : {};

    const senderName = readUtf16Prop("0C1A", "001F") || readUtf16Prop("4030", "001F");
    const senderEmail = readUtf16Prop("0C1F", "001F") || readUtf16Prop("4031", "001F") || readUtf16Prop("5D01", "001F");
    const displayTo = readUtf16Prop("0E04", "001F");
    const displayCc = readUtf16Prop("0E03", "001F");
    const subject = readUtf16Prop("0037", "001F");

    let fromStr = inetH["from"] || "";
    if (!fromStr) {
      fromStr = senderEmail ? (senderName ? `${senderName} <${senderEmail}>` : senderEmail) : senderName;
    }

    let bodyText = "";
    const plainBody = readUtf16Prop("1000", "001F");
    if (plainBody && plainBody.trim().length > 5) {
      bodyText = plainBody.split(/\x1a/)[0].replace(/\uFFFD+/g, "").trim();
    }
    if (!bodyText) {
      const htmlBody = readUtf16Prop("1013", "001F");
      if (htmlBody) {
        const div = document.createElement("div");
        div.innerHTML = htmlBody;
        bodyText = (div.innerText || div.textContent || "").trim();
      }
    }

    bodyText = bodyText.replace(/\*>@g/g, "").replace(/\uFFFD/g, "").trim();

    const attachMarker = encodeUtf16LE("__attach_version1.0_#");
    let attachCount = 0;
    let searchPos = 0;
    while (true) {
      const found = indexOfBytes(data.slice(searchPos), attachMarker);
      if (found === -1) break;
      attachCount++;
      searchPos += found + attachMarker.length;
    }

    return {
      from: fromStr.trim(),
      to: (inetH["to"] || displayTo || "").split(/[,;]/)[0].trim(),
      cc: inetH["cc"] || displayCc || "",
      date: (inetH["date"] || "").trim(),
      subject: (inetH["subject"] || subject || "").trim(),
      body: bodyText,
      attachments: Array(attachCount).fill("Attachment"),
    };
  }

  function parseEml(raw: string) {
    function binToUnicode(binStr: string, charset: string) {
      const cs = (charset || "utf-8").toLowerCase().replace(/[-_]/g, "");
      const label =
        cs === "utf8"
          ? "utf-8"
          : cs === "windows1252" || cs === "cp1252"
          ? "windows-1252"
          : cs === "iso88591"
          ? "iso-8859-1"
          : charset;
      try {
        const bytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i) & 0xff;
        return new TextDecoder(label, { fatal: false }).decode(bytes);
      } catch (e) {
        return binStr;
      }
    }

    function decodeRfc2047(str: string) {
      str = str.replace(/(=\?[^?]+\?[BbQq]\?[^?]*\?=)\s+(=\?[^?]+\?[BbQq]\?[^?]*\?=)/g, "$1$2");
      return str.replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (_, charset, enc, data) => {
        try {
          if (enc.toUpperCase() === "B") {
            const binStr = atob(data.trim());
            return binToUnicode(binStr, charset);
          } else {
            const qp = data
              .replace(/_/g, " ")
              .replace(/=([0-9A-Fa-f]{2})/g, (_: any, h: string) => String.fromCharCode(parseInt(h, 16)));
            return binToUnicode(qp, charset);
          }
        } catch (e) {
          return data;
        }
      });
    }

    function decodePart(content: string, cte: string, charset: string) {
      const enc = (cte || "7bit").toLowerCase().trim();
      let binStr = content;

      if (enc === "base64") {
        try {
          const cleaned = content.replace(/[\r\n\s]/g, "");
          binStr = atob(cleaned);
        } catch (e) {
          binStr = content;
        }
      } else if (enc === "quoted-printable") {
        binStr = content
          .replace(/=\r\n/g, "")
          .replace(/=\n/g, "")
          .replace(/=([0-9A-Fa-f]{2})/g, (_: any, h: string) => String.fromCharCode(parseInt(h, 16)));
      }
      return binToUnicode(binStr, charset || "utf-8");
    }

    function parseHeaders(lines: string[], start: number) {
      const h: Record<string, string> = {};
      let key = "";
      let i = start;
      while (i < lines.length) {
        const line = lines[i];
        if (line === "") {
          i++;
          break;
        }
        if (/^[ \t]/.test(line)) {
          if (key) h[key] = (h[key] || "") + " " + line.trim();
        } else {
          const c = line.indexOf(":");
          if (c > 0) {
            key = line.slice(0, c).toLowerCase().trim();
            h[key] = line.slice(c + 1).trim();
          }
        }
        i++;
      }
      return { h, next: i };
    }

    function parseParts(lines: string[], start: number, end: number, headers: any, depth: number): any {
      const ct = headers["content-type"] || "text/plain";
      const cte = headers["content-transfer-encoding"] || "7bit";
      const charset = (ct.match(/charset=["']?([^"';]+)/i) || [])[1] || "utf-8";

      if (depth > 6) {
        const content = lines.slice(start, end).join("\n");
        const decoded = decodePart(content, cte, charset);
        return { texts: [decoded], htmls: [], attachments: [] };
      }

      const boundaryM = ct.match(/boundary=["']?([^"';\r\n]+)/i);
      const boundary = boundaryM ? boundaryM[1] : null;

      if (boundary) {
        const bnd = "--" + boundary;
        const bndEnd = "--" + boundary + "--";
        const results = { texts: [] as string[], htmls: [] as string[], attachments: [] as string[] };
        let i = start;

        while (i < end && lines[i].trim() !== bnd && lines[i].trim() !== bndEnd) i++;

        while (i < end) {
          const trimmed = lines[i].trim();
          if (trimmed === bndEnd) break;
          if (trimmed === bnd) {
            i++;
            const { h: partH, next: partBodyStart } = parseHeaders(lines, i);
            i = partBodyStart;

            let partEnd = i;
            while (partEnd < end && lines[partEnd].trim() !== bnd && lines[partEnd].trim() !== bndEnd) partEnd++;

            const partCT = partH["content-type"] || "text/plain";
            const partCTE = partH["content-transfer-encoding"] || "7bit";
            const partCS = (partCT.match(/charset=["']?([^"';]+)/i) || [])[1] || charset;
            const partCD = partH["content-disposition"] || "";
            const isAttach = /attachment/i.test(partCD);
            const nmM = (partCD + " " + partCT).match(/(?:filename|name)\*?=["']?([^"';\r\n]+)/i);
            const partName = nmM ? nmM[1].trim() : "";

            if (isAttach) {
              results.attachments.push(partName || "Attachment");
            } else if (/multipart\//i.test(partCT)) {
              const sub = parseParts(lines, i, partEnd, partH, depth + 1);
              results.texts.push(...sub.texts);
              results.htmls.push(...sub.htmls);
              results.attachments.push(...sub.attachments);
            } else if (/text\/plain/i.test(partCT)) {
              results.texts.push(decodePart(lines.slice(i, partEnd).join("\n"), partCTE, partCS));
            } else if (/text\/html/i.test(partCT)) {
              results.htmls.push(decodePart(lines.slice(i, partEnd).join("\n"), partCTE, partCS));
            }
            i = partEnd;
          } else {
            i++;
          }
        }
        return results;
      } else {
        const content = lines.slice(start, end).join("\n");
        const decoded = decodePart(content, cte, charset);
        if (/text\/html/i.test(ct)) return { texts: [], htmls: [decoded], attachments: [] };
        return { texts: [decoded], htmls: [], attachments: [] };
      }
    }

    const normalized = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const lines = normalized.split("\n");
    const { h: topH, next: bodyStart } = parseHeaders(lines, 0);

    const parts = parseParts(lines, bodyStart, lines.length, topH, 0);

    let bodyText = "";
    if (parts.texts.length) {
      bodyText = parts.texts.join("\n\n");
    } else if (parts.htmls.length) {
      const div = document.createElement("div");
      div.innerHTML = parts.htmls.join("");
      bodyText = div.innerText || div.textContent || "";
    }

    return {
      from: decodeRfc2047(topH["from"] || ""),
      to: decodeRfc2047(topH["to"] || ""),
      cc: decodeRfc2047(topH["cc"] || ""),
      date: topH["date"] || "",
      subject: decodeRfc2047(topH["subject"] || ""),
      body: bodyText,
      attachments: parts.attachments,
    };
  }

  const convertEmlToPdf = async () => {
    if (!emlData) {
      setError("Please load an .eml or .msg email file first.");
      return;
    }

    setLoading(true);
    setError(null);
    setMergedBlobUrl(null);

    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontB = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const pd = getPageDimensions("A4", "portrait");
      const pad = 48;
      const usableW = pd.w - pad * 2;
      const lineH = fontSize * 1.5;

      let page = pdfDoc.addPage([pd.w, pd.h]);
      let y = pd.h - pad;

      const ensureSpace = (needed: number) => {
        if (y - needed < pad) {
          page = pdfDoc.addPage([pd.w, pd.h]);
          y = pd.h - pad;
        }
      };

      const drawTextLine = (text: string, fnt: any, size: number, color: any, indent = 0) => {
        const words = text.split(" ");
        let cur = "";
        const maxW = usableW - indent;
        const lines: string[] = [];

        for (const w of words) {
          const test = cur ? cur + " " + w : w;
          if (fnt.widthOfTextAtSize(test, size) <= maxW) {
            cur = test;
          } else {
            if (cur) lines.push(cur);
            cur = w;
          }
        }
        if (cur) lines.push(cur);

        for (const ln of lines) {
          ensureSpace(size * 1.5);
          page.drawText(ln, {
            x: pad + indent,
            y: y - size,
            size,
            font: fnt,
            color,
          });
          y -= size * 1.5;
        }
      };

      // Header block
      if (emlSections.headers) {
        drawTextLine(emlData.subject || "(no subject)", fontB, fontSize + 4, rgb(0.1, 0.1, 0.1));
        y -= 8;
        page.drawLine({ start: { x: pad, y }, end: { x: pd.w - pad, y }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });
        y -= 14;

        const fields = [
          ["From", emlData.from],
          ["To", emlData.to],
          emlData.cc ? ["CC", emlData.cc] : null,
          ["Date", emlData.date],
        ].filter(Boolean) as string[][];

        fields.forEach(([label, val]) => {
          ensureSpace(lineH);
          page.drawText(label + ":", { x: pad, y: y - fontSize, size: fontSize, font: fontB, color: rgb(0.4, 0.4, 0.4) });
          const labelWidth = fontB.widthOfTextAtSize(label + ":  ", fontSize);
          drawTextLine(val, font, fontSize, rgb(0.1, 0.1, 0.1), labelWidth);
        });

        y -= 16;
        page.drawLine({ start: { x: pad, y }, end: { x: pd.w - pad, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
        y -= 16;
      }

      // Body block
      if (emlSections.body && emlData.body) {
        const bodyLines = emlData.body.split("\n");
        bodyLines.forEach((line) => {
          if (line.trim() === "") {
            y -= lineH * 0.5;
          } else {
            drawTextLine(line, font, fontSize, rgb(0.12, 0.12, 0.12));
          }
        });
      }

      // Attachments block
      if (emlSections.attachments && emlData.attachments.length > 0) {
        y -= 16;
        page.drawLine({ start: { x: pad, y }, end: { x: pd.w - pad, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
        y -= 16;
        drawTextLine(`Attachments (${emlData.attachments.length}):`, fontB, fontSize, rgb(0.4, 0.4, 0.4));
        emlData.attachments.forEach((att) => {
          drawTextLine("  • " + att, font, fontSize, rgb(0.1, 0.1, 0.1));
        });
      }

      const bytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([bytes], { type: "application/pdf" });
      setMergedBlobUrl(URL.createObjectURL(blob));
      setMergedSize(blob.size);
      setOutputSizeFileName(`${emlFileName || "email"}.pdf`);
      setSuccess("Successfully processed MIME envelope headers and decrypted email text.");
    } catch (err: any) {
      console.error(err);
      setError("Email compilation failed: " + err?.message);
    } finally {
      setLoading(false);
    }
  };

  /* ═════════════════════════════════════════════
     E. EXCEL TO PDF
     ═════════════════════════════════════════════ */
  const handleExcelLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setExcelFileName(file.name.replace(/\.[^.]+$/, ""));

      try {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });

        const computedSheetRows: Record<string, any[][]> = {};
        const selMap: Record<string, boolean> = {};

        wb.SheetNames.forEach((sheetName) => {
          const ws = wb.Sheets[sheetName];
          const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as any[][];
          computedSheetRows[sheetName] = rawRows;
          selMap[sheetName] = true;
        });

        setExcelSheets(wb.SheetNames);
        setExcelSheetRows(computedSheetRows);
        setExcelActiveSheet(wb.SheetNames[0] || "");
        setSelectedSheets(selMap);
        resetAllOutputs();
      } catch (err: any) {
        setError("Error parsing Excel spreadsheet: " + err?.message);
      }
    }
  };

  const convertExcelToPdf = async () => {
    const sheetsToConvert = excelSheets.filter((s) => selectedSheets[s]);
    if (!sheetsToConvert.length) {
      setError("Select at least one active spreadsheet tab to include.");
      return;
    }

    setLoading(true);
    setError(null);
    setMergedBlobUrl(null);

    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontB = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const pd = getPageDimensions("A4", "landscape");
      const marginSize = 24;
      const cellPad = 4;
      const calculatedFontSize = 8;
      const rowHeight = calculatedFontSize + cellPad * 2 + 2;
      const usableW = pd.w - marginSize * 2;

      sheetsToConvert.forEach((sheetName) => {
        const rows = excelSheetRows[sheetName];
        if (!rows || !rows.length) return;

        const headers = rows[0].map(String);
        const dataRows = rows.slice(1);
        const colW = usableW / headers.length;

        let page = pdfDoc.addPage([pd.w, pd.h]);
        let y = pd.h - marginSize;

        // Title of sheet
        page.drawText(`Sheet: ${sheetName}`, {
          x: marginSize,
          y: y - calculatedFontSize - 2,
          size: calculatedFontSize + 3,
          font: fontB,
          color: rgb(0.12, 0.12, 0.15),
        });
        y -= rowHeight + 8;
        page.drawLine({
          start: { x: marginSize, y },
          end: { x: pd.w - marginSize, y },
          thickness: 1,
          color: rgb(0.12, 0.12, 0.15),
        });
        y -= 6;

        const drawSheetRow = (pg: any, cy: number, cells: any[], isHeader: boolean) => {
          const f = isHeader ? fontB : font;
          const bgCol = isHeader ? rgb(0.12, 0.12, 0.15) : null;
          const textCol = isHeader ? rgb(1, 1, 1) : rgb(0.1, 0.1, 0.1);

          if (bgCol) {
            pg.drawRectangle({
              x: marginSize,
              y: cy - rowHeight + cellPad / 2,
              width: usableW,
              height: rowHeight,
              color: bgCol,
            });
          }

          cells.forEach((cell, ci) => {
            if (ci >= headers.length) return;
            const val = String(cell ?? "").slice(0, 25);
            const cx = marginSize + ci * colW + cellPad;
            const maxW = colW - cellPad * 2;

            let display = val;
            while (display.length > 0 && f.widthOfTextAtSize(display, calculatedFontSize) > maxW) {
              display = display.slice(0, -1);
            }

            pg.drawText(display, {
              x: cx,
              y: cy - calculatedFontSize - cellPad / 2,
              size: calculatedFontSize,
              font: f,
              color: textCol,
            });

            if (ci < headers.length - 1) {
              pg.drawLine({
                start: { x: marginSize + (ci + 1) * colW, y: cy - rowHeight + cellPad / 2 },
                end: { x: marginSize + (ci + 1) * colW, y: cy + cellPad / 2 },
                thickness: 0.4,
                color: rgb(0.7, 0.7, 0.7),
              });
            }
          });
        };

        // Headers
        drawSheetRow(page, y, headers, true);
        y -= rowHeight;

        dataRows.forEach((row, ri) => {
          if (y - rowHeight < marginSize) {
            page = pdfDoc.addPage([pd.w, pd.h]);
            y = pd.h - marginSize;
            drawSheetRow(page, y, headers, true);
            y -= rowHeight;
          }

          if (ri % 2 === 1) {
            page.drawRectangle({
              x: marginSize,
              y: y - rowHeight + cellPad / 2,
              width: usableW,
              height: rowHeight,
              color: rgb(0.95, 0.95, 0.97),
            });
          }

          drawSheetRow(page, y, row, false);
          y -= rowHeight;
        });
      });

      const bytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([bytes], { type: "application/pdf" });
      setMergedBlobUrl(URL.createObjectURL(blob));
      setMergedSize(blob.size);
      setOutputSizeFileName(`${excelFileName || "workbook"}.pdf`);
      setSuccess("Successfully extracted sheets and drew tabular grids.");
    } catch (err: any) {
      console.error(err);
      setError("Excel conversion failed: " + err?.message);
    } finally {
      setLoading(false);
    }
  };

  /* ═════════════════════════════════════════════
     F. WORD (DOCX) TO PDF
     ═════════════════════════════════════════════ */
  const handleDocxLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocxFileName(file.name.replace(/\.[^.]+$/, ""));

      setLoading(true);
      setError(null);
      resetAllOutputs();

      try {
        const arrayBuf = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuf });
        setDocxHtml(result.value);

        // Word count metrics
        const div = document.createElement("div");
        div.innerHTML = result.value;
        const text = div.textContent || div.innerText || "";
        setDocxText(text);

        const wordsCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        setDocxStats({ words: wordsCount, size: file.size });
      } catch (err: any) {
        setError("Error parsing docx file: " + err?.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const convertDocxToPdf = async () => {
    if (!docxHtml) {
      setError("Please load a .docx document first.");
      return;
    }

    setLoading(true);
    setError(null);
    setMergedBlobUrl(null);

    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontB = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontI = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

      const pd = getPageDimensions("A4", "portrait");
      const marginSize = 48;
      const usableW = pd.w - marginSize * 2;
      const spacingLine = fontSize * 1.5;

      let page = pdfDoc.addPage([pd.w, pd.h]);
      let y = pd.h - marginSize;

      const ensureSpaceY = (needed: number) => {
        if (y - needed < marginSize) {
          page = pdfDoc.addPage([pd.w, pd.h]);
          y = pd.h - marginSize;
        }
      };

      const wrapAndDrawParagraph = (txt: string, fnt: any, size: number, color: any, indent = 0) => {
        if (!txt.trim()) {
          y -= size * 0.6;
          return;
        }
        const maxW = usableW - indent;
        const words = txt.split(" ");
        let cur = "";
        const lines: string[] = [];

        for (const w of words) {
          const test = cur ? cur + " " + w : w;
          if (fnt.widthOfTextAtSize(test, size) <= maxW) {
            cur = test;
          } else {
            if (cur) lines.push(cur);
            cur = w;
          }
        }
        if (cur) lines.push(cur);

        for (const ln of lines) {
          ensureSpaceY(size * 1.6);
          page.drawText(ln, {
            x: marginSize + indent,
            y: y - size,
            size,
            font: fnt,
            color,
          });
          y -= size * 1.5;
        }
      };

      // Walk DOM structure to parse headers, paragraphs, lists
      const div = document.createElement("div");
      div.innerHTML = docxHtml;

      const nodes = Array.from(div.childNodes);
      nodes.forEach((node: any) => {
        const tag = node.tagName;
        const textVal = (node.textContent || "").trim();
        if (!textVal) return;

        if (/^H1$/i.test(tag)) {
          y -= 8;
          wrapAndDrawParagraph(textVal, fontB, fontSize + 5, rgb(0.1, 0.1, 0.1));
          ensureSpaceY(4);
          page.drawLine({ start: { x: marginSize, y }, end: { x: pd.w - marginSize, y }, thickness: 0.8, color: rgb(0.4, 0.4, 0.4) });
          y -= 10;
        } else if (/^H2$/i.test(tag)) {
          y -= 6;
          wrapAndDrawParagraph(textVal, fontB, fontSize + 3, rgb(0.15, 0.15, 0.15));
          y -= 4;
        } else if (/^H[3-6]$/i.test(tag)) {
          y -= 4;
          wrapAndDrawParagraph(textVal, fontB, fontSize + 1, rgb(0.2, 0.2, 0.2));
        } else if (/^P$/i.test(tag)) {
          const hasBold = node.querySelector("strong, b");
          const hasItalic = node.querySelector("em, i");
          const targetFont = hasBold ? fontB : hasItalic ? fontI : font;
          wrapAndDrawParagraph(textVal, targetFont, fontSize, rgb(0.12, 0.12, 0.12));
          y -= 3;
        } else if (/^UL|OL$/i.test(tag)) {
          const items = node.querySelectorAll("li");
          items.forEach((li: any, idx: number) => {
            const prefix = /^OL$/i.test(tag) ? `${idx + 1}. ` : "• ";
            wrapAndDrawParagraph(prefix + (li.textContent || "").trim(), font, fontSize, rgb(0.12, 0.12, 0.12), 12);
          });
          y -= 3;
        } else {
          wrapAndDrawParagraph(textVal, font, fontSize, rgb(0.12, 0.12, 0.12));
        }
      });

      const bytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([bytes], { type: "application/pdf" });
      setMergedBlobUrl(URL.createObjectURL(blob));
      setMergedSize(blob.size);
      setOutputSizeFileName(`${docxFileName || "word_document"}.pdf`);
      setSuccess("HTML rendering of word doc compiled to formatted standard pages successfully!");
    } catch (err: any) {
      console.error(err);
      setError("Docx conversion failed: " + err?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Subtabs Navigation Panel */}
        <div className="w-full lg:w-64 shrink-0 bg-neutral-900 border border-neutral-800 p-4 rounded-xl space-y-2.5">
          <span className="block text-[10px] font-mono text-lime-400 font-bold uppercase tracking-widest px-2.5 pb-2 border-b border-neutral-800">
            // Select Input Format
          </span>

          {[
            { id: "image", name: "Images to PDF", icon: <ImageIcon className="h-3.5 w-3.5" /> },
            { id: "text", name: "Text / HTML to PDF", icon: <FileText className="h-3.5 w-3.5" /> },
            { id: "csv", name: "Spreadsheet (CSV)", icon: <FileSpreadsheet className="h-3.5 w-3.5" /> },
            { id: "eml", name: "Email (.eml / .msg)", icon: <Mail className="h-3.5 w-3.5" /> },
            { id: "excel", name: "Excel (xlsx)", icon: <FileSpreadsheet className="h-3.5 w-3.5" /> },
            { id: "word", name: "Word (docx)", icon: <FilePlus className="h-3.5 w-3.5" /> },
          ].map((sub) => (
            <button
              key={sub.id}
              onClick={() => {
                setActiveSubTab(sub.id as ConverterType);
                resetAllOutputs();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-mono font-medium transition cursor-pointer ${
                activeSubTab === sub.id
                  ? "bg-lime-400 text-black font-bold"
                  : "bg-transparent text-neutral-400 hover:bg-neutral-850 hover:text-neutral-250"
              }`}
            >
              {sub.icon}
              <span>{sub.name}</span>
            </button>
          ))}
        </div>

        {/* Configurations & Compilation Area */}
        <div className="flex-grow min-w-0 space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Input Config Panel */}
            <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl space-y-5">
              <div className="border-b border-neutral-800 pb-3 flex justify-between items-center">
                <span className="text-xs font-mono text-lime-400 font-bold uppercase tracking-widest">
                  // {activeSubTab.toUpperCase()} Input Config
                </span>
              </div>

              {/* A. IMAGES */}
              {activeSubTab === "image" && (
                <div className="space-y-4">
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-800 hover:border-lime-400 bg-neutral-950/40 p-8 rounded-md text-center cursor-pointer transition relative"
                  >
                    <input
                      type="file"
                      ref={imageInputRef}
                      accept="image/*"
                      multiple
                      onChange={handleImageAdd}
                      className="hidden"
                    />
                    <ImageIcon className="mx-auto text-lime-400 mb-2 h-10 w-10 animate-pulse" />
                    <span className="block font-bold text-sm text-neutral-200">Upload JPG, PNG, GIF, WebP</span>
                    <span className="block text-[10px] text-neutral-500 mt-1 uppercase font-mono">
                      Multi-select enabled · local compilation
                    </span>
                  </div>

                  {images.length > 0 && (
                    <div className="space-y-2">
                      <span className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">
                        Images Queue ({images.length})
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                        {images.map((im) => (
                          <div
                            key={im.id}
                            onClick={() => toggleImageExclude(im.id)}
                            className={`relative border rounded overflow-hidden aspect-video cursor-pointer select-none group transition ${
                              im.excluded ? "opacity-30 border-neutral-800" : "border-neutral-750"
                            }`}
                          >
                            <img src={im.url} alt={im.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-x-0 bottom-0 bg-black/70 p-1 truncate text-[8px] font-mono text-neutral-400 group-hover:text-white">
                              {im.name}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage(im.id);
                              }}
                              className="absolute top-1 right-1 p-0.5 bg-black/60 hover:bg-red-500/80 rounded transition text-neutral-400 hover:text-white"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                            {im.excluded && (
                              <div className="absolute inset-0 bg-red-950/20 flex items-center justify-center text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest">
                                Omit
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Settings */}
                  <div className="grid grid-cols-3 gap-3 p-3.5 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono">
                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-500 uppercase">Page Size</span>
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(e.target.value as any)}
                        className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 py-1.5 px-2.5 rounded focus:outline-none focus:border-lime-400 text-xs"
                      >
                        <option value="A4">A4</option>
                        <option value="letter">Letter</option>
                        <option value="A3">A3</option>
                        <option value="fit">Fit dimensions</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-500 uppercase">Orientation</span>
                      <select
                        value={orientation}
                        onChange={(e) => setOrientation(e.target.value as any)}
                        className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 py-1.5 px-2.5 rounded focus:outline-none focus:border-lime-400 text-xs"
                      >
                        <option value="portrait">Portrait</option>
                        <option value="landscape">Landscape</option>
                        <option value="auto">Auto-detect</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-500 uppercase">Fit Mode</span>
                      <select
                        value={fitMode}
                        onChange={(e) => setFitMode(e.target.value as any)}
                        className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 py-1.5 px-2.5 rounded focus:outline-none focus:border-lime-400 text-xs"
                      >
                        <option value="contain">Contain ratio</option>
                        <option value="fill">Fill template</option>
                        <option value="actual">Actual size</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={convertImagesToPdf}
                    disabled={loading || !images.length}
                    className="w-full font-mono font-bold text-xs uppercase tracking-wider py-3 px-4 rounded bg-lime-400 hover:bg-lime-500 text-black transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      "Convert selected images to PDF"
                    )}
                  </button>
                </div>
              )}

              {/* B. TEXT */}
              {activeSubTab === "text" && (
                <div className="space-y-4">
                  <div
                    onClick={() => textInputRef.current?.click()}
                    className="border border-dashed border-neutral-800 hover:border-lime-400 bg-neutral-950/40 p-4 rounded-md text-center cursor-pointer transition relative"
                  >
                    <input
                      type="file"
                      ref={textInputRef}
                      accept=".txt,.html,.htm,.md"
                      onChange={handleTextFileLoad}
                      className="hidden"
                    />
                    <FileText className="mx-auto text-lime-400 mb-1.5 h-6 w-6" />
                    <span className="block font-bold text-xs text-neutral-300">Upload TXT, HTML, Markdown</span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-mono text-neutral-400 uppercase">Pasted content buffer</span>
                    <textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Paste or write raw plain text or structural HTML elements here..."
                      className="w-full h-36 bg-neutral-950 border border-neutral-800 rounded p-2 text-neutral-200 font-mono text-xs focus:outline-none focus:border-lime-400 resize-none"
                    />
                  </div>

                  {/* Text properties */}
                  <div className="grid grid-cols-2 gap-3 p-3.5 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono">
                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-500 uppercase">Font Size</span>
                      <select
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                        className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 py-1.5 px-2.5 rounded focus:outline-none focus:border-lime-400 text-xs"
                      >
                        <option value={9}>9 pt</option>
                        <option value={11}>11 pt</option>
                        <option value={12}>12 pt</option>
                        <option value={14}>14 pt</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-500 uppercase">Page margins</span>
                      <select
                        value={margin}
                        onChange={(e) => setMargin(parseInt(e.target.value))}
                        className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 py-1.5 px-2.5 rounded focus:outline-none focus:border-lime-400 text-xs"
                      >
                        <option value={20}>Narrow (20pt)</option>
                        <option value={40}>Balanced (40pt)</option>
                        <option value={56}>Wide (56pt)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={convertTextToPdf}
                    disabled={loading || !textContent.trim()}
                    className="w-full font-mono font-bold text-xs uppercase tracking-wider py-3 px-4 rounded bg-lime-400 hover:bg-lime-500 text-black transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Typeset characters to PDF"}
                  </button>
                </div>
              )}

              {/* C. CSV */}
              {activeSubTab === "csv" && (
                <div className="space-y-4">
                  <div className="border border-dashed border-neutral-800 hover:border-lime-400 bg-neutral-950/40 p-10 rounded-md text-center cursor-pointer transition relative">
                    <input
                      type="file"
                      accept=".csv,.tsv"
                      onChange={handleCsvLoad}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <FileSpreadsheet className="mx-auto text-lime-400 mb-2 h-10 w-10" />
                    <span className="block font-bold text-sm text-neutral-200">
                      {csvFileName ? `${csvFileName}.csv` : "Load CSV or TSV spreadsheet"}
                    </span>
                    <span className="block text-xs text-neutral-500 mt-1 uppercase font-mono">
                      {csvRows.length > 0 ? `${csvRows.length} data rows compiled` : "100% locally evaluated"}
                    </span>
                  </div>

                  {csvHeaders.length > 0 && (
                    <div className="space-y-2">
                      <span className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                        Quick Grid Preview (Up to first 5 rows)
                      </span>
                      <div className="border border-neutral-800 rounded bg-neutral-950 max-h-40 overflow-auto text-[10px] font-mono">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-neutral-900 border-b border-neutral-800 text-neutral-300">
                              {csvHeaders.slice(0, 5).map((h, hi) => (
                                <th key={hi} className="p-2 border-r border-neutral-800 font-bold truncate">
                                  {h}
                                </th>
                              ))}
                              {csvHeaders.length > 5 && <th className="p-2 text-neutral-500">...</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {csvRows.slice(0, 5).map((row, ri) => (
                              <tr key={ri} className="border-b border-neutral-850 text-neutral-450 hover:bg-neutral-900/50">
                                {row.slice(0, 5).map((cell, ci) => (
                                  <td key={ci} className="p-2 border-r border-neutral-850 truncate max-w-xs">
                                    {cell}
                                  </td>
                                ))}
                                {row.length > 5 && <td className="p-2 text-neutral-500">...</td>}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={convertCsvToPdf}
                    disabled={loading || !csvHeaders.length}
                    className="w-full font-mono font-bold text-xs uppercase tracking-wider py-3 px-4 rounded bg-lime-400 hover:bg-lime-500 text-black transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Render Spreadsheet to PDF"}
                  </button>
                </div>
              )}

              {/* D. EMAIL */}
              {activeSubTab === "eml" && (
                <div className="space-y-4">
                  <div className="border border-dashed border-neutral-800 hover:border-lime-400 bg-neutral-950/40 p-10 rounded-md text-center cursor-pointer transition relative">
                    <input
                      type="file"
                      accept=".eml,.msg"
                      onChange={handleEmlLoad}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Mail className="mx-auto text-lime-400 mb-2 h-10 w-10" />
                    <span className="block font-bold text-sm text-neutral-200">
                      {emlFileName ? `${emlFileName}` : "Load EML or Outlook MSG envelope"}
                    </span>
                    <span className="block text-xs text-neutral-500 mt-1 uppercase font-mono">
                      {emlData ? "Decoded MIME parameters successfully" : "100% locally evaluated"}
                    </span>
                  </div>

                  {emlData && (
                    <div className="space-y-3 bg-neutral-950 border border-neutral-850 rounded p-4 text-xs font-mono leading-relaxed text-neutral-300">
                      <div className="grid grid-cols-4 gap-2 pb-2 border-b border-neutral-850">
                        <span className="text-neutral-500 font-bold uppercase">From:</span>
                        <span className="col-span-3 truncate text-neutral-200">{emlData.from}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 pb-2 border-b border-neutral-850">
                        <span className="text-neutral-500 font-bold uppercase">To:</span>
                        <span className="col-span-3 truncate text-neutral-200">{emlData.to}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 pb-2 border-b border-neutral-850">
                        <span className="text-neutral-500 font-bold uppercase">Subject:</span>
                        <span className="col-span-3 font-bold text-lime-400">{emlData.subject || "(no subject)"}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <span className="text-neutral-500 font-bold uppercase">Files:</span>
                        <span className="col-span-3 text-neutral-400">
                          {emlData.attachments.length} attachments found
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Section toggles */}
                  {emlData && (
                    <div className="space-y-2">
                      <span className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                        Configure elements to include
                      </span>
                      <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                        {(["headers", "body", "attachments"] as const).map((sec) => (
                          <button
                            key={sec}
                            onClick={() => setEmlSections((prev) => ({ ...prev, [sec]: !prev[sec] }))}
                            className={`py-2 rounded border uppercase tracking-wider cursor-pointer text-center transition ${
                              emlSections[sec]
                                ? "bg-lime-400/10 border-lime-400 text-lime-400 font-bold"
                                : "bg-neutral-950 border-neutral-850 text-neutral-500"
                            }`}
                          >
                            {sec}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={convertEmlToPdf}
                    disabled={loading || !emlData}
                    className="w-full font-mono font-bold text-xs uppercase tracking-wider py-3 px-4 rounded bg-lime-400 hover:bg-lime-500 text-black transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Render EML envelope to PDF"}
                  </button>
                </div>
              )}

              {/* E. EXCEL */}
              {activeSubTab === "excel" && (
                <div className="space-y-4">
                  <div className="border border-dashed border-neutral-800 hover:border-lime-400 bg-neutral-950/40 p-10 rounded-md text-center cursor-pointer transition relative">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.ods"
                      onChange={handleExcelLoad}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <FileSpreadsheet className="mx-auto text-lime-400 mb-2 h-10 w-10" />
                    <span className="block font-bold text-sm text-neutral-200">
                      {excelFileName ? `${excelFileName}.xlsx` : "Load Excel Workbook"}
                    </span>
                    <span className="block text-xs text-neutral-500 mt-1 uppercase font-mono">
                      {excelSheets.length > 0 ? `${excelSheets.length} workbook sheets mapped` : "Local sheet parse"}
                    </span>
                  </div>

                  {excelSheets.length > 0 && (
                    <div className="space-y-2">
                      <span className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                        Toggle workbook tabs to include
                      </span>
                      <div className="flex flex-wrap gap-2 text-xs font-mono">
                        {excelSheets.map((name) => (
                          <button
                            key={name}
                            onClick={() => setSelectedSheets((prev) => ({ ...prev, [name]: !prev[name] }))}
                            className={`px-3 py-1.5 rounded border tracking-wide cursor-pointer transition ${
                              selectedSheets[name]
                                ? "bg-lime-400/10 border-lime-400 text-lime-400 font-bold"
                                : "bg-neutral-950 border-neutral-850 text-neutral-500"
                            }`}
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={convertExcelToPdf}
                    disabled={loading || !excelSheets.length}
                    className="w-full font-mono font-bold text-xs uppercase tracking-wider py-3 px-4 rounded bg-lime-400 hover:bg-lime-500 text-black transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Render Spreadsheet sheets to PDF"}
                  </button>
                </div>
              )}

              {/* F. WORD */}
              {activeSubTab === "word" && (
                <div className="space-y-4">
                  <div className="border border-dashed border-neutral-800 hover:border-lime-400 bg-neutral-950/40 p-10 rounded-md text-center cursor-pointer transition relative">
                    <input
                      type="file"
                      accept=".docx"
                      onChange={handleDocxLoad}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <FilePlus className="mx-auto text-lime-400 mb-2 h-10 w-10" />
                    <span className="block font-bold text-sm text-neutral-200">
                      {docxFileName ? `${docxFileName}.docx` : "Load Word document"}
                    </span>
                    <span className="block text-xs text-neutral-500 mt-1 uppercase font-mono">
                      {docxHtml ? `Extracted ~${docxStats.words.toLocaleString()} words successfully` : "DOCX structure unpack"}
                    </span>
                  </div>

                  {docxHtml && (
                    <div className="space-y-1.5">
                      <span className="block text-[10px] font-mono text-neutral-400 uppercase">Document HTML rendering preview</span>
                      <div
                        dangerouslySetInnerHTML={{ __html: docxHtml.slice(0, 1500) + (docxHtml.length > 1500 ? "<p className='text-neutral-550 italic'>... document clipped for preview ...</p>" : "") }}
                        className="w-full h-36 bg-neutral-950 border border-neutral-800 rounded p-3 overflow-y-auto text-neutral-300 font-serif text-xs leading-relaxed space-y-2 select-none"
                      />
                    </div>
                  )}

                  <button
                    onClick={convertDocxToPdf}
                    disabled={loading || !docxHtml}
                    className="w-full font-mono font-bold text-xs uppercase tracking-wider py-3 px-4 rounded bg-lime-400 hover:bg-lime-500 text-black transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Render Word DOM structure to PDF"}
                  </button>
                </div>
              )}
            </div>

            {/* Right Side: Compiled Output Download Panel */}
            <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl flex flex-col justify-between">
              <div>
                <div className="border-b border-neutral-800 pb-3 mb-5">
                  <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">// PDF Compilation manifest</span>
                </div>

                {error && (
                  <div className="bg-red-950/40 border border-red-900 text-red-200 p-4 rounded text-xs flex items-start gap-2.5 mb-4 animate-fade-in">
                    <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block uppercase tracking-wider mb-1">Conversion notice</span>
                      {error}
                    </div>
                  </div>
                )}

                {success && (
                  <div className="bg-emerald-950/40 border border-emerald-900 text-emerald-200 p-4 rounded text-xs flex items-start gap-2.5 mb-4 animate-fade-in">
                    <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block uppercase tracking-wider mb-1">Conversion Success</span>
                      {success}
                    </div>
                  </div>
                )}

                {mergedBlobUrl ? (
                  <div className="space-y-4 animate-fade-in">
                    <div className="bg-neutral-950 p-6 border border-neutral-800 rounded text-center">
                      <CheckCircle className="mx-auto text-lime-400 mb-2 h-10 w-10 animate-bounce" />
                      <span className="block font-bold text-sm text-lime-400">PDF Document Compiled Natively</span>
                      <span className="block text-xs font-mono text-neutral-500 mt-1 uppercase">
                        File sizing: {(mergedSize / 1024).toFixed(2)} KB ({(mergedSize / 1024 / 1024).toFixed(3)} MB)
                      </span>
                    </div>

                    <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                      Your newly formatted document is cached securely inside a temporary in-browser BLOB storage scope.
                      Save it down below to retain a persistent copy on your device.
                    </p>
                  </div>
                ) : (
                  <div className="py-24 text-center text-neutral-500 text-xs font-mono uppercase tracking-wider">
                    Awaiting source parameters to typeset...
                  </div>
                )}
              </div>

              {mergedBlobUrl && (
                <div className="mt-6">
                  <a
                    href={mergedBlobUrl}
                    download={outputFileName || "converted_document.pdf"}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-950 text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    Save Compiled PDF
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
