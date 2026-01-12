import React from "react";
import connectDB from "@/database/connectDB";
import Article from "@/models/v1/articleModelV1";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

// Client components for share and views
import ViewsCounter from "./views-counter";
import ShareMenu from "./share-menu";

// Util: get optimized Cloudinary URL (server-side variant)
function getOptimizedCloudinaryUrl(
  publicId: string,
  options: { width?: number; height?: number; quality?: number; format?: "auto" | "webp" | "jpg" | "png" } = {}
): string {
  const { width, height, quality = 80, format = "auto" } = options;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return "";
  let transformations = `q_${quality},f_${format}`;
  if (width) transformations += `,w_${width}`;
  if (height) transformations += `,h_${height}`;
  transformations += ",c_limit";
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${publicId}`;
}

type ArticleDoc = Awaited<ReturnType<typeof Article.findOne>> extends infer T
  ? T extends null
    ? never
    : NonNullable<T>
  : never;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  await connectDB();
  const {slug} = await params;
  const article = await Article.findOne({ slug: slug }).lean();

  if (!article) {
    return {
      title: "Article not found",
    };
  }

  const primaryImagePublicId = findFirstImagePublicId(article);
  const primaryImageUrl =
    (primaryImagePublicId && getOptimizedCloudinaryUrl(primaryImagePublicId, { width: 1200, quality: 85 })) ||
    undefined;

  const title = article.title;
  const description = article.abstract || `Read: ${article.title}`;

  return {
    title,
    description,
    keywords: article.keywords,
    openGraph: {
      title,
      description,
      type: "article",
      url: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/articles/${article.slug}`,
      images: primaryImageUrl ? [{ url: primaryImageUrl, width: 1200, height: 630, alt: article.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: primaryImageUrl ? [primaryImageUrl] : undefined,
    },
  };
}

