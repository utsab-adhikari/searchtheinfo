import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Moon } from "lucide-react";

// Client components
import ViewsCounter from "./views-counter";
import ShareMenu from "./share-menu";
import CopyButton from "./copy-button";

// --------- Utils ---------
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

// Server-side Cloudinary URL optimizer
function getOptimizedCloudinaryUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: "auto" | "webp" | "jpg" | "png";
  } = {}
): string {
  const { width, height, quality = 80, format = "auto" } = options;
  const cloudName =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName || !publicId) return "";

  let transformations = `q_${quality},f_${format}`;
  if (width) transformations += `,w_${width}`;
  if (height) transformations += `,h_${height}`;
  transformations += ",c_limit";

  // publicId should not start with a leading slash
  const pid = publicId.replace(/^\/+/, "");

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${pid}`;
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

// Helper function to render text with embedded links
function renderTextWithLinks(text: string | undefined, links: Array<{ text: string; url: string }> | undefined) {
  if (!text) return null;
  if (!links || links.length === 0) return text;

  // Sort links by text length (longest first) to avoid partial replacements
  const sortedLinks = [...links].sort((a, b) => b.text.length - a.text.length);
  
  let parts: (string | React.ReactNode)[] = [text];
  
  sortedLinks.forEach((link, linkIdx) => {
    const newParts: (string | React.ReactNode)[] = [];
    
    parts.forEach((part) => {
      if (typeof part === 'string') {
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
                className="text-blue-600 hover:text-blue-800 underline decoration-blue-500/40 underline-offset-2 transition-all hover:decoration-blue-600 inline-flex items-center gap-0.5 font-medium"
                title={link.url}
              >
                {link.text}
              </a>
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
  persistentId?: string;
  views?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// --------- Page ---------
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  const res = await fetch(
    `${getBaseUrl()}/api/articles/v1/${encodeURIComponent(slug)}`,
    {
      next: { revalidate: 300 },
    },
  );

  if (!res.ok) {
    notFound();
  }

  const data = (await res.json()) as {
    success: boolean;
    article?: ArticleDoc;
    message?: string;
  };

  if (!data.success || !data.article) {
    notFound();
  }

  const article = data.article;

  const refIndexMap = new Map<string, number>();
  (article.references || []).forEach((r: any, i: number) => {
    if (r._id) refIndexMap.set(String(r._id), i + 1);
  });

  const created = new Date(article.createdAt);
  const updated = new Date(article.updatedAt);

  const categoryTitle =
    article.category && typeof article.category === "object"
      ? article.category.title
      : null;
  const categorySlug =
    article.category && typeof article.category === "object"
      ? article.category.slug || slugify(article.category.title || "")
      : null;

  const shareUrl = `${getBaseUrl()}/articles/v2/${article.slug}`;

  // Build a basic ToC from top-level sections only (clean, non-numbered)
  const toc: Array<{title: string; id: string; children?: Array<{title: string; id: string}>}> | false =
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
    <div className="min-h-screen bg-white text-gray-900">
      {/* Subtle background texture */}
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.015]">
        <div className="h-full w-full bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Header */}
      <header className="relative border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* Category badge */}
          {categoryTitle && (
            <div className="mb-4">
              <Link
                href={`/categories/${categorySlug || slugify(categoryTitle)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-xs font-medium uppercase tracking-wide"
              >
                {categoryTitle}
              </Link>
            </div>
          )}

          {/* Title */}
          <h1 className="font-serif font-bold tracking-tight text-gray-900 leading-[1.15] text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-6">
            {article.title}
          </h1>

          {/* Authors */}
          {article.authors?.length ? (
            <div className="mb-6">
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                {article.authors.map((author: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-sm font-medium flex-shrink-0">
                      {author?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {author?.name}
                      </div>
                      {author?.affiliation && (
                        <div className="text-xs text-gray-600">
                          {author.affiliation}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 border-t border-b border-gray-200 py-3">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Published {created.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>

            {updated.getTime() !== created.getTime() && (
              <>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Updated {updated.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </>
            )}

            {article.persistentId && (
              <>
                <span className="text-gray-300">•</span>
                <span className="font-mono text-xs">DOI: {article.persistentId}</span>
              </>
            )}

            <div className="ml-auto flex items-center gap-2">
              <Link
                href={`/articles/v1/${article.slug}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors border border-gray-300 text-xs font-medium"
              >
                <Moon className="w-4 h-4" />
                <span>Dark view</span>
              </Link>
              <ShareMenu
                title={article.title}
                url={shareUrl}
                abstract={article.abstract || ""}
              />
              <ViewsCounter slug={article.slug} initialViews={article.views || 0} />
            </div>
          </div>

          {/* Keywords */}
          {article.keywords?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {article.keywords.map((k: string, i: number) => (
                <span
                  key={`${k}-${i}`}
                  className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  {k}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      {/* Abstract */}
      {article.abstract && (
        <section className="relative bg-blue-50/30 border-b border-gray-200">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 md:py-10">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 letter-spacing-wide">
              Abstract
            </h2>
            <p className="text-base md:text-lg leading-[1.8] text-gray-700 whitespace-pre-wrap font-serif">
              {article.abstract}
            </p>
          </div>
        </section>
      )}

      {/* Main Content with ToC */}
      <main className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,780px)_280px] gap-12">
          {/* Article content */}
          <div>
            {article.sections?.length ? (
              <article className="space-y-12">
                {article.sections.map((sec: any, sidx: number) => (
                  <SectionRenderer
                    key={sec._id || sidx}
                    section={sec}
                    depth={1}
                    refIndexMap={refIndexMap}
                  />
                ))}
              </article>
            ) : (
              <div className="text-center text-gray-500 py-12">No content sections.</div>
            )}

            {/* References */}
            {article.references?.length ? (
              <section className="mt-16 pt-12 border-t-2 border-gray-300">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-serif">
                  References
                </h3>
                <ol className="space-y-4">
                  {article.references.map((r: any, i: number) => (
                    <li
                      key={r._id || i}
                      id={`ref-${i + 1}`}
                      className="flex gap-4 text-sm md:text-base scroll-mt-28"
                    >
                      <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded bg-gray-100 text-gray-700 font-semibold text-xs">
                        {i + 1}
                      </span>
                      <div className="flex-1 text-gray-700 leading-relaxed break-words">
                        <ReferenceLine r={r} index={i + 1} />
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {/* Resources */}
            {article.resources?.length ? (
              <section className="mt-12">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 font-serif">
                  Additional Resources
                </h3>
                <div className="space-y-3">
                  {article.resources.map((r: any, i: number) => (
                    <div
                      key={r._id || i}
                      className="bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 text-[11px] font-semibold uppercase tracking-wide">
                          {r.type}
                        </span>
                        {r.url && (
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 transition-colors"
                            title="Visit resource"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors mb-1">
                        {r.title}
                      </h4>
                      {r.author && (
                        <p className="text-sm text-gray-600 mb-2">by {r.author}</p>
                      )}
                      {r.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{r.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          {/* Right sticky ToC on wide screens */}
          <aside className="hidden lg:block">
            {toc && toc.length > 0 && (
              <nav className="sticky top-24">
                <div className="border border-gray-200 rounded-lg bg-gray-50/50 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
                    Contents
                  </p>
                  <ul className="space-y-2.5 text-sm">
                    {toc.map((t: any) => (
                      <li key={t.id}>
                        <a
                          href={`#${t.id}`}
                          className="text-gray-700 hover:text-blue-600 transition-colors font-medium block"
                        >
                          {t.title}
                        </a>
                        {t.children && t.children.length > 0 && (
                          <ul className="mt-2 ml-3 space-y-2 border-l-2 border-gray-200 pl-3">
                            {t.children.map((c: any) => (
                              <li key={c.id}>
                                <a
                                  href={`#${c.id}`}
                                  className="text-gray-600 hover:text-blue-600 transition-colors block text-sm"
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
  );
}

// --------- Renderers ---------
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
    depth === 1 ? "h2" : depth === 2 ? "h3" : depth === 3 ? "h4" : depth === 4 ? "h5" : "h6";

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
    <section className={`${mt}`} id={id}>
      <HeadingTag
        className={`${headingSize} font-bold text-gray-900 tracking-tight flex items-baseline gap-2 group font-serif scroll-mt-28 leading-[1.2]`}
      >
        <span>{section.title}</span>
        <a
          href={`#${id}`}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-600"
          aria-label="Anchor link to this section"
        >
          #
        </a>
      </HeadingTag>

      <div className="mt-5 space-y-6">
        {section.blocks?.map((blk: any, bidx: number) => (
          <BlockRenderer key={blk._id || bidx} block={blk} refIndexMap={refIndexMap} />
        ))}
      </div>

      {section.children?.length ? (
        <div className="mt-8 space-y-8 border-l-2 border-gray-200 pl-6">
          {section.children.map((child: any, childIdx: number) => (
            <SectionRenderer
              key={child._id || childIdx}
              section={child}
              depth={Math.min(depth + 1, 5)}
              refIndexMap={refIndexMap}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

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
      <sup className="ml-1 text-[12px] text-blue-600 font-semibold">
        {citations.map((n, i) => (
          <a
            key={`${n}-${i}`}
            href={`#ref-${n}`}
            className="hover:underline hover:text-blue-700 transition-colors"
          >
            [{n}]
          </a>
        ))}
      </sup>
    ) : null;

  switch (block.type) {
    case "text":
      return (
        <p className="text-base md:text-lg leading-[1.85] text-gray-800 whitespace-pre-wrap font-serif">
          {block.links && Array.isArray(block.links) && block.links.length > 0 ? (
            renderTextWithLinks(block.text, block.links)
          ) : (
            block.text
          )}
          <CitationSup />
        </p>
      );

    case "image": {
      const publicId = block.image?.publicId;
      const src = publicId
        ? getOptimizedCloudinaryUrl(publicId, { width: 1200, quality: 85, format: "auto" })
        : block.image?.url || "";

      return (
        <figure className="my-8 rounded-lg overflow-hidden border border-gray-300 bg-white shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={block.image?.caption || "Image"}
            className="w-full h-auto"
          />
          {(block.image?.caption || block.image?.credit) && (
            <figcaption className="px-5 py-4 text-sm text-gray-700 bg-gray-50 border-t border-gray-200">
              {block.image?.caption && <p className="mb-1 font-medium">{block.image.caption}</p>}
              {block.image?.credit && (
                <p className="text-gray-600 text-xs">Credit: {block.image.credit}</p>
              )}
            </figcaption>
          )}
        </figure>
      );
    }

    case "list":
      return (
        <div>
          <ul className="list-disc list-outside ml-6 text-base md:text-lg leading-relaxed text-gray-800 space-y-2 marker:text-gray-400 font-serif">
            {(block.listItems || []).map((li: string, i: number) => (
              <li key={i} className="pl-1">
                {li}
              </li>
            ))}
          </ul>
          <CitationSup />
        </div>
      );

    case "quote":
      return (
        <blockquote className="my-8 border-l-4 border-blue-500 bg-blue-50/50 pl-6 pr-5 py-5 rounded-r">
          <p className="text-base md:text-lg text-gray-800 italic leading-relaxed whitespace-pre-wrap font-serif">
            {block.text}
          </p>
          {block.quoteAuthor && (
            <footer className="mt-3 text-sm text-gray-600 font-medium">— {block.quoteAuthor}</footer>
          )}
          <CitationSup />
        </blockquote>
      );

    case "code":
      return (
        <div className="my-8 overflow-hidden rounded-lg border border-gray-300 bg-gray-50">
          {block.codeLanguage && (
            <div className="px-4 py-2 bg-gray-100 border-b border-gray-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-gray-700 font-semibold">
                  {block.codeLanguage}
                </span>
                <CopyButton text={block.text || ""} />
              </div>
            </div>
          )}
          <pre className="p-5 overflow-x-auto">
            <code className="text-sm font-mono text-gray-900 whitespace-pre break-words">
              {block.text}
            </code>
          </pre>
        </div>
      );

    case "equation":
      return (
        <div className="my-8 bg-blue-50 border border-blue-200 text-gray-900 rounded-lg p-6 font-mono text-center">
          <code className="text-lg">{block.text}</code>
          <CitationSup />
        </div>
      );

    default:
      return null;
  }
}

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
        className="text-blue-600 hover:text-blue-800 hover:underline transition-colors break-all"
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