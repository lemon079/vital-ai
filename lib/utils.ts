import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Preprocesses AI-generated content before rendering it as Markdown.
 * This is a scalable formatter that normalizes HTML tags and layout formatting issues.
 */
export function preprocessMessageContent(content: string): string {
  if (!content) return "";

  return content
    // Normalize raw HTML line breaks (e.g. <br>, <br/>, <br  />) into standard Markdown newlines
    .replace(/<br\s*\/?>/gi, "\n")
    // Normalize raw bold tags (e.g. <b>Text</b> or <strong>Text</strong>) into standard Markdown bold (**Text**)
    .replace(/<b\s*>(.*?)<\/b>/gi, "**$1**")
    .replace(/<strong\s*>(.*?)<\/strong>/gi, "**$1**")
    // Normalize raw italic tags (e.g. <i>Text</i> or <em>Text</em>) into standard Markdown italic (*Text*)
    .replace(/<i\s*>(.*?)<\/i>/gi, "*$1*")
    .replace(/<em\s*>(.*?)<\/em>/gi, "*$1*")
    // Normalize multiple consecutive blank lines to keep text flow clean
    .replace(/\n{3,}/g, "\n\n");
}
