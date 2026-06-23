/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ActiveTab =
  | "home"
  | "pdf-merger"
  | "pdf-splitter"
  | "pdf-compressor"
  | "image-converter"
  | "image-resizer"
  | "background-remover"
  | "svg-editor"
  | "utm-builder"
  | "qr-creator"
  | "robots-generator"
  | "sitemap-generator"
  | "schema-generator"
  | "redirect-generator"
  | "pixel-counter"
  | "case-converter"
  | "sip-calc"
  | "mf-calc"
  | "pf-calc"
  | "budget-calc"
  | "about-us";

export interface ToolDefinition {
  id: ActiveTab;
  category: "documents" | "images" | "marketing" | "finance" | "other";
  name: string;
  description: string;
  icon: string;
  tags: string[];
}