function findFirstImagePublicId(article: any): string | null {
  for (const sec of article.sections || []) {
    for (const blk of sec.blocks || []) {
      if (blk.type === "image" && blk.image?.publicId) return blk.image.publicId;
      if (blk.type === "image" && blk.image?.url) return null; // has a URL but not a publicId
    }
  }
  return null;
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const {slug} = await params;
    await connectDB();

  const article = await Article.findOne({ slug: slug }).lean();
  if (!article) {
    notFound();
  }

  const refIndexMap = new Map<string, number>();
  (article.references || []).forEach((r: any, i: number) => {
    if (r._id) refIndexMap.set(String(r._id), i + 1);
  });

  const created = new Date(article.createdAt);
  const updated = new Date(article.updatedAt);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      
      {/* Hero header */}
      <header className="relative z-10 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-4xl font-semibold tracking-tight text-white">{article.title}</h1>
              {article.authors && article.authors.length > 0 && (
                <p className="mt-2 text-sm text-zinc-400">
                  {article.authors.map((a: any) => a.name).filter(Boolean).join(", ")}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                <span>Published: {created.toLocaleDateString()}</span>
                <span>Updated: {updated.toLocaleDateString()}</span>
                {article.category && (
                  <span className="inline-flex items-center gap-1">
                    Category:
                    <Link href={`/categories/${String(article.category.title)}`} className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors">
                      {String(article.category.title)}
                    </Link>
                  </span>
                )}
                {article.persistentId && (
                  <span className="inline-flex items-center gap-1">
                    Persistent ID:
                    <span className="font-mono">{article.persistentId}</span>
                  </span>
                )}
              </div>
              {article.keywords?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {article.keywords.map((k: string, i: number) => (
                    <span key={`${k}-${i}`} className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {k}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex-shrink-0 flex flex-col items-end gap-2">
              <ShareMenu
                title={article.title}
                url={`${process.env.NEXT_PUBLIC_SITE_URL || ""}/articles/${article.slug}`}
                abstract={article.abstract || ""}
              />
              <ViewsCounter slug={article.slug} initialViews={article.views || 0} />
            </div>
          </div>
        </div>
      </header>

      {/* Abstract */}
      {article.abstract && (
        <section className="relative z-10 bg-zinc-900/30 border-b border-zinc-800 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Abstract</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-zinc-300 whitespace-pre-wrap">{article.abstract}</p>
          </div>
        </section>
      )}

      {/* Main content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {article.sections?.length ? (
          <div className="space-y-10">
            {article.sections.map((sec: any, sidx: number) => (
              <section key={sec._id || sidx}>
                <h3 className="text-xl font-semibold text-white">{sec.title}</h3>
                <div className="mt-3 space-y-6">
                  {sec.blocks?.map((blk: any, bidx: number) => (
                    <BlockRenderer key={blk._id || bidx} block={blk} refIndexMap={refIndexMap} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="text-zinc-500">No content sections.</div>
        )}

        {/* References */}
        {article.references?.length ? (
          <section className="mt-10 pt-10 border-t border-zinc-800">
            <h4 className="text-lg font-semibold text-white">References</h4>
            <ol className="mt-4 space-y-2 list-decimal list-inside text-sm text-zinc-300">
              {article.references.map((r: any, i: number) => (
                <li key={r._id || i}>
                  <ReferenceLine r={r} />
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {/* Resources */}
        {article.resources?.length ? (
          <section className="mt-8">
            <h4 className="text-lg font-semibold text-white">Resources</h4>
            <ul className="mt-3 space-y-2 text-sm">
              {article.resources.map((r: any, i: number) => (
                <li key={r._id || i} className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/30">{r.type}</span>
                  <span className="font-medium text-zinc-200">{r.title}</span>
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors text-xs">
                      Visit
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function BlockRenderer({ block, refIndexMap }: { block: any; refIndexMap: Map<string, number> }) {
  const citations = Array.isArray(block.citations)
    ? (block.citations
        .map((c: any) => (typeof c === "string" ? c : String(c)))
        .map((cid: string) => refIndexMap.get(cid))
        .filter(Boolean) as number[])
    : [];

  const CitationSup = () =>
    citations.length ? (
      <sup className="ml-1 text-[12px] text-emerald-400">
        {citations.map((n, i) => (
          <a key={`${n}-${i}`} href={`#ref-${n}`} className="hover:underline hover:text-emerald-300 transition-colors">
            [{n}]
          </a>
        ))}
      </sup>
    ) : null;

  switch (block.type) {
    case "text":
      return (
        <p className="text-[16px] leading-relaxed text-zinc-300 whitespace-pre-wrap">
          {block.text}
          <CitationSup />
        </p>
      );
    case "image": {
      const publicId = block.image?.publicId;
      const src =
        publicId
          ? getOptimizedCloudinaryUrl(publicId, { width: 1200, quality: 85, format: "auto" })
          : block.image?.url || "";

      return (
        <figure className="rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={block.image?.caption || "Image"} className="w-full" />
          {(block.image?.caption || block.image?.credit) && (
            <figcaption className="px-4 py-2 text-xs text-zinc-400 flex items-center justify-between">
              <span>{block.image?.caption}</span>
              {block.image?.credit && <span className="text-zinc-500">© {block.image.credit}</span>}
            </figcaption>
          )}
        </figure>
      );
    }
    case "list":
      return (
        <ul className="list-disc list-inside text-[15px] text-zinc-300 space-y-1">
          {(block.listItems || []).map((li: string, i: number) => (
            <li key={i}>{li}</li>
          ))}
          <CitationSup />
        </ul>
      );
    case "quote":
      return (
        <blockquote className="border-l-4 border-emerald-500 pl-4 text-zinc-300 italic">
          <p className="whitespace-pre-wrap">{block.text}</p>
          <div className="mt-2 text-xs text-zinc-500">— {block.quoteAuthor || "Unknown"}</div>
          <CitationSup />
        </blockquote>
      );
    case "code":
      return (
        <pre className="bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm rounded-md p-4 overflow-auto">
          {block.codeLanguage && <div className="text-[11px] text-zinc-500 mb-2">{block.codeLanguage}</div>}
          <code className="font-mono whitespace-pre-wrap">{block.text}</code>
        </pre>
      );
    case "equation":
      return (
        <div className="bg-emerald-950/30 border border-emerald-800/50 text-emerald-300 rounded-md p-3 font-mono">
          {block.text}
          <CitationSup />
        </div>
      );
    default:
      return null;
  }
}

function ReferenceLine({ r }: { r: any }) {
  const year = r.year ? ` (${r.year})` : "";
  const journal = r.journal ? `, ${r.journal}` : "";
  const publisher = r.publisher ? `, ${r.publisher}` : "";
  const authors = r.authors ? `${r.authors}.` : "";
  const doi = r.doi ? ` DOI: ${r.doi}` : "";
  const url = r.url ? (
    <>
      {" "}
      <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors">
        {r.url}
      </a>
    </>
  ) : null;

  return (
    <span id={`ref-${r._id ? String(r._id) : ""}`}>
      {authors} {r.title}
      {year}
      {journal}
      {publisher}
      {doi}
      {url}
    </span>
  );
}