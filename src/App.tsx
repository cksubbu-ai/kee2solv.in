/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Layers,
  Scissors,
  FolderDown,
  Image,
  Maximize2,
  FileCode,
  Link2,
  QrCode,
  Bot,
  Compass,
  Tags,
  RefreshCw,
  Eye,
  Type,
  TrendingUp,
  PieChart,
  Percent,
  IndianRupee,
  Search,
  Home,
  Info,
  ChevronRight,
  BookOpen,
  Lock
} from "lucide-react";

import { ActiveTab, ToolDefinition } from "./types";
import { TOOLS_LIST, TOOL_CATEGORIES, TOOL_FAQS } from "./data";

// Import compiled modular components
import { PdfMerger, PdfSplitter, PdfCompressor } from "./components/DocumentTools";
import { ImageConverter, ImageResizer, BackgroundRemover, SvgEditor } from "./components/ImageTools";
import {
  UtmBuilder,
  QrCreator,
  RobotsGenerator,
  SitemapGenerator,
  SchemaGenerator,
  RedirectGenerator,
  PixelCounter,
  CaseConverter
} from "./components/MarketingTools";
import {
  SipCalculator,
  MutualFundCalculator,
  ProvidentFundCalculator,
  BudgetCalc
} from "./components/FinancialTools";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [searchQuery, setSearchQuery] = useState("");

  const handleToolClick = (id: ActiveTab) => {
    setActiveTab(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Helper to resolve clean categories representation
  const getCategoryName = (catKey: string) => {
    return TOOL_CATEGORIES.find((c) => c.id === catKey)?.name || catKey;
  };

  // Filter tools based on user search query
  const filteredTools = TOOLS_LIST.filter((t) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      t.name.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query) ||
      t.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  // Dynamically resolve standard Lucide Icons for each tool
  const getToolIcon = (iconName: string) => {
    switch (iconName) {
      case "FileMerge":
        return <Layers className="h-4 w-4" />;
      case "FileUp":
        return <Scissors className="h-4 w-4 text-emerald-400" />;
      case "FileDown":
        return <FolderDown className="h-4 w-4 text-sky-400" />;
      case "Image":
        return <Image className="h-4 w-4" />;
      case "Maximize":
        return <Maximize2 className="h-4 w-4" />;
      case "Scissors":
        return <Scissors className="h-4 w-4" />;
      case "Paintbrush":
        return <FileCode className="h-4 w-4 text-pink-400" />;
      case "Link2":
        return <Link2 className="h-4 w-4" />;
      case "QrCode":
        return <QrCode className="h-4 w-4 text-cyan-400" />;
      case "Bot":
        return <Bot className="h-4 w-4" />;
      case "Compass":
        return <Compass className="h-4 w-4 text-rose-400" />;
      case "Share2":
        return <Tags className="h-4 w-4" />;
      case "RefreshCw":
        return <RefreshCw className="h-4 w-4" />;
      case "Layout":
        return <Eye className="h-4 w-4 text-amber-400" />;
      case "Type":
        return <Type className="h-4 w-4" />;
      case "TrendingUp":
        return <TrendingUp className="h-4 w-4 text-lime-400" />;
      case "PieChart":
        return <PieChart className="h-4 w-4" />;
      case "Percent":
        return <Percent className="h-4 w-4" />;
      case "IndianRupee":
        return <IndianRupee className="h-4 w-4 text-lime-400" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  // Render the currently selected utility workspace
  const renderActiveWorkspace = () => {
    switch (activeTab) {
      case "pdf-merger":
        return <PdfMerger />;
      case "pdf-splitter":
        return <PdfSplitter />;
      case "pdf-compressor":
        return <PdfCompressor />;
      case "image-converter":
        return <ImageConverter />;
      case "image-resizer":
        return <ImageResizer />;
      case "background-remover":
        return <BackgroundRemover />;
      case "svg-editor":
        return <SvgEditor />;
      case "utm-builder":
        return <UtmBuilder />;
      case "qr-creator":
        return <QrCreator />;
      case "robots-generator":
        return <RobotsGenerator />;
      case "sitemap-generator":
        return <SitemapGenerator />;
      case "schema-generator":
        return <SchemaGenerator />;
      case "redirect-generator":
        return <RedirectGenerator />;
      case "pixel-counter":
        return <PixelCounter />;
      case "case-converter":
        return <CaseConverter />;
      case "sip-calc":
        return <SipCalculator />;
      case "mf-calc":
        return <MutualFundCalculator />;
      case "pf-calc":
        return <ProvidentFundCalculator />;
      case "budget-calc":
        return <BudgetCalc />;
      case "about-us":
        return (
          <article className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm space-y-5 max-w-3xl leading-relaxed text-sm text-slate-600">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-extrabold font-sans text-slate-900">Kee2 Initiatives Manifesto</h2>
              <p className="text-xs text-slate-400 mt-1">Our commitment to zero-friction, privacy-first computing.</p>
            </div>
            <p>
              The <strong className="text-slate-800">Kee2 Initiatives</strong> program builds high-performance, privacy-isolated utilities designed for creators, web practitioners, and financial planners.
            </p>
            <p>
              We believe that everyday tools should be simple, instantaneous, and entirely borderless. Kee2 operates without user sign-ups, subscriptions, or intrusive cookie tracking frameworks.
            </p>
            <p>
              By shifting processing logic from remote clouds into modern browser engines, we guarantee your documents, images, and marketing variables never leave your device. Secure by default, serverless by design.
            </p>
          </article>
        );
      case "home":
      default:
        return (
          <div className="space-y-10 animate-fade-in">
             {/* Minimal Display Greeting & Responsive Search Banner */}
             <section className="border-b border-slate-200 pb-8 animate-fade-in" aria-labelledby="main-heading">
               <h1 id="main-heading" className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                 Kee2Solv Free Privacy-First Web Utilities
               </h1>
               <p className="text-slate-500 text-sm mt-2 max-w-2xl leading-relaxed">
                 Secure browser-based tools for compiling PDFs, cropping and converting images, formatting UTM campaigns, and calculating mutual fund yields. Everything runs 100% serverlessly with zero uploads.
               </p>

               {/* Tactile, highly responsive Mobile-First Search Bar */}
               <div className="mt-6 relative max-w-lg w-full">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                 <input
                   type="text"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder="Search all local browser utilities..."
                   className="w-full bg-white border border-slate-200 rounded-full py-3.5 pl-11 pr-4 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm transition"
                 />
               </div>
             </section>

            {/* Category Directory */}
            <div className="space-y-12">
              {TOOL_CATEGORIES.map((cat) => {
                const catTools = filteredTools.filter((t) => t.category === cat.id);
                if (catTools.length === 0) return null;

                return (
                  <div key={cat.id} className="space-y-6">
                    <div className="flex items-center gap-3">
                      <h2 className="text-sm font-bold font-sans text-slate-900">
                        {cat.name}
                      </h2>
                      <div className="flex-grow h-px bg-slate-100" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {catTools.map((tool) => (
                        <div
                          key={tool.id}
                          onClick={() => handleToolClick(tool.id)}
                          className="bg-white border border-slate-200 hover:border-blue-600 hover:shadow-md p-5 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between group"
                        >
                          <div className="space-y-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-10 h-10 ${
                                tool.category === "documents" ? "bg-red-50 text-red-650" :
                                tool.category === "images" ? "bg-orange-50 text-orange-650" :
                                tool.category === "marketing" ? "bg-blue-50 text-blue-650" :
                                "bg-emerald-50 text-emerald-650"
                              } rounded-xl flex items-center justify-center`}>
                                {getToolIcon(tool.icon)}
                              </div>
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {tool.name}
                              </h3>
                              <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-3">
                                {tool.description}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                            <span>Click Here</span>
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Promo Banner / Trust section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                <div className="col-span-1 md:col-span-3 bg-gradient-to-r from-slate-900 to-blue-900 rounded-2xl p-6 text-white flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-bold">Why Kee2Solv?</h4>
                    <p className="text-slate-300 text-sm mt-1">Standard tools upload your files to servers. We don't.<br />Everything stays inside your browser memory context.</p>
                    <button onClick={() => handleToolClick("about-us")} className="mt-4 px-6 py-2 bg-white text-slate-900 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors cursor-pointer">Learn more about privacy</button>
                  </div>
                  <div className="hidden lg:block pr-8">
                     <svg className="w-20 h-20 opacity-20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Standalone Security block */}
            <section className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex gap-4 items-start">
              <div className="p-2 border border-blue-500/20 bg-blue-50 rounded-xl text-blue-600 shrink-0">
                <Lock className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">100% Client-Side Privacy Isolation</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                  Kee2Solv executes every single operation—whether loading PDFs, stripping background images, compiling XML sitemaps, or computing financial interest—strictly inside your browser memory cache. Zero server latency, 100% private.
                </p>
              </div>
            </section>
          </div>
        );
    }
  };

  const selectedTool = TOOLS_LIST.find((t) => t.id === activeTab);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-700 flex flex-col font-sans select-none antialiased selection:bg-blue-100 selection:text-blue-900">
      
      {/* Dynamic Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div
            onClick={() => handleToolClick("home")}
            className="flex items-center gap-3 shrink-0 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/15 group-hover:scale-105 transition-transform duration-200">
              <svg className="w-5.5 h-5.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
                <path d="M13.5 8h2.5" strokeWidth="2.5" />
                <path d="M13 11h3.5" strokeWidth="2.5" />
                <path d="M13.5 14h2" strokeWidth="2.5" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-slate-900 group-hover:text-blue-650 transition-colors flex items-center gap-0.5">
                Kee<span className="text-blue-600">2</span>Solv<span className="text-blue-600 font-extrabold text-xs">.in</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block -mt-0.5">
                Toolkit Hub
              </span>
            </div>
          </div>

          {/* Quick Search - hidden on mobile, highly visible on desktops */}
          <div className="relative max-w-sm w-full hidden md:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab !== "home") setActiveTab("home");
              }}
              placeholder="Search tools (e.g. PDF Compressor)..."
              className="w-full bg-slate-100 border-none outline-none rounded-full py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 transition"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* 100% Privacy-First pulsing green badge - hidden on very small screens */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-[10px] font-bold tracking-wider uppercase shrink-0">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              100% Private
            </div>

            <button
              onClick={() => handleToolClick("about-us")}
              className={`px-3 py-1.5 border rounded-lg text-[10px] font-sans uppercase tracking-wider font-bold transition flex items-center gap-1 cursor-pointer shrink-0 ${
                activeTab === "about-us"
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Manifesto</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid View */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row gap-6">
        
        {/* Sidebar Nav */}
        <aside className="hidden md:block w-64 shrink-0 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-6 shadow-sm">
            {TOOL_CATEGORIES.map((cat) => {
              const catTools = TOOLS_LIST.filter((t) => t.category === cat.id);

              return (
                <div key={cat.id} className="space-y-1.5">
                  <span className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 px-1">
                    {cat.name}
                  </span>
                  <div className="space-y-0.5">
                    {catTools.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleToolClick(t.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-sans transition font-medium flex items-center justify-between cursor-pointer ${
                          activeTab === t.id
                            ? "bg-blue-50 text-blue-700 font-semibold"
                            : "bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <span className="truncate">{t.name}</span>
                        {activeTab === t.id && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed font-sans">
              <strong>Offline-First Security</strong> — Every operation runs completely inside your browser sandbox. Your data never leaves your device.
            </div>
          </div>
        </aside>

        {/* Dynamic Workspace Block */}
        <section className="flex-grow min-w-0 space-y-8">
          {/* Breadcrumbs for tool views - optimized with visual tags and 44px+ touch-friendly target back button */}
          {activeTab !== "home" && selectedTool && (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] font-sans text-slate-400 uppercase tracking-wider mb-2">
              <button 
                onClick={() => handleToolClick("home")}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl transition-colors cursor-pointer text-[10px] min-h-[36px]"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Back to Hub</span>
              </button>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
              <span className="hidden sm:inline bg-slate-50 text-slate-500 px-2 py-2 rounded-lg text-[9px] font-semibold">{getCategoryName(selectedTool.category)}</span>
              <ChevronRight className="hidden sm:inline h-3.5 w-3.5 text-slate-300" />
              <span className="text-blue-600 font-extrabold bg-blue-50 px-3 py-2 rounded-lg text-[10px]">{selectedTool.name}</span>
            </div>
          )}

          <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm">
            {renderActiveWorkspace()}
          </div>

          {/* Substantive Context FAQs appended directly below active workspace */}
          {activeTab !== "home" && activeTab !== "about-us" && TOOL_FAQS[activeTab]?.length > 0 && (
            <section className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm space-y-4">
              <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Frequently Asked Questions</span>
              <div className="space-y-4 divide-y divide-slate-100">
                {TOOL_FAQS[activeTab].map((faq, i) => (
                  <div key={i} className={`space-y-1 ${i > 0 ? "pt-4" : ""}`}>
                    <h4 className="text-slate-800 font-semibold font-sans text-xs">{faq.q}</h4>
                    <p className="text-slate-500 text-xs leading-relaxed max-w-3xl">{faq.a}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </section>

      </main>

      {/* Footer Status Bar */}
      <footer className="py-6 bg-white border-t border-slate-200 px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest shrink-0 mt-12 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-8 items-center text-center">
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> Local Node: Online</span>
          <span>Cloud Sync: Disabled</span>
        </div>
        <div className="flex gap-6 items-center">
          <a onClick={() => handleToolClick("about-us")} className="hover:text-slate-600 transition-colors cursor-pointer">Manifesto</a>
          <a onClick={() => handleToolClick("home")} className="hover:text-slate-600 transition-colors cursor-pointer font-bold text-blue-600">Kee2Solv.in © 2026</a>
        </div>
      </footer>
    </div>
  );
}
