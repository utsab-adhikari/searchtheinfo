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
                      sectionIndex={sectionIndex}
                    />
                  ))}
                </article>
              ) : (
                <div className="text-center text-neutral-500 py-12">
                  No content sections.
                </div>
              )}

              {/* References Section */}
              {references.length > 0 && (
                <section className="mt-24 pt-16 border-t border-neutral-800">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-0.5 bg-emerald-500"></div>
                    <h2 className="text-3xl font-bold text-white">References</h2>
                  </div>
                  <div className="bg-neutral-900/50 rounded-xl p-8 border border-neutral-800">
                    <ol className="space-y-6">
                      {references.map((reference: any, index: number) => (
                        <li key={reference._id || index} className="relative pl-8">
                          <span className="absolute left-0 top-0 text-emerald-500 font-mono text-sm">
                            [{index + 1}]
                          </span>
                          <div className="text-neutral-300 leading-relaxed">
                            <ReferenceItem reference={reference} />
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </section>
              )}

              {/* Resources Section */}
              {resources.length > 0 && (
                <section className="mt-20">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-0.5 bg-blue-500"></div>
                    <h2 className="text-2xl font-bold text-white">
                      Additional Resources
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {resources.map((resource: any, index: number) => (
                      <ResourceCard
                        key={resource._id || index}
                        resource={resource}
                      />
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

            {/* Right sticky ToC (dark theme) */}
            <aside className="hidden lg:block">
              {article.sections?.length ? (
                <nav className="sticky top-24">
                  <div className="border border-neutral-800 rounded-lg bg-neutral-900/70 p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">
                      Contents
                    </p>
                    <ul className="space-y-2.5 text-sm">
                      {article.sections.map((section: any, index: number) => (
                        <li key={section._id || index}>
                          <a
                            href={`#section-${section._id || index}`}
                            className="text-neutral-300 hover:text-white transition-colors font-medium block"
                          >
                            {section.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </nav>
              ) : null}
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

// Recursive Section Renderer (without numbering in titles)
function SectionRenderer({
  section,
  depth,
  refIndexMap,
  sectionIndex,
}: {
  section: any;
  depth: number;
  refIndexMap: Map<string, number>;
  sectionIndex: number;
}) {
  const HeadingTag = depth === 1 ? "h2" : depth === 2 ? "h3" : "h4";

  const headingStyles = {
    1: "text-2xl md:text-3xl font-bold text-white mb-8 pb-4 border-b border-neutral-800",
    2: "text-xl md:text-2xl font-semibold text-white mb-6 mt-12",
    3: "text-lg md:text-xl font-semibold text-white mb-4 mt-8",
  };

  const headingStyle =
    headingStyles[depth as keyof typeof headingStyles] ||
    "text-base font-semibold text-white mb-4";

  return (
    <section
      id={`section-${section._id || sectionIndex}`}
      className={`scroll-mt-20 ${depth > 1 ? "pl-4 md:pl-6" : ""}`}
    >
      {section.title && (
        <HeadingTag className={headingStyle}>{section.title}</HeadingTag>
      )}

      {/* Section Content Blocks */}
      <div className="space-y-8">
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
        <div className="mt-10 space-y-14">
          {section.children.map((child: any, childIndex: number) => (
            <SectionRenderer
              key={child._id || childIndex}
              section={child}
              depth={depth + 1}
              refIndexMap={refIndexMap}
              sectionIndex={childIndex}
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
      const ListTag = block.listItems?.[0]?.startsWith("-") ? "ul" : "ol";
      const listStyle = ListTag === "ul" ? "list-disc" : "list-decimal";

      return (
        <div className="my-8">
          <ListTag className={`${listStyle} list-outside ml-6 space-y-3`}>
            {(block.listItems || []).map((item: string, index: number) => (
              <li
                key={index}
                className="text-lg text-neutral-300 pl-2 leading-relaxed"
              >
                {item.replace(/^- /, "")}
              </li>
            ))}
          </ListTag>
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
        <div className="my-10 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50">
          {block.codeLanguage && (
            <div className="px-6 py-3 bg-neutral-900 border-b border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono text-emerald-400">
                  {block.codeLanguage}
                </span>
                <CopyButton text={block.text || ""} />
              </div>
            </div>
          )}
          <pre className="p-6 overflow-x-auto">
            <code className="text-sm font-mono text-neutral-300 whitespace-pre">
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

// Reference Item Component
function ReferenceItem({ reference }: { reference: any }) {
  return (
    <div className="hover:bg-neutral-800/30 rounded-lg p-3 transition-colors">
      <div className="font-medium text-white mb-1">{reference.title}</div>
      <div className="text-sm text-neutral-400 mb-2">
        {reference.authors && <span>{reference.authors}. </span>}
        {reference.journal && <em>{reference.journal}</em>}
        {reference.year && <span> ({reference.year})</span>}
        {reference.volume && <span>, {reference.volume}</span>}
        {reference.issue && <span>({reference.issue})</span>}
        {reference.pages && <span>: {reference.pages}</span>}
      </div>
      {(reference.doi || reference.url) && (
        <div className="text-sm space-x-4">
          {reference.doi && (
            <a
              href={`https://doi.org/${reference.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-500 hover:text-emerald-400 transition-colors"
            >
              DOI: {reference.doi}
            </a>
          )}
          {reference.url && (
            <a
              href={reference.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-400 transition-colors"
            >
              View Source
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// Resource Card Component
function ResourceCard({ resource }: { resource: any }) {
  const typeColors: Record<string, string> = {
    book: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    website: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    youtube: "bg-red-500/10 text-red-400 border-red-500/20",
    paper: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    course: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    other: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
  };

  const typeIcons: Record<string, string> = {
    book: "📚",
    website: "🌐",
    youtube: "🎬",
    paper: "📄",
    course: "🎓",
    other: "📎",
  };

  return (
    <div className="group bg-neutral-900/50 rounded-xl p-6 border border-neutral-800 hover:border-neutral-700 transition-all hover:shadow-xl">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{typeIcons[resource.type] || "📎"}</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${typeColors[resource.type]}`}
          >
            {resource.type}
          </span>
        </div>
        {resource.url && (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-400 hover:text-white transition-colors p-2 hover:bg-neutral-800 rounded-lg"
            title="Open resource"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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
      <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
        {resource.title}
      </h4>
      {resource.author && (
        <p className="text-sm text-neutral-400 mb-3">by {resource.author}</p>
      )}
      {resource.description && (
        <p className="text-neutral-300 leading-relaxed">
          {resource.description}
        </p>
      )}
    </div>
  );
}
