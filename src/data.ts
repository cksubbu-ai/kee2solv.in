/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolDefinition } from "./types";

export const TOOL_CATEGORIES = [
  { id: "documents", name: "Documents & PDFs", desc: "Merge, split, or compress files serverlessly directly inside your browser cache." },
  { id: "images", name: "Images & Creative", desc: "Canvas-powered conversion, resizing, vector optimization, and mock editing." },
  { id: "marketing", name: "Technical SEO & Marketing", desc: "Omnichannel link systems, metadata simulators, crawl directives, schema compilations." },
  { id: "finance", name: "Financial Planners", desc: "Interest compounding growth graphs, provident fund metrics, budget trackers." }
] as const;

export const TOOLS_LIST: ToolDefinition[] = [
  // Documents
  {
    id: "pdf-merger",
    category: "documents",
    name: "PDF Merger",
    description: "Combine multiple PDF files into one single document. Reorder pages securely locally inside your frame.",
    icon: "FileMerge",
    tags: ["pdf", "merge", "combine", "join", "document"]
  },
  {
    id: "pdf-splitter",
    category: "documents",
    name: "PDF Splitter",
    description: "Split pages from a PDF document. Select custom ranges visually and generate independent single-pagers.",
    icon: "FileUp",
    tags: ["pdf", "split", "extract", "pages"]
  },
  {
    id: "pdf-compressor",
    category: "documents",
    name: "PDF Compressor",
    description: "Shrink file size of image-intensive PDFs by recalculating in-memory raster assets with custom quality presets.",
    icon: "FileDown",
    tags: ["pdf", "compress", "resize", "shrink"]
  },
  // Images
  {
    id: "image-converter",
    category: "images",
    name: "Format Converter",
    description: "Cross-convert image media containers between JPEG, PNG, or high-performance WebP formats natively.",
    icon: "Image",
    tags: ["image", "convert", "jpeg", "png", "webp", "format"]
  },
  {
    id: "image-resizer",
    category: "images",
    name: "Resizer & Cropper",
    description: "Scale dimensions dynamically with custom aspect ratio options, proportional locks, or freeform canvas crops.",
    icon: "Maximize",
    tags: ["image", "resize", "crop", "scale", "dimensions"]
  },
  {
    id: "background-remover",
    category: "images",
    name: "Background Remover",
    description: "Remove background layers using standard Canvas transparent segment thresholds or chroma key mock filters.",
    icon: "Scissors",
    tags: ["image", "background", "remove", "transparent", "chroma"]
  },
  {
    id: "svg-editor",
    category: "images",
    name: "SVG Vector Editor",
    description: "Draft code-level SVG vectors, overwrite fills with automatic Hex parameters, preview live changes, and export cleanly.",
    icon: "Paintbrush",
    tags: ["svg", "vector", "editor", "xml", "color"]
  },
  // Marketing & SEO
  {
    id: "utm-builder",
    category: "marketing",
    name: "Bulk UTM Builder",
    description: "Generate omnichannel marketing tracking links dynamically for Google, Facebook, LinkedIn, TikTok, or Custom nodes.",
    icon: "Link2",
    tags: ["utm", "campaign", "ads", "analytics", "parameters"]
  },
  {
    id: "qr-creator",
    category: "marketing",
    name: "Dynamic QR Creator",
    description: "Convert URLs, payloads, contacts, or texts into high-accuracy, scannable QR matrices in full color.",
    icon: "QrCode",
    tags: ["qr", "code", "generator", "matrix", "scanner"]
  },
  {
    id: "robots-generator",
    category: "marketing",
    name: "Robots.txt Generator",
    description: "Build directive rules. Block crawler scrapers, allocate crawl-delay budgets, and connect canonical sitemaps.",
    icon: "Bot",
    tags: ["robots", "crawl", "seo", "txt", "disallow"]
  },
  {
    id: "sitemap-generator",
    category: "marketing",
    name: "XML Sitemap Generator",
    description: "Format full sets of URL structures into high-standard crawlable sitemaps ready for search engine indexing.",
    icon: "Compass",
    tags: ["sitemap", "xml", "index", "crawl"]
  },
  {
    id: "schema-generator",
    category: "marketing",
    name: "Schema JSON-LD Gen",
    description: "Structure semantic objects for Local Businesses or editorial Articles to trigger high-visibility web search rich snippets.",
    icon: "Share2",
    tags: ["schema", "structured", "metadata", "json-ld"]
  },
  {
    id: "redirect-generator",
    category: "marketing",
    name: "Redirect Rules Builder",
    description: "Write perfect URL redirection rewriting patterns for Apache .htaccess or modern NGINX servers in seconds.",
    icon: "RefreshCw",
    tags: ["redirect", "htaccess", "nginx", "rewrite"]
  },
  {
    id: "pixel-counter",
    category: "marketing",
    name: "SERP Pixel Counter",
    description: "Preview how listing titles and description meta look on Google's desktop or mobile, with pixel-width limits.",
    icon: "Layout",
    tags: ["serp", "meta", "pixel", "seo", "google"]
  },
  {
    id: "case-converter",
    category: "marketing",
    name: "Case Converter",
    description: "Convert typography files seamlessly across UPPERCASE, lowercase, Title Case, or correct Sentence capitalizations.",
    icon: "Type",
    tags: ["case", "typography", "capitalize", "sentence"]
  },
  // Finance
  {
    id: "sip-calc",
    category: "finance",
    name: "SIP Calculator",
    description: "Delineate capital accumulation curves on monthly Systematic Investment Plans with compound interest projections.",
    icon: "TrendingUp",
    tags: ["sip", "invest", "finance", "savings", "compound"]
  },
  {
    id: "mf-calc",
    category: "finance",
    name: "Mutual Fund Calculator",
    description: "Project compounding outcomes on lump-sum mutual funds based on standard annualized percentage returns.",
    icon: "PieChart",
    tags: ["mutual-fund", "lumpsum", "finance", "compound"]
  },
  {
    id: "pf-calc",
    category: "finance",
    name: "Provident Fund Calc",
    description: "Estimate cumulative future wealth totals inside statutory Provident Fund structures with matching employee payouts.",
    icon: "Percent",
    tags: ["pf", "provident", "salary", "retirement"]
  },
  {
    id: "budget-calc",
    category: "finance",
    name: "50/30/20 Budget Planner",
    description: "Apportion net liquid revenue pools cleanly across essential Needs (50%), Wants (30%), and capital Savings (20%).",
    icon: "IndianRupee",
    tags: ["budget", "finance", "needs", "savings", "allocator"]
  }
];

