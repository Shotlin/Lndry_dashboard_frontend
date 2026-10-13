// Live SEO scoring used in the editor. Pure functions so the same rules can be
// run in the browser (instant feedback) and in tests.
import { countWords, slugify, stripHtml } from "./blog-text";

export type CheckStatus = "good" | "warn" | "bad";

export interface SeoCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  weight: number;
}

export interface SeoInput {
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  focusKeyword: string;
  metaTitle: string;
  metaDescription: string;
  coverImageUrl: string;
  coverImageAlt: string;
}

export interface SeoReport {
  score: number;
  grade: "good" | "ok" | "poor";
  checks: SeoCheck[];
  wordCount: number;
}

export const SEO_TITLE_RANGE = [30, 60] as const;
export const SEO_DESCRIPTION_RANGE = [120, 160] as const;

const norm = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu, " ").replace(/\s+/g, " ").trim();

function countOccurrences(haystack: string, needle: string) {
  if (!needle) return 0;
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    count += 1;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}

export function analyzeSeo(input: SeoInput): SeoReport {
  const checks: SeoCheck[] = [];
  const add = (id: string, label: string, weight: number, status: CheckStatus, detail: string) =>
    checks.push({ id, label, weight, status, detail });

  const html = input.contentHtml || "";
  const text = stripHtml(html);
  const words = countWords(text);
  const keyword = norm(input.focusKeyword);
  const seoTitle = (input.metaTitle || input.title).trim();
  const description = (input.metaDescription || input.excerpt).trim();

  // --- Search result snippet
  const [tMin, tMax] = SEO_TITLE_RANGE;
  add(
    "title-length",
    "SEO title length",
    10,
    seoTitle.length === 0 ? "bad" : seoTitle.length >= tMin && seoTitle.length <= tMax ? "good" : "warn",
    seoTitle.length === 0
      ? "Add a title."
      : `${seoTitle.length} characters. Aim for ${tMin}–${tMax} so Google shows it in full.`,
  );

  const [dMin, dMax] = SEO_DESCRIPTION_RANGE;
  add(
    "description-length",
    "Meta description length",
    10,
    description.length === 0 ? "bad" : description.length >= dMin && description.length <= dMax ? "good" : "warn",
    description.length === 0
      ? "Write a meta description — it is the text under your title in Google."
      : `${description.length} characters. Aim for ${dMin}–${dMax}.`,
  );

  const slugWords = input.slug.split("-").filter(Boolean).length;
  add(
    "slug",
    "URL is short and readable",
    5,
    !input.slug ? "bad" : input.slug.length <= 60 && slugWords <= 8 ? "good" : "warn",
    !input.slug ? "Add a URL slug." : `/blog/${input.slug} — keep it under 60 characters and 8 words.`,
  );

  // --- Content
  add(
    "length",
    "Article length",
    12,
    words >= 600 ? "good" : words >= 300 ? "warn" : "bad",
    `${words} words. 600+ words usually ranks better; under 300 is thin content.`,
  );

  const h2Count = (html.match(/<h2[\s>]/gi) ?? []).length;
  add(
    "headings",
    "Subheadings (H2)",
    8,
    h2Count >= 2 ? "good" : h2Count === 1 ? "warn" : "bad",
    h2Count >= 2 ? `${h2Count} H2 sections break the article up well.` : "Add at least two H2 subheadings.",
  );

  // --- Focus keyword
  if (!keyword) {
    for (const [id, label, weight] of [
      ["kw-title", "Keyword in SEO title", 8],
      ["kw-description", "Keyword in meta description", 6],
      ["kw-slug", "Keyword in URL", 5],
      ["kw-intro", "Keyword in first paragraph", 8],
      ["kw-heading", "Keyword in a subheading", 5],
      ["kw-density", "Keyword density", 5],
    ] as const) {
      add(id, label, weight, "bad", "Set a focus keyword (the phrase people would search for).");
    }
    add("kw-set", "Focus keyword chosen", 8, "bad", "Pick one phrase this article should rank for, e.g. “dry cleaning in Pune”.");
  } else {
    add("kw-set", "Focus keyword chosen", 8, "good", `Targeting “${input.focusKeyword.trim()}”.`);
    add("kw-title", "Keyword in SEO title", 8, norm(seoTitle).includes(keyword) ? "good" : "bad",
      norm(seoTitle).includes(keyword) ? "Keyword appears in the title." : "Put the keyword in the SEO title, ideally near the start.");
    add("kw-description", "Keyword in meta description", 6, norm(description).includes(keyword) ? "good" : "warn",
      norm(description).includes(keyword) ? "Keyword appears in the description." : "Mention the keyword in the meta description.");
    const slugKeyword = slugify(keyword);
    add("kw-slug", "Keyword in URL", 5, slugKeyword && input.slug.includes(slugKeyword) ? "good" : "warn",
      slugKeyword && input.slug.includes(slugKeyword) ? "Keyword appears in the URL." : "Use the keyword in the URL slug.");
    const intro = norm(text.split(/\s+/).slice(0, 100).join(" "));
    add("kw-intro", "Keyword in first paragraph", 8, intro.includes(keyword) ? "good" : "bad",
      intro.includes(keyword) ? "Keyword appears in the first 100 words." : "Use the keyword within the first 100 words.");
    const headings = [...html.matchAll(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/gi)].map((m) => norm(stripHtml(m[1])));
    add("kw-heading", "Keyword in a subheading", 5, headings.some((h) => h.includes(keyword)) ? "good" : "warn",
      headings.some((h) => h.includes(keyword)) ? "A subheading contains the keyword." : "Use the keyword (or a close variant) in one subheading.");
    const keywordWords = keyword.split(" ").length;
    const occurrences = countOccurrences(norm(text), keyword);
    const density = words > 0 ? ((occurrences * keywordWords) / words) * 100 : 0;
    add("kw-density", "Keyword density", 5,
      density >= 0.5 && density <= 2.5 ? "good" : density > 2.5 ? "warn" : "warn",
      `${density.toFixed(1)}% (${occurrences}×). Healthy range is 0.5–2.5%${density > 2.5 ? " — avoid stuffing" : ""}.`);
  }

  // --- Media and links
  add("cover", "Cover image with alt text", 6,
    input.coverImageUrl ? (input.coverImageAlt.trim() ? "good" : "warn") : "bad",
    !input.coverImageUrl ? "Add a cover image — it is also your social share image."
      : input.coverImageAlt.trim() ? "Cover image has alt text." : "Describe the cover image in the alt text.");

  const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const missingAlt = images.filter((tag) => !/\balt="[^"]+"/i.test(tag)).length;
  add("img-alt", "Images have alt text", 4,
    images.length === 0 ? "warn" : missingAlt === 0 ? "good" : "bad",
    images.length === 0 ? "No images in the article body — one or two help readers and SEO."
      : missingAlt === 0 ? `All ${images.length} image(s) have alt text.` : `${missingAlt} image(s) are missing alt text.`);

  const links = [...html.matchAll(/<a\b[^>]*href="([^"]+)"/gi)].map((m) => m[1]);
  const internal = links.filter((href) => href.startsWith("/") || /^https?:\/\/(www\.)?lndry\.in/i.test(href)).length;
  const external = links.length - internal;
  add("internal-links", "Internal link", 5, internal >= 1 ? "good" : "warn",
    internal >= 1 ? `${internal} internal link(s).` : "Link to another LNDRY page (e.g. /services or /pricing).");
  add("external-links", "External link", 3, external >= 1 ? "good" : "warn",
    external >= 1 ? `${external} external link(s).` : "Link out to one trustworthy source.");

  // --- Readability
  const sentences = text.split(/[.!?]+\s/).filter((s) => countWords(s) > 0);
  const avg = sentences.length ? words / sentences.length : 0;
  add("readability", "Easy-to-read sentences", 4, avg === 0 ? "warn" : avg <= 20 ? "good" : avg <= 26 ? "warn" : "bad",
    avg === 0 ? "Write some content first." : `Average ${avg.toFixed(0)} words per sentence. Aim for 20 or fewer.`);

  const total = checks.reduce((sum, c) => sum + c.weight, 0);
  const earned = checks.reduce((sum, c) => sum + c.weight * (c.status === "good" ? 1 : c.status === "warn" ? 0.5 : 0), 0);
  const score = Math.round((earned / total) * 100);

  return { score, grade: score >= 80 ? "good" : score >= 55 ? "ok" : "poor", checks, wordCount: words };
}
