import React from "react";
import connectDB from "@/database/connectDB";
import { Article } from "@/models/v2/articleModelV2";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import ViewsCounter from "./views-counter";
import ShareMenu from "./share-menu";
import { BookOpen, Calendar, Tag, User, Clock, AlertCircle, ArrowUpRight } from "lucide-react";

function getOptimizedCloudinaryUrl(
  publicId: string,
  options: { width?: number; height?: number; quality?: number; format?: "auto" | "webp" | "jpg" | "png" } = {}
): string {
  const { width, height, quality = 85, format = "auto" } = options;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return "";
  let transformations = `q_${quality},f_${format}`;
  if (width) transformations += `,w_${width}`;
  if (height) transformations += `,h_${height}`;
  transformations += ",c_limit";
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${publicId}`;
}

function findFirstImagePublicId(article: any): string | null {
  for (const sec of article.sections || []) {
    for (const blk of sec.blocks || []) {
      if (blk.type === "image" && blk.image?.publicId) return blk.image.publicId;
      if (blk.type === "image" && blk.image?.url) return null;
    }
  }
  return null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  await connectDB();
  const { slug } = await params;
  const article = await Article.findOne({ slug: slug }).lean();

  if (!article) {
    return { title: "Article not found" };
  }

  const primaryImagePublicId = findFirstImagePublicId(article);
  const primaryImageUrl =
    (primaryImagePublicId && getOptimizedCloudinaryUrl(primaryImagePublicId, { width: 1200, quality: 85 })) ||
    undefined;

  const title = article.title;
  const description = article.abstract || `Read: ${article.title}`;

  return {
    title: `${title} | SearchTheInfo`,
    description,
    keywords: article.keywords,
    openGraph: {
      title,
      description,
      type: "article",
      url: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/articles/v2/${article.slug}`,
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

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  await connectDB();

  const article = await Article.findOne({ slug: slug })
    .populate("createdBy", "name email")
    .populate("references")
    .lean();

  if (!article) {
    notFound();
  }

  const refIndexMap = new Map<string, number>();
  (article.references || []).forEach((r: any, i: number) => {
    if (r._id) refIndexMap.set(String(r._id), i + 1);
  });

  const created = new Date(article.createdAt);
  const updated = new Date(article.updatedAt);
  const authors = article.authors || [];

  return (
    <div className="min-h-screen bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px] text-zinc-100">
      <Header />
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-zinc-500">
          <ol className="flex items-center space-x-2 flex-wrap">
            <li>
              <Link href="/" className="hover:text-zinc-300 transition-colors">
                Home
              </Link>
            </li>
            <li className="text-zinc-600">/</li>
            <li>
              <Link href="/articles" className="hover:text-zinc-300 transition-colors">
                Articles
              </Link>
            </li>
            <li className="text-zinc-600">/</li>
            <li className="text-zinc-300 truncate">{article.title}</li>
          </ol>
        </nav>

        {/* Article Header */}
        <header className="mb-12 pb-8 border-b border-zinc-800/50">
          {/* Category & Status */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {article.category && (
              <Link
                href={`/categories/${article.category.title}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/30 text-sm"
              >
                <Tag className="w-4 h-4" />
                {article.category.title}
              </Link>
            )}
            {article.status === "published" && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Published
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight mb-6">
            {article.title}
          </h1>

          {/* Authors */}
          {authors.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-4">
                {authors.map((author: any, index: number) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                      <User className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {author.name}
                      </div>
                      {author.affiliation && (
                        <div className="text-xs text-zinc-500">
                          {author.affiliation}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{created.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
            {updated.getTime() !== created.getTime() && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Updated {updated.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
            )}
            {article.persistentId && (
              <div className="flex items-center gap-2 font-mono text-xs">
                <AlertCircle className="w-4 h-4" />
                ID: {article.persistentId}
              </div>
            )}
          </div>

          {/* Keywords */}
          {article.keywords?.length > 0 && (
            <div className="mt-6 pt-6 border-t border-zinc-800/50 flex flex-wrap gap-2">
              {article.keywords.map((keyword: string, index: number) => (
                <span
                  key={index}
                  className="px-2.5 py-1 text-xs rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Abstract Section */}
        {article.abstract && (
          <section className="mb-12 pb-12 border-b border-zinc-800/50">
            <div className="bg-zinc-900/40 backdrop-blur-xl rounded-xl border border-zinc-800/50 p-6 md:p-8 shadow-lg hover:border-zinc-700/50 transition-colors">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                Abstract
              </h2>
              <p className="text-base leading-relaxed text-zinc-300 whitespace-pre-wrap">
                {article.abstract}
              </p>
            </div>
          </section>
        )}

        {/* Sticky Share Button */}
        <div className="sticky top-4 z-20 mb-12 flex justify-between items-center">
          <div />
          <div className="flex items-center gap-2 bg-zinc-900/90 backdrop-blur-sm rounded-lg p-2 border border-zinc-800 shadow-lg">
            <ShareMenu
              title={article.title}
              url={`${process.env.NEXT_PUBLIC_SITE_URL || ""}/articles/v2/${article.slug}`}
              abstract={article.abstract || ""}
            />
            <ViewsCounter slug={article.slug} initialViews={article.views || 0} />
          </div>
        </div>

        {/* Main Content */}
        <article className="space-y-12 mb-16">
          {article.sections?.map((section: any, sectionIndex: number) => (
            <SectionRenderer
              key={section._id || sectionIndex}
              section={section}
              depth={1}
              refIndexMap={refIndexMap}
              sectionIndex={sectionIndex}
            />
          ))}
        </article>

        {/* References Section */}
        {article.references?.length > 0 && (
          <section className="mt-20 pt-16 border-t border-zinc-800/50">
            <div className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">References</h2>
              <div className="w-12 h-1 bg-gradient-to-r from-emerald-500 to-transparent rounded-full" />
            </div>
            <div className="bg-zinc-900/40 backdrop-blur-xl rounded-xl border border-zinc-800/50 p-6 md:p-8">
              <ol className="space-y-6">
                {article.references.map((reference: any, index: number) => (
                  <li key={reference._id || index} className="relative pl-8">
                    <span className="absolute left-0 top-0 text-emerald-500 font-mono text-sm font-bold">
                      [{index + 1}]
                    </span>
                    <div className="text-zinc-300 text-sm leading-relaxed">
                      <ReferenceItem reference={reference} />
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {/* Resources Section */}
        {article.resources?.length > 0 && (
          <section className="mt-16">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Additional Resources</h2>
              <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-transparent rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {article.resources.map((resource: any, index: number) => (
                <ResourceCard key={resource._id || index} resource={resource} />
              ))}
            </div>
          </section>
        )}

        {/* Article Footer */}
        <footer className="mt-20 pt-12 border-t border-zinc-800/50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Article Info</h3>
              <div className="text-sm text-zinc-500 space-y-1">
                <div>Created by: {article.createdBy?.name || "Unknown"}</div>
                <div>Revisions: {article.revisions?.length || 0}</div>
              </div>
            </div>
            <div className="text-sm text-zinc-600">
              © {new Date().getFullYear()} SearchTheInfo. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// Recursive Section Renderer
function SectionRenderer({ 
  section, 
  depth, 
  refIndexMap,
  sectionIndex 
}: { 
  section: any; 
  depth: number; 
  refIndexMap: Map<string, number>;
  sectionIndex: number;
}) {
  const headingSizes = {
    1: 'text-2xl md:text-3xl',
    2: 'text-xl md:text-2xl',
    3: 'text-lg md:text-xl',
    4: 'text-base md:text-lg',
  };

  const marginTop = depth === 1 ? '' : depth === 2 ? 'mt-10' : depth === 3 ? 'mt-8' : 'mt-6';
  const paddingLeft = depth > 1 ? `pl-4 md:pl-6` : '';
  const borderLeft = depth > 1 ? 'border-l border-zinc-800/50' : '';

  return (
    <section id={`section-${section._id || sectionIndex}`} className={`scroll-mt-20 ${marginTop} ${paddingLeft} ${borderLeft}`}>
      {section.title && (
        <h2 className={`${headingSizes[depth as keyof typeof headingSizes] || 'text-base'} font-bold text-white mb-6 tracking-tight`}>
          {section.title}
        </h2>
      )}

      {/* Section Blocks */}
      <div className="space-y-6">
        {section.blocks?.map((block: any, blockIndex: number) => (
          <BlockRenderer 
            key={block._id || blockIndex} 
            block={block} 
            refIndexMap={refIndexMap} 
          />
        ))}
      </div>

      {/* Recursive Children */}
      {section.children?.length > 0 && (
        <div className="mt-10 space-y-10">
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
function BlockRenderer({ block, refIndexMap }: { block: any; refIndexMap: Map<string, number> }) {
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
            [{n}]{i < citations.length - 1 ? ',' : ''}
          </a>
        ))}
      </sup>
    ) : null;

  switch (block.type) {
    case "text":
      return (
        <p className="text-base md:text-lg leading-relaxed text-zinc-300 whitespace-pre-wrap">
          {block.text}
          <CitationSup />
        </p>
      );
    
    case "image": {
      const publicId = block.image?.publicId;
      const src = publicId
        ? getOptimizedCloudinaryUrl(publicId, { width: 1200, quality: 90, format: "auto" })
        : block.image?.url || "";

      return (
        <figure className="my-8 rounded-lg overflow-hidden border border-zinc-800/50 bg-zinc-900/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={src} 
            alt={block.image?.caption || "Figure"} 
            className="w-full h-auto"
            loading="lazy"
          />
          {(block.image?.caption || block.image?.credit) && (
            <figcaption className="px-6 py-4 text-sm text-zinc-400 bg-zinc-900/80 backdrop-blur-sm">
              {block.image?.caption && (
                <p className="mb-1 text-zinc-300">{block.image.caption}</p>
              )}
              {block.image?.credit && (
                <p className="text-xs text-zinc-500">Credit: {block.image.credit}</p>
              )}
            </figcaption>
          )}
        </figure>
      );
    }
    
    case "list":
      return (
        <ul className="list-disc list-outside ml-6 space-y-2 text-base text-zinc-300">
          {(block.listItems || []).map((item: string, index: number) => (
            <li key={index} className="pl-2">{item}</li>
          ))}
          <CitationSup />
        </ul>
      );
    
    case "quote":
      return (
        <blockquote className="my-8 border-l-4 border-emerald-500/60 pl-6 py-4 bg-zinc-900/40 rounded-r-lg italic text-zinc-300">
          <p className="mb-3">"{block.text}"</p>
          {block.quoteAuthor && (
            <footer className="text-sm text-zinc-500 not-italic">— {block.quoteAuthor}</footer>
          )}
          <CitationSup />
        </blockquote>
      );
    
    case "code":
      return (
        <div className="my-8 overflow-hidden rounded-lg border border-zinc-800/50 bg-zinc-900/60">
          {block.codeLanguage && (
            <div className="px-6 py-3 bg-zinc-900 border-b border-zinc-800/50">
              <span className="text-xs font-mono text-emerald-400">
                {block.codeLanguage}
              </span>
            </div>
          )}
          <pre className="p-6 overflow-x-auto">
            <code className="text-sm font-mono text-zinc-300 whitespace-pre">
              {block.text}
            </code>
          </pre>
        </div>
      );
    
    case "equation":
      return (
        <div className="my-8 p-6 bg-emerald-500/5 border border-emerald-500/30 rounded-lg">
          <div className="font-mono text-center text-emerald-400 py-2">
            {block.text}
          </div>
          <CitationSup />
        </div>
      );
    
    default:
      return null;
  }
}

// Reference Item
function ReferenceItem({ reference }: { reference: any }) {
  return (
    <div>
      <div className="font-medium text-white mb-1">
        {reference.title}
      </div>
      <div className="text-zinc-400 space-y-1">
        {reference.authors && <div>{reference.authors}</div>}
        {reference.journal && <div><em>{reference.journal}</em> {reference.year && `(${reference.year})`}</div>}
        {(reference.doi || reference.url) && (
          <div className="flex flex-wrap gap-3 pt-2">
            {reference.doi && (
              <a
                href={`https://doi.org/${reference.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-500 hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
              >
                DOI <ArrowUpRight className="w-3 h-3" />
              </a>
            )}
            {reference.url && (
              <a
                href={reference.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-400 transition-colors inline-flex items-center gap-1"
              >
                View <ArrowUpRight className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Resource Card
function ResourceCard({ resource }: { resource: any }) {
  const typeColors: Record<string, string> = {
    book: 'from-purple-500/20 to-transparent text-purple-400 border-purple-500/30',
    website: 'from-blue-500/20 to-transparent text-blue-400 border-blue-500/30',
    youtube: 'from-red-500/20 to-transparent text-red-400 border-red-500/30',
    paper: 'from-emerald-500/20 to-transparent text-emerald-400 border-emerald-500/30',
    course: 'from-amber-500/20 to-transparent text-amber-400 border-amber-500/30',
    other: 'from-zinc-500/20 to-transparent text-zinc-400 border-zinc-500/30',
  };

  const typeEmojis: Record<string, string> = {
    book: '📚',
    website: '🌐',
    youtube: '🎬',
    paper: '📄',
    course: '🎓',
    other: '📎',
  };

  return (
    <div className={`bg-gradient-to-br ${typeColors[resource.type]} rounded-lg border p-6 hover:border-zinc-700 transition-all hover:shadow-lg`}>
      <div className="flex items-start justify-between mb-4">
        <span className="text-3xl">{typeEmojis[resource.type] || '📎'}</span>
        {resource.url && (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded"
            title="Open resource"
          >
            <ArrowUpRight className="w-5 h-5" />
          </a>
        )}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2 hover:text-emerald-400 transition-colors">
        {resource.title}
      </h3>
      {resource.author && (
        <p className="text-sm text-zinc-500 mb-3">by {resource.author}</p>
      )}
      {resource.description && (
        <p className="text-sm text-zinc-400">{resource.description}</p>
      )}
    </div>
  );
}
