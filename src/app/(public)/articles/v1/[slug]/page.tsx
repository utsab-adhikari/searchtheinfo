"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

// Client components for share and views
import ViewsCounter from "./views-counter";
import ShareMenu from "./share-menu";
import CopyButton from "./copy-button";

// Professional typography
import { Inter } from "next/font/google";
import { useParams } from "next/navigation";
import { Sun } from "lucide-react";
const inter = Inter({ subsets: ["latin"] });

// Util: slugify (to match v2 layout behavior)
function slugify(input: string) {
  return (input || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function sectionId(section: any) {
  const base = slugify(section?.title || "section");
  const suffix = section?._id ? String(section._id) : "";
  return suffix ? `${base}-${suffix}` : base;
}

// Util: get optimized Cloudinary URL
function getOptimizedCloudinaryUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: "auto" | "webp" | "jpg" | "png";
  } = {},
): string {
  const { width, height, quality = 85, format = "auto" } = options;
  const cloudName =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return "";
  let transformations = `q_${quality},f_${format}`;
  if (width) transformations += `,w_${width}`;
  if (height) transformations += `,h_${height}`;
  transformations += ",c_limit";
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${publicId}`;
}

// Minimal shape of the article returned by /api/articles/v1/[slug]
interface ArticleDoc {
  _id: string;
  title: string;
  slug: string;
  abstract?: string;
  keywords?: string[];
  status?: string;
  category?: {
    _id: string;
    title: string;
    description?: string;
    slug?: string;
  } | null;
  authors?: Array<{
    name: string;
    affiliation?: string;
    email?: string;
  }>;
  sections?: any[];
  references?: any[];
  resources?: any[];
  scratchPad?: string;
  notes?: string;
  createdBy?: {
    _id: string;
    name?: string;
    email?: string;
  } | null;
  revisions?: any[];
  persistentId?: string;
  views?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

function getBaseUrl(): string {
  let base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
  if (base.endsWith("/")) base = base.slice(0, -1);
  return base;
}

function findFirstImagePublicId(article: any): string | null {
  for (const sec of article.sections || []) {
    for (const blk of sec.blocks || []) {
      if (blk.type === "image" && blk.image?.publicId)
        return blk.image.publicId;
      if (blk.type === "image" && blk.image?.url) return null;
    }
  }
  return null;
}

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<ArticleDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!slug) {
        setError("Missing article slug");
        setArticle(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/articles/v1/${encodeURIComponent(slug)}`);
        const data = (await res.json()) as {
          success: boolean;
          article?: ArticleDoc;
          message?: string;
        };

        if (!res.ok || !data.success || !data.article) {
          if (!cancelled) {
            setError(data.message || "Article not found");
            setArticle(null);
          }
          return;
        }

        if (!cancelled) {
          setArticle(data.article);
        }
      } catch (e) {
        if (!cancelled) {
          setError("Failed to load article");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-400">
        Loading article...
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-400">
        {error || "Article not found"}
      </div>
    );
  }

  const keywords = (article.keywords ?? []) as string[];
  const references = (article.references ?? []) as any[];
  const resources = (article.resources ?? []) as any[];

  const refIndexMap = new Map<string, number>();
  (article.references || []).forEach((r: any, i: number) => {
    if (r._id) refIndexMap.set(String(r._id), i + 1);
  });

  const created = new Date(article.createdAt);
  const updated = new Date(article.updatedAt);
  const authors = article.authors || [];

  const categoryTitle =
    article.category && typeof article.category === "object"
      ? article.category.title
      : null;
  const categorySlug =
    article.category && typeof article.category === "object"
      ? article.category.slug || slugify(article.category.title || "")
      : null;

  const baseForShare =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const shareUrl = `${baseForShare}/articles/v1/${article.slug}`;

  // Build ToC similar to v2 (with subtopics)
  const toc:
    | false
    | Array<{
        title: string;
        id: string;
        children?: Array<{ title: string; id: string }>;
      }> =
    Array.isArray(article.sections) &&
    article.sections.map((s: any) => ({
      title: s.title,
      id: sectionId(s),
      children:
        Array.isArray(s.children) &&
        s.children.map((c: any) => ({
          title: c.title,
          id: sectionId(c),
        })),
    }));

  return (
    <div
      className={`${inter.className} min-h-screen bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] text-neutral-100`}
    >
      <div className="relative z-10">
        <header className="relative">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            {/* Category badge */}
            {categoryTitle && (
              <div className="mb-4">
                <Link
                  href={`/categories/${categorySlug || slugify(categoryTitle)}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors text-xs font-medium uppercase tracking-wide border border-emerald-500/30"
                >
                  {categoryTitle}
                </Link>
              </div>
            )}

            {/* Title */}
            <h1 className="font-serif font-bold tracking-tight text-white leading-[1.15] text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-6">
              {article.title}
            </h1>

            {/* Authors (layout mirrored from v2) */}
            {authors.length > 0 && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  {authors.map((author: any, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-300 text-sm font-medium flex-shrink-0">
                        {author?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-neutral-100">
                          {author?.name}
                        </div>
                        {author?.affiliation && (
                          <div className="text-xs text-neutral-400">
                            {author.affiliation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata + view toggle + share/views (mirrors v2 structure) */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-400 border-t border-b border-neutral-800 py-3">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4" />
                <span>
                  Published
                  {" "}
                  {created.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>

              {updated.getTime() !== created.getTime() && (
                <>
                  <span className="text-neutral-600">•</span>
                  <div className="flex items-center gap-1.5">
                    <UpdateIcon className="w-4 h-4" />
                    <span>
                      Updated
                      {" "}
                      {updated.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </>
              )}

              {article.persistentId && (
                <>
                  <span className="text-neutral-600">•</span>
                  <span className="font-mono text-xs text-neutral-300">
                    DOI: {article.persistentId}
                  </span>
                </>
              )}

              <div className="ml-auto flex items-center gap-2">
                <Link
                  href={`/articles/v2/${article.slug}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/70 text-neutral-100 hover:bg-neutral-800 transition-colors border border-neutral-700 text-xs font-medium"
                >
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Light view</span>
                </Link>
                <ShareMenu
                  title={article.title}
                  url={shareUrl}
                  abstract={article.abstract || ""}
                />
                <ViewsCounter
                  slug={article.slug}
                  initialViews={article.views || 0}
                />
              </div>
            </div>

            {/* Keywords */}
            {keywords.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {keywords.map((keyword: string, index: number) => (
                  <span
                    key={index}
                    className="text-xs px-2.5 py-1 rounded-md bg-neutral-900/70 text-neutral-200 hover:bg-neutral-800 transition-colors"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Abstract Section */}
        {article.abstract && (
          <section className="">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <div className="px-6 md:px-8 border-l-5 border-emerald-500">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <AbstractIcon className="w-6 h-6 text-emerald-500" />
                  Abstract
                </h2>
                <p className="text-lg leading-relaxed text-neutral-300 whitespace-pre-wrap">
                  {article.abstract}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Main Content (aligned to v2 layout, dark theme) */}
        <main className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,780px)_280px] gap-12">
            {/* Article content */}
            <div>
              {/* Sections */}
              {article.sections?.length ? (
                <article className="space-y-12">
                  {article.sections.map((section: any, sectionIndex: number) => (
                    <SectionRenderer
                      key={section._id || sectionIndex}
                      section={section}
                      depth={1}
                      refIndexMap={refIndexMap}
                    />
                  ))}
                </article>
              ) : (
                <div className="text-center text-neutral-500 py-12">
                  No content sections.
                </div>
              )}

              {/* References Section (aligned to v2, dark theme) */}
              {references.length > 0 && (
                <section className="mt-16 pt-12 border-t-2 border-neutral-800">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-8 font-serif">
                    References
                  </h3>
                  <ol className="space-y-4">
                    {references.map((r: any, i: number) => (
                      <li
                        key={r._id || i}
                        id={`ref-${i + 1}`}
                        className="flex gap-4 text-sm md:text-base scroll-mt-28"
                      >
                        <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded bg-neutral-900 text-neutral-200 font-semibold text-xs border border-neutral-700">
                          {i + 1}
                        </span>
                        <div className="flex-1 text-neutral-200 leading-relaxed break-words">
                          <ReferenceLine r={r} index={i + 1} />
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {/* Resources Section (dark theme, same UI flow as v2) */}
              {resources.length > 0 && (
                <section className="mt-12">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 font-serif">
                      Additional Resources
                    </h2>
                  <div className="space-y-3">
                    {resources.map((r: any, i: number) => (
                      <div
                        key={r._id || i}
                        className="border border-neutral-800 rounded-lg p-5 bg-neutral-900/60 hover:border-neutral-700 hover:shadow-lg transition-all group"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 text-[11px] font-semibold uppercase tracking-wide border border-emerald-500/30">
                            {r.type}
                          </span>
                          {r.url && (
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-neutral-300 hover:text-white transition-colors p-1.5 rounded-md hover:bg-neutral-800"
                              title="Visit resource"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </a>
                          )}
                        </div>
                        <h4 className="font-semibold text-white group-hover:text-emerald-300 transition-colors mb-1">
                          {r.title}
                        </h4>
                        {r.author && (
                          <p className="text-sm text-neutral-400 mb-2">by {r.author}</p>
                        )}
                        {r.description && (
                          <p className="text-sm text-neutral-300 line-clamp-2">{r.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Article Footer */}
              <footer className="mt-24 pt-12 border-t border-neutral-800">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Article Information
                    </h3>
                    <div className="text-sm text-neutral-400 space-y-1">
                      <div>DOI: {article.persistentId || "Not assigned"}</div>
                      <div>Created by: {article.createdBy?.name || "Unknown"}</div>
                      <div>Revision count: {article.revisions?.length || 0}</div>
                    </div>
                  </div>
                  <div className="text-sm text-neutral-500">
                    © {new Date().getFullYear()} Research Archive. All rights
                    reserved.
                  </div>
                </div>
              </footer>
            </div>

            {/* Right sticky ToC (dark theme with subtopics like v2) */}
            <aside className="hidden lg:block">
              {toc && toc.length > 0 && (
                <nav className="sticky top-24">
                  <div className="border border-neutral-800 rounded-lg bg-neutral-900/70 p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">
                      Contents
                    </p>
                    <ul className="space-y-2.5 text-sm">
                      {toc.map((t: any) => (
                        <li key={t.id}>
                          <a
                            href={`#${t.id}`}
                            className="text-neutral-200 hover:text-emerald-300 transition-colors font-medium block"
                          >
                            {t.title}
                          </a>
                          {t.children && t.children.length > 0 && (
                            <ul className="mt-2 ml-3 space-y-2 border-l-2 border-neutral-800 pl-3">
                              {t.children.map((c: any) => (
                                <li key={c.id}>
                                  <a
                                    href={`#${c.id}`}
                                    className="text-neutral-400 hover:text-emerald-300 transition-colors block text-sm"
                                  >
                                    {c.title}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </nav>
              )}
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

// Helper function to render text with embedded links
function renderTextWithLinks(
  text: string | undefined,
  links: Array<{ text: string; url: string }> | undefined,
) {
  if (!text) return null;
  if (!links || links.length === 0) return text;

  // Sort links by text length (longest first) to avoid partial replacements
  const sortedLinks = [...links].sort((a, b) => b.text.length - a.text.length);

  let parts: (string | React.ReactNode)[] = [text];

  sortedLinks.forEach((link, linkIdx) => {
    const newParts: (string | React.ReactNode)[] = [];

    parts.forEach((part) => {
      if (typeof part === "string") {
        const segments = part.split(link.text);
        segments.forEach((segment, segIdx) => {
          newParts.push(segment);
          if (segIdx < segments.length - 1) {
            newParts.push(
              <a
                key={`link-${linkIdx}-${segIdx}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-serif text-emerald-400 hover:text-emerald-300 decoration-emerald-500/50 underline-offset-2 transition-all hover:decoration-emerald-400 inline-flex items-center gap-0.5"
                title={link.url}
              >
                {link.text}
              </a>,
            );
          }
        });
      } else {
        newParts.push(part);
      }
    });

    parts = newParts;
  });

  return <>{parts}</>;
}

// Icons (you can replace with your actual icon components)
function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function UpdateIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function CategoryIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
      />
    </svg>
  );
}

function AbstractIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

// Recursive Section Renderer (aligned structurally with v2, dark theme)
function SectionRenderer({
  section,
  depth,
  refIndexMap,
}: {
  section: any;
  depth: number;
  refIndexMap: Map<string, number>;
}) {
  const HeadingTag =
    depth === 1
      ? "h2"
      : depth === 2
        ? "h3"
        : depth === 3
          ? "h4"
          : depth === 4
            ? "h5"
            : "h6";

  const headingSizes: Record<number, string> = {
    1: "text-2xl sm:text-3xl md:text-4xl",
    2: "text-xl sm:text-2xl md:text-3xl",
    3: "text-lg sm:text-xl md:text-2xl",
    4: "text-base sm:text-lg md:text-xl",
  };

  const headingSize = headingSizes[depth] || "text-base";
  const mt = depth === 1 ? "" : depth === 2 ? "mt-10" : depth === 3 ? "mt-8" : "mt-6";
  const id = sectionId(section);

  return (
    <section className={`${mt} scroll-mt-28`} id={id}>
      {section.title && (
        <HeadingTag
          className={`${headingSize} font-bold text-white tracking-tight flex items-baseline gap-2 group font-serif leading-[1.2]`}
        >
          <span>{section.title}</span>
          <a
            href={`#${id}`}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500 hover:text-emerald-400"
            aria-label="Anchor link to this section"
          >
            #
          </a>
        </HeadingTag>
      )}

      {/* Section Content Blocks */}
      <div className="mt-5 space-y-6">
        {section.blocks?.map((block: any, blockIndex: number) => (
          <BlockRenderer
            key={block._id || blockIndex}
            block={block}
            refIndexMap={refIndexMap}
          />
        ))}
      </div>

      {/* Recursive Children Sections */}
      {section.children?.length > 0 && (
        <div className="mt-8 space-y-8 border-l-2 border-neutral-800 pl-6">
          {section.children.map((child: any, childIndex: number) => (
            <SectionRenderer
              key={child._id || childIndex}
              section={child}
              depth={Math.min(depth + 1, 5)}
              refIndexMap={refIndexMap}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// Block Renderer
function BlockRenderer({
  block,
  refIndexMap,
}: {
  block: any;
  refIndexMap: Map<string, number>;
}) {
  const citations = Array.isArray(block.citations)
    ? (block.citations
        .map((c: any) => (typeof c === "string" ? c : String(c)))
        .map((cid: string) => refIndexMap.get(cid))
        .filter(Boolean) as number[])
    : [];

  const CitationSup = () =>
    citations.length ? (
      <sup className="ml-1 text-[11px] text-emerald-400 font-medium">
        {citations.map((n, i) => (
          <a
            key={`${n}-${i}`}
            href={`#ref-${n}`}
            className="hover:text-emerald-300 transition-colors no-underline"
          >
            [{n}]{i < citations.length - 1 ? "," : ""}
          </a>
        ))}
      </sup>
    ) : null;

  switch (block.type) {
    case "text":
      return (
        <div className="group">
          <p className="text-lg leading-relaxed text-neutral-300 tracking-normal whitespace-pre-wrap">
            {block.links && block.links.length > 0
              ? renderTextWithLinks(block.text, block.links)
              : block.text}
            <CitationSup />
          </p>
        </div>
      );

    case "image":
      const publicId = block.image?.publicId;
      const src = publicId
        ? getOptimizedCloudinaryUrl(publicId, {
            width: 1200,
            quality: 90,
            format: "auto",
          })
        : block.image?.url || "";

      return (
        <figure className="my-10">
          <div className="relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={block.image?.caption || "Figure"}
              className="w-full h-auto"
              loading="lazy"
            />
          </div>
          {(block.image?.caption || block.image?.credit) && (
            <figcaption className="mt-4 text-center text-sm text-neutral-400 space-y-1">
              {block.image?.caption && (
                <p className="font-medium">{block.image.caption}</p>
              )}
              {block.image?.credit && (
                <p className="text-xs text-neutral-500">
                  Credit: {block.image.credit}
                </p>
              )}
            </figcaption>
          )}
        </figure>
      );

    case "list":
      return (
        <div>
          <ul className="list-disc list-outside ml-6 text-base md:text-lg leading-relaxed text-neutral-200 space-y-2 marker:text-neutral-500 font-serif">
            {(block.listItems || []).map((li: string, i: number) => (
              <li key={i} className="pl-1">
                {li.replace(/^- /, "")}
              </li>
            ))}
          </ul>
          <CitationSup />
        </div>
      );

    case "quote":
      return (
        <blockquote className="my-10 border-l-4 border-emerald-500/60 pl-6 py-2 bg-neutral-900/30 rounded-r-lg">
          <p className="text-xl italic text-neutral-300 leading-relaxed mb-4">
            "{block.text}"
          </p>
          {block.quoteAuthor && (
            <footer className="text-sm text-neutral-500 font-medium">
              — {block.quoteAuthor}
            </footer>
          )}
          <CitationSup />
        </blockquote>
      );

    case "code":
      return (
        <div className="my-8 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/60">
          {block.codeLanguage && (
            <div className="px-4 py-2 bg-neutral-950/70 border-b border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-emerald-300 font-semibold">
                  {block.codeLanguage}
                </span>
                <CopyButton text={block.text || ""} />
              </div>
            </div>
          )}
          <pre className="p-5 overflow-x-auto">
            <code className="text-sm font-mono text-neutral-100 whitespace-pre break-words">
              {block.text}
            </code>
          </pre>
        </div>
      );

    case "equation":
      return (
        <div className="my-10 p-6 bg-gradient-to-r from-neutral-900 to-neutral-800/50 rounded-xl border border-neutral-800">
          <div className="font-mono text-lg text-center text-white py-4">
            {block.text}
          </div>
          <CitationSup />
        </div>
      );

    default:
      return null;
  }
}

// Reference line component (mirrors v2 structure, dark theme)
function ReferenceLine({ r, index }: { r: any; index: number }) {
  const year = r.year ? ` (${r.year})` : "";
  const journal = r.journal ? `, ${r.journal}` : "";
  const publisher = r.publisher ? `, ${r.publisher}` : "";
  const authors = r.authors ? `${r.authors}.` : "";
  const doi = r.doi ? ` DOI: ${r.doi}` : "";
  const url = r.url ? (
    <>
      {" "}
      <a
        href={r.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-emerald-300 hover:text-emerald-200 hover:underline transition-colors break-all"
      >
        {r.url}
      </a>
    </>
  ) : null;

  return (
    <span>
      {authors} <span className="font-semibold">{r.title}</span>
      {year}
      {journal}
      {publisher}
      {doi}
      {url}
    </span>
  );
}