export const TOOL_FAQS: Record<string, { q: string; a: string }[]> = {
  "pdf-merger": [
    {
      q: "Is merging PDF documents entirely secure on Kee2Solv?",
      a: "Yes. Every byte of your source documents is read into your browser's private canvas sandbox through JavaScript. No server transmission occurs. The merged output is built on-the-fly inside the tab context, remaining entirely detached from internet records."
    },
    {
      q: "Does the output PDF remain selectable and searchable?",
      a: "Naturally. The merger utilizes vector streams to combine document catalogs directly. Embedded text encoding indexes, formatting attributes, and font arrays are duplicated cleanly into the output file so selection matches work immediately."
    }
  ],
  "pdf-splitter": [
    {
      q: "How can I extract non-contiguous segments of pages?",
      a: "Our PDF page extractor accepts flexible range variables. You can easily pass segmented coordinates separated by commas (e.g., '1-3, 5, 8-12') or select them visual-first using individual canvas thumbnail indicators."
    }
  ],
  "pdf-compressor": [
    {
      q: "Which compression parameters should I select?",
      a: "Use target 'Low' for heavy high-density print graphics to maintain pixel fidelity. 'Medium' serves as a balanced baseline for corporate email pipelines, while 'High' drastically downsamples image resources to decrease overall sizing under cloud storage thresholds."
    }
  ],
  "utm-builder": [
    {
      q: "Why should we build tracking links in bulk?",
      a: "Standardizing url parameter formatting protects analytics pipeline integrity. A single typo in Campaign Medium values (such as mixing 'Social' and 'social') creates split data records inside Google Analytics dashboards. Kee2Solv ensures total uniform output rules are verified client-side."
    }
  ],
  "pixel-counter": [
    {
      q: "Why do we evaluate SEO meta boundaries in pixels instead of characters?",
      a: "Modern search engines employ proportional custom fonts (Arial/Roboto) to display titles. Consequently, character-count approximations are inaccurate because a wide letter like 'W' occupies triple the horizontal pixel bounds of a thin letter like 'i'. Measuring actual canvas pixel limits guarantees your headings are never clipped under standard viewport layouts."
    }
  ],
  "background-remover": [
    {
      q: "How does the browser-native background remover operate?",
      a: "Our client utilizes visual canvas data-array scanning, transparency thresholds, and clean matrix filtering techniques. If full AI segmentation is requested, weights can be fetched dynamically to execute local edge-detection inside user-sessions, keeping inputs 100% cloud-isolated."
    }
  ]
};
