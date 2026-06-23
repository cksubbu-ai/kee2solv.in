/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import QRCode from "qrcode";
import { Link2, QrCode, Bot, Compass, Share2, RefreshCw, Layout, Type, Copy, Download, CheckCircle, AlertTriangle } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// BULK UTM BUILDER
// ─────────────────────────────────────────────────────────────────────────────
interface CampaignChannel {
  id: string;
  label: string;
  source: string;
  medium: string;
}

export function UtmBuilder() {
  const [urlsInput, setUrlsInput] = useState("https://example.com/shop\nhttps://example.com/blog");
  const [source, setSource] = useState("google");
  const [medium, setMedium] = useState("cpc");
  const [campaign, setCampaign] = useState("summer_launch_2026");
  const [term, setTerm] = useState("");
  const [content, setContent] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["google", "facebook", "linkedin"]);
  const [generatedLinks, setGeneratedLinks] = useState<string[]>([]);
  const [activeCopiedIndex, setActiveCopiedIndex] = useState<number | null>(null);

  const channels: CampaignChannel[] = [
    { id: "google", label: "Google Ads", source: "google", medium: "cpc" },
    { id: "facebook", label: "Facebook Social", source: "facebook", medium: "social" },
    { id: "linkedin", label: "LinkedIn Pro", source: "linkedin", medium: "social" },
    { id: "instagram", label: "Instagram Ads", source: "instagram", medium: "social" },
    { id: "email", label: "Email Newsletter", source: "newsletter", medium: "email" },
    { id: "tiktok", label: "TikTok Ads", source: "tiktok", medium: "video" },
    { id: "twitter", label: "X / Twitter Organic", source: "x", medium: "social" }
  ];

  const handleChannelToggle = (id: string) => {
    setSelectedChannels((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleGenerate = () => {
    const urls = urlsInput.split("\n").map((line) => line.trim()).filter(Boolean);
    const results: string[] = [];

    const activeList = channels.filter((c) => selectedChannels.includes(c.id));
    if (activeList.length === 0) {
      activeList.push({ id: "custom", label: "Custom", source: source || "direct", medium: medium || "referral" });
    }

    urls.forEach((baseUrl) => {
      activeList.forEach((chan) => {
        try {
          let prepped = baseUrl;
          if (!/^https?:\/\//i.test(prepped)) {
            prepped = "https://" + prepped;
          }
          const urlObj = new URL(prepped);
          urlObj.searchParams.set("utm_source", chan.source);
          urlObj.searchParams.set("utm_medium", chan.medium);
          urlObj.searchParams.set("utm_campaign", campaign || "marketing_campaign");
          if (term.trim()) urlObj.searchParams.set("utm_term", term.trim());
          if (content.trim()) urlObj.searchParams.set("utm_content", content.trim());
          results.push(urlObj.toString());
        } catch (e) {
          results.push(`[Invalid URL Node Syntax: "${baseUrl}"]`);
        }
      });
    });

    setGeneratedLinks(results);
  };

  const handleCopyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setActiveCopiedIndex(index);
    setTimeout(() => setActiveCopiedIndex(null), 1200);
  };

  const handleDownloadTxt = () => {
    const data = generatedLinks.join("\n");
    const blob = new Blob([data], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kee2solv_utm_list_${campaign}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md space-y-4">
          <div className="border-b border-neutral-800 pb-3">
            <span className="text-xs font-mono text-lime-400 font-bold uppercase tracking-widest">// Campaign Parameters Input</span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Target base URLs (one per row)</label>
            <textarea
              rows={3}
              value={urlsInput}
              onChange={(e) => setUrlsInput(e.target.value)}
              placeholder="https://example.com/landing-page"
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-250 rounded p-2.5 text-xs font-mono focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Campaign Name</label>
              <input
                type="text"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                placeholder="summer_promo"
                className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-3 py-2 text-xs font-mono focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Default Source</label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="google"
                className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-3 py-2 text-xs font-mono focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1 col-span-1">
              <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Default Medium</label>
              <input
                type="text"
                value={medium}
                onChange={(e) => setMedium(e.target.value)}
                placeholder="cpc"
                className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-3 py-2 text-xs font-mono focus:outline-none"
              />
            </div>
            <div className="space-y-1 col-span-1">
              <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Term Keyword</label>
              <input
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="shoes+running"
                className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-3 py-2 text-xs font-mono focus:outline-none"
              />
            </div>
            <div className="space-y-1 col-span-1">
              <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Content Identifier</label>
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="banner_ad"
                className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-3 py-2 text-xs font-mono focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Bulk Channel Multi-Toggles</label>
            <div className="grid grid-cols-2 gap-1.5">
              {channels.map((chan) => (
                <button
                  key={chan.id}
                  onClick={() => handleChannelToggle(chan.id)}
                  className={`text-left px-3 py-1.5 border rounded text-[10px] font-mono uppercase font-bold transition cursor-pointer ${
                    selectedChannels.includes(chan.id)
                      ? "bg-lime-400 border-lime-400 text-black"
                      : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  {selectedChannels.includes(chan.id) ? "★" : "☆"} {chan.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            className="w-full font-mono font-bold text-xs uppercase tracking-wider py-3 px-4 rounded bg-lime-400 hover:bg-lime-500 text-black transition flex items-center justify-center gap-2 cursor-pointer"
          >
            "Generate tracked URL endpoints"
          </button>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md flex flex-col justify-between">
          <div>
            <div className="border-b border-neutral-800 pb-3 mb-5 flex justify-between items-baseline">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">// Generated tracker addresses</span>
              {generatedLinks.length > 0 && (
                <button
                  onClick={handleDownloadTxt}
                  className="text-[10px] font-mono text-lime-400 hover:underline uppercase flex items-center gap-1 cursor-pointer bg-transparent border-none"
                >
                  <Download className="h-3 w-3" /> Save list
                </button>
              )}
            </div>

            {generatedLinks.length > 0 ? (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {generatedLinks.map((link, idx) => (
                  <div key={idx} className="bg-neutral-950 p-3 rounded border border-neutral-850 flex items-start justify-between gap-3 text-xs">
                    <span className="font-mono text-lime-400 break-all select-all leading-normal max-w-xs">{link}</span>
                    <button
                      onClick={() => handleCopyToClipboard(link, idx)}
                      className="p-1 px-2 border border-neutral-800 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white font-mono text-[9px] uppercase font-bold tracking-widest shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="h-2.5 w-2.5" />
                      {activeCopiedIndex === idx ? "Copied" : "Copy"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-neutral-500 text-xs font-mono">
                Awaiting Campaign builders configs...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DYNAMIC QR CODE CREATOR
// ─────────────────────────────────────────────────────────────────────────────
export function QrCreator() {
  const [payload, setPayload] = useState("https://kee2solv.in");
  const [qrColor, setQrColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const generateQr = () => {
    if (!canvasRef.current || !payload.trim()) return;
    QRCode.toCanvas(
      canvasRef.current,
      payload.trim(),
      {
        width: 250,
        margin: 2,
        color: {
          dark: qrColor,
          light: bgColor,
        },
      },
      (err) => {
        if (err) console.error("QR Code rendering failed:", err);
      }
    );
  };

  useEffect(() => {
    generateQr();
  }, [payload, qrColor, bgColor]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "kee2solv_growth_qr.png";
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md space-y-4">
          <div className="border-b border-neutral-800 pb-3 text-left">
            <span className="text-xs font-mono text-lime-400 font-bold uppercase tracking-widest">// Data Payload Setup</span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Destination address string (URL/Text)</label>
            <input
              type="text"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              placeholder="https://kee2solv.in/landing"
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-250 rounded p-2.5 text-xs font-mono focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 bg-neutral-950 p-2.5 border border-neutral-800 rounded">
              <label className="text-[10px] font-mono text-neutral-400 uppercase">Matrix fill</label>
              <input
                type="color"
                value={qrColor}
                onChange={(e) => setQrColor(e.target.value)}
                className="w-7 h-7 bg-neutral-900 border border-neutral-800 rounded cursor-pointer shrink-0"
              />
            </div>
            <div className="flex items-center gap-2 bg-neutral-950 p-2.5 border border-neutral-800 rounded">
              <label className="text-[10px] font-mono text-neutral-400 uppercase">Backdrop</label>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-7 h-7 bg-neutral-900 border border-neutral-800 rounded cursor-pointer shrink-0"
              />
            </div>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md flex flex-col justify-between">
          <div>
            <div className="border-b border-neutral-800 pb-3 mb-5">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">// Vector compiled barcodes</span>
            </div>

            <div className="p-4 bg-neutral-950 rounded border border-neutral-850 flex items-center justify-center min-h-[220px]">
              <canvas ref={canvasRef} className="rounded shadow-md" />
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-950 text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer mt-6"
          >
            <Download className="h-4 w-4" />
            Save QR Code Image PNG
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROBOTS.TXT GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
export function RobotsGenerator() {
  const [defaultBlock, setDefaultBlock] = useState<"allow" | "disallow">("allow");
  const [aiBlock, setAiBlock] = useState(true);
  const [sitemap, setSitemap] = useState("https://kee2solv.in/sitemap.xml");
  const [customDisallows, setCustomDisallows] = useState("/admin/\n/private/");
  const [compiledRobots, setCompiledRobots] = useState("");
  const [copied, setCopied] = useState(false);

  const compileRobots = () => {
    let out = `# robots.txt - compiled by Kee2Solv\r\n# 100% locally produced client-side\r\n\r\nUser-agent: *\r\n`;

    if (defaultBlock === "disallow") {
      out += `Disallow: /\r\n`;
    } else {
      const parts = customDisallows.split("\n").map((p) => p.trim()).filter(Boolean);
      parts.forEach((p) => {
        out += `Disallow: ${p}\r\n`;
      });
    }

    if (aiBlock) {
      out += `\r\n# Strict block for AI LLM Scrapers and training spiders\r\n`;
      const aiAgents = ["GPTBot", "ClaudeBot", "PerplexityBot", "CCBot", "Google-Extended"];
      aiAgents.forEach((agent) => {
        out += `User-agent: ${agent}\r\nDisallow: /\r\n`;
      });
    }

    if (sitemap.trim()) {
      out += `\r\nSitemap: ${sitemap.trim()}\r\n`;
    }

    setCompiledRobots(out);
  };

  useEffect(() => {
    compileRobots();
  }, [defaultBlock, aiBlock, sitemap, customDisallows]);

  const handleCopy = () => {
    navigator.clipboard.writeText(compiledRobots);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleDownload = () => {
    const blob = new Blob([compiledRobots], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "robots.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md space-y-4">
          <div className="border-b border-neutral-800 pb-3">
            <span className="text-xs font-mono text-lime-400 font-bold uppercase tracking-widest">// Directives Rules Setup</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Default robots policy (*)</label>
              <select
                value={defaultBlock}
                onChange={(e) => setDefaultBlock(e.target.value as any)}
                className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-2 text-xs font-mono"
              >
                <option value="allow">Allow All Search Bots</option>
                <option value="disallow">Disallow Broad Indexing</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">AI model scrapers block</label>
              <select
                value={aiBlock ? "block" : "allow"}
                onChange={(e) => setAiBlock(e.target.value === "block")}
                className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-2 text-xs font-mono"
              >
                <option value="block">Exclude GPTBot, ClaudeBot, etc.</option>
                <option value="allow">Allow Full Extraction</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Sitemap Path Endpoint Location</label>
            <input
              type="text"
              value={sitemap}
              onChange={(e) => setSitemap(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-3 py-2 text-xs font-mono focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Disallowed subdirectories (one per line)</label>
            <textarea
              rows={3}
              value={customDisallows}
              onChange={(e) => setCustomDisallows(e.target.value)}
              placeholder="/cms/\r\n/staged/"
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-250 rounded p-2 text-xs font-mono focus:outline-none"
            />
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md flex flex-col justify-between">
          <div>
            <div className="border-b border-neutral-800 pb-3 mb-5">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">// robots.txt script generated stream</span>
            </div>

            <pre className="bg-neutral-950 border border-neutral-850 p-4 rounded text-xs font-mono text-lime-400 max-h-72 overflow-y-auto whitespace-pre">
              {compiledRobots}
            </pre>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              onClick={handleCopy}
              className="py-3 px-4 rounded border border-neutral-700 bg-neutral-950 hover:bg-neutral-850 text-neutral-200 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
            >
              {copied ? "Copied ✓" : "Copy configuration"}
            </button>
            <button
              onClick={handleDownload}
              className="py-3 px-4 rounded bg-lime-400 hover:bg-lime-500 text-black text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
            >
              Download robots.txt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// XML SITEMAP GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
export function SitemapGenerator() {
  const [urlsInput, setUrlsInput] = useState("https://kee2solv.in/\nhttps://kee2solv.in/about-us");
  const [xmlContent, setXmlContent] = useState("");
  const [copied, setCopied] = useState(false);

  const compileSitemap = () => {
    let out = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    const rows = urlsInput.split("\n").map((r) => r.trim()).filter(Boolean);

    rows.forEach((r) => {
      let absolute = r;
      if (!/^https?:\/\//i.test(absolute)) {
        absolute = "https://" + absolute;
      }
      out += `  <url>\n    <loc>${absolute}</loc>\n    <priority>0.80</priority>\n  </url>\n`;
    });

    out += `</urlset>`;
    setXmlContent(out);
  };

  useEffect(() => {
    compileSitemap();
  }, [urlsInput]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md space-y-4">
          <div className="border-b border-neutral-800 pb-3">
            <span className="text-xs font-mono text-lime-400 font-bold uppercase tracking-widest">// Link Indices rows setup</span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Page paths list urls (one per line)</label>
            <textarea
              rows={8}
              value={urlsInput}
              onChange={(e) => setUrlsInput(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-lime-400 rounded p-3 text-xs font-mono focus:outline-none focus:border-lime-400 min-h-[160px] resize-y"
            />
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md flex flex-col justify-between">
          <div>
            <div className="border-b border-neutral-800 pb-3 mb-5">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">// Sitemap xml content stream</span>
            </div>

            <pre className="bg-neutral-950 border border-neutral-850 p-4 rounded text-xs font-mono text-lime-400 max-h-72 overflow-y-auto whitespace-pre">
              {xmlContent}
            </pre>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              onClick={() => {
                navigator.clipboard.writeText(xmlContent);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }}
              className="py-3 px-4 rounded border border-neutral-700 bg-neutral-950 hover:bg-neutral-850 text-neutral-200 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
            >
              {copied ? "Copied ✓" : "Copy to clipboard"}
            </button>
            <button
              onClick={() => {
                const blob = new Blob([xmlContent], { type: "application/xml;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "sitemap.xml";
                a.click();
              }}
              className="py-3 px-4 rounded bg-lime-400 text-black text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
            >
              Export Sitemap XML
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA JSON-LD GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
export function SchemaGenerator() {
  const [schemaType, setSchemaType] = useState<"local" | "article">("local");
  const [bizName, setBizName] = useState("Acme Digital Agencies Ltd");
  const [bizUrl, setBizUrl] = useState("https://kee2solv.in");
  const [artTitle, setArtTitle] = useState("Advanced Local Sandbox Computing Principles");
  const [artAuthor, setArtAuthor] = useState("Kee2 Innovations Author Group");
  const [compiledJson, setCompiledJson] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let obj: any = {};
    if (schemaType === "local") {
      obj = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": bizName,
        "url": bizUrl,
        "image": "https://kee2solv.in/logo.png",
        "priceRange": "$$",
        "telephone": "+1-111-1234-567"
      };
    } else {
      obj = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": artTitle,
        "author": {
          "@type": "Person",
          "name": artAuthor
        },
        "publisher": {
          "@type": "Organization",
          "name": "Kee2Solv Network"
        },
        "datePublished": "2026-06-22"
      };
    }

    setCompiledJson(`<script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n</script>`);
  }, [schemaType, bizName, bizUrl, artTitle, artAuthor]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md space-y-4">
          <div className="border-b border-neutral-800 pb-3">
            <span className="text-xs font-mono text-lime-400 font-bold uppercase tracking-widest">// Semantic Entity settings</span>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Target Schema Object Type</label>
            <select
              value={schemaType}
              onChange={(e) => setSchemaType(e.target.value as any)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-2 text-xs font-mono"
            >
              <option value="local">Local Business Profile</option>
              <option value="article">Article Asset Information</option>
            </select>
          </div>

          {schemaType === "local" ? (
            <>
              <div className="space-y-1">
                <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Company Legal Registered Name</label>
                <input
                  type="text"
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-3 py-2 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Canonical Web Address</label>
                <input
                  type="url"
                  value={bizUrl}
                  onChange={(e) => setBizUrl(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-3 py-2 text-xs font-mono"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Editorial Article Headline</label>
                <input
                  type="text"
                  value={artTitle}
                  onChange={(e) => setArtTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-3 py-2 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Author Individual Name Reference</label>
                <input
                  type="text"
                  value={artAuthor}
                  onChange={(e) => setArtAuthor(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-3 py-2 text-xs font-mono"
                />
              </div>
            </>
          )}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md flex flex-col justify-between">
          <div>
            <div className="border-b border-neutral-800 pb-3 mb-5">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">// Script tag markup output</span>
            </div>

            <pre className="bg-neutral-950 border border-neutral-850 p-4 rounded text-xs font-mono text-lime-400 max-h-72 overflow-y-auto whitespace-pre">
              {compiledJson}
            </pre>
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText(compiledJson);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
            className="w-full mt-6 py-3 px-4 rounded bg-lime-400 hover:bg-lime-500 text-black text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
          >
            {copied ? "Copied ✓" : "Copy script structured data"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REDIRECT RULES BUILDER
// ─────────────────────────────────────────────────────────────────────────────
export function RedirectGenerator() {
  const [serverType, setServerType] = useState<"htaccess" | "nginx">("htaccess");
  const [redirectStatus, setRedirectStatus] = useState<"301" | "302">("301");
  const [oldPath, setOldPath] = useState("/old-slug-path");
  const [newUrl, setNewUrl] = useState("https://kee2solv.in/new-endpoints");
  const [compiledRule, setCompiledRule] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let out = "";
    if (serverType === "htaccess") {
      out = `Redirect ${redirectStatus} ${oldPath} ${newUrl}`;
    } else {
      out = `rewrite ^${oldPath}$ ${newUrl} ${redirectStatus === "301" ? "permanent" : "redirect"};`;
    }
    setCompiledRule(out);
  }, [serverType, redirectStatus, oldPath, newUrl]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md space-y-4">
          <div className="border-b border-neutral-800 pb-3">
            <span className="text-xs font-mono text-lime-400 font-bold uppercase tracking-widest">// Redirection router setup</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Web server engine type</label>
              <select
                value={serverType}
                onChange={(e) => setServerType(e.target.value as any)}
                className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-2 text-xs font-mono"
              >
                <option value="htaccess">Apache Server (.htaccess)</option>
                <option value="nginx">NGINX Directives system</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">HTTP Redirect Status code</label>
              <select
                value={redirectStatus}
                onChange={(e) => setRedirectStatus(e.target.value as any)}
                className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-2.5 py-2 text-xs font-mono"
              >
                <option value="301">301 (Permanent Redirection)</option>
                <option value="302">302 (Temporary Move)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Origin source path (Old relative address)</label>
            <input
              type="text"
              value={oldPath}
              onChange={(e) => setOldPath(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-3 py-2 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Destination absolute address url (New target)</label>
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-3 py-2 text-xs font-mono"
                />
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md flex flex-col justify-between">
          <div>
            <div className="border-b border-neutral-800 pb-3 mb-5">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">// Rewrite compiled rules syntax</span>
            </div>

            <pre className="bg-neutral-950 border border-neutral-850 p-4 rounded text-xs font-mono text-lime-400 max-h-72 overflow-y-auto whitespace-pre">
              {compiledRule}
            </pre>
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText(compiledRule);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
            className="w-full mt-6 py-3 px-4 rounded bg-lime-400 hover:bg-lime-500 text-black text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
          >
            {copied ? "Copied ✓" : "Copy rule configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SERP SNIPPET PREVIEWER & PIXEL COUNTER
// ─────────────────────────────────────────────────────────────────────────────
export function PixelCounter() {
  const [title, setTitle] = useState("Kee2Solv — Free Privacy-First Browser Utilities (No Uploads)");
  const [description, setDescription] = useState(
    "Combine PDFs, rescale graphics, compile target robots configuration scripts, draft semantic structured tags, or calculate compounding budgets on-device."
  );
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [titlePixels, setTitlePixels] = useState(0);
  const [descPixels, setDescPixels] = useState(0);

  const testCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Measure pixel dimensions using canvas context simulating Google font sizes (Arial typography)
    if (!testCanvasRef.current) {
      testCanvasRef.current = document.createElement("canvas");
    }
    const ctx = testCanvasRef.current.getContext("2d");
    if (ctx) {
      ctx.font = "20px Arial";
      setTitlePixels(Math.round(ctx.measureText(title).width));

      ctx.font = "14px Arial";
      setDescPixels(Math.round(ctx.measureText(description).width));
    }
  }, [title, description]);

  const maxTitlePx = 600;
  const maxDescPx = 960;

  const truncateTextByPixels = (text: string, font: string, maxPx: number) => {
    if (!testCanvasRef.current) return text;
    const ctx = testCanvasRef.current.getContext("2d");
    if (!ctx) return text;

    ctx.font = font;
    if (ctx.measureText(text).width <= maxPx) return text;

    let lo = 0, hi = text.length;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (ctx.measureText(text.slice(0, mid) + "…").width <= maxPx) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    return text.slice(0, lo) + "…";
  };

  const truncatedTitle = truncateTextByPixels(title, "20px Arial", maxTitlePx);
  const truncatedDesc = truncateTextByPixels(description, "14px Arial", maxDescPx);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md space-y-4">
          <div className="border-b border-neutral-800 pb-3 mb-1">
            <span className="text-xs font-mono text-lime-400 font-bold uppercase tracking-widest">// Snippet details</span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">SEO Meta Title String</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-3 py-2 text-xs font-mono focus:outline-none"
            />
            <div className="flex justify-between text-[10px] font-mono text-neutral-500 uppercase">
              <span>{title.length} characters</span>
              <span className={titlePixels > maxTitlePx ? "text-red-400 font-bold" : "text-lime-400"}>
                {titlePixels}px / {maxTitlePx}px limits
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">SEO Meta Description Copy</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-250 rounded p-2.5 text-xs font-mono focus:outline-none"
            />
            <div className="flex justify-between text-[10px] font-mono text-neutral-500 uppercase">
              <span>{description.length} characters</span>
              <span className={descPixels > maxDescPx ? "text-red-400 font-bold" : "text-lime-400"}>
                {descPixels}px / {maxDescPx}px limits
              </span>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-neutral-800 pb-3 flex justify-between items-baseline">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">// Google Visual Simulator Panel</span>
              <div className="flex gap-1.5 bg-neutral-950 p-1 border border-neutral-800 rounded">
                <button
                  onClick={() => setViewMode("desktop")}
                  className={`px-2 py-0.5 text-[9px] font-mono uppercase font-bold rounded ${
                    viewMode === "desktop" ? "bg-lime-400 text-black animate-scale-in" : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  Desktop
                </button>
                <button
                  onClick={() => setViewMode("mobile")}
                  className={`px-2 py-0.5 text-[9px] font-mono uppercase font-bold rounded ${
                    viewMode === "mobile" ? "bg-lime-400 text-black animate-scale-in" : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  Mobile
                </button>
              </div>
            </div>

            <div className="bg-white p-6 border border-neutral-200 rounded">
              <div className={`space-y-1 ${viewMode === "mobile" ? "max-w-[370px] mx-auto border-x border-dashed border-neutral-200 px-2" : ""}`}>
                <div className="text-[11px] text-neutral-500 font-sans leading-none flex items-center gap-1 mb-1.5">
                  <span className="w-4 h-4 bg-lime-400 rounded-full inline-grid place-items-center text-[8px] font-bold text-black font-mono">K</span>
                  <span>https://kee2solv.in &gt; toolkit &gt; utility</span>
                </div>

                <div className="text-lg text-blue-800 hover:underline font-sans font-medium hover:cursor-pointer leading-tight mb-1">
                  {truncatedTitle || "Drafting heading..."}
                </div>

                <p className="text-xs text-neutral-600 font-sans leading-snug">
                  {truncatedDesc || "Awaiting description data snippet..."}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-neutral-950/40 border border-neutral-850 rounded text-center text-[10px] font-mono text-neutral-500 uppercase mt-4">
            Adjust coordinates until indicators turn green for maximum crawl visibility.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CASE CONVERTER
// ─────────────────────────────────────────────────────────────────────────────
export function CaseConverter() {
  const [inputText, setInputText] = useState("acme performance digital networks. everything runs 100% in local memory.");
  const [outputText, setOutputText] = useState("");
  const [copied, setCopied] = useState(false);

  const handleConverter = (mode: "upper" | "lower" | "title" | "sentence") => {
    let result = "";
    if (mode === "upper") {
      result = inputText.toUpperCase();
    } else if (mode === "lower") {
      result = inputText.toLowerCase();
    } else if (mode === "title") {
      result = inputText.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    } else if (mode === "sentence") {
      result = inputText
        .toLowerCase()
        .replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());
    }
    setOutputText(result);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md space-y-4">
          <div className="border-b border-neutral-800 pb-3">
            <span className="text-xs font-mono text-lime-400 font-bold uppercase tracking-widest">// Copywriting text string</span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Source copy details text</label>
            <textarea
              rows={5}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-250 rounded p-2.5 text-xs font-mono focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {(["upper", "lower", "title", "sentence"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => handleConverter(mode)}
                className="py-1.5 bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 rounded font-mono text-[10px] uppercase font-bold tracking-wider transition cursor-pointer"
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md flex flex-col justify-between">
          <div>
            <div className="border-b border-neutral-800 pb-3 mb-5">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">// Reformed string output</span>
            </div>

            <textarea
              rows={5}
              readOnly
              value={outputText}
              placeholder="Case-modified copywriting text displays here..."
              className="w-full bg-neutral-950 border border-neutral-800 text-lime-400 rounded p-2.5 text-xs font-mono focus:outline-none resize-none"
            />
          </div>

          <button
            onClick={() => {
              if (!outputText.trim()) return;
              navigator.clipboard.writeText(outputText);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
            disabled={!outputText.trim()}
            className="w-full py-3 px-4 rounded bg-lime-400 hover:bg-lime-500 text-black text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-45 mt-6"
          >
            {copied ? "Copied ✓" : "Copy reformed text"}
          </button>
        </div>
      </div>
    </div>
  );
}
