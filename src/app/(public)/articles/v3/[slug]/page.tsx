import React from "react";
import connectDB from "@/database/connectDB";
import { Article } from "@/models/v2/articleModelV2";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
// Client components
import ViewsCounter from "./views-counter";
import ShareMenu from "./share-menu";

// --- Utility: Cloudinary ---
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

// --- Metadata ---
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  await connectDB();
  const { slug } = await params;
  const article = await Article.findOne({ slug }).lean();
  
  if (!article) return { title: "Article not found" };

  // Helper to find first image
  const findFirstImagePublicId = (art: any) => {
    for (const sec of art.sections || []) {
      for (const blk of sec.blocks || []) {
        if (blk.type === "image" && blk.image?.publicId) return blk.image.publicId;
      }
    }
    return null;
  };

  const primaryImagePublicId = findFirstImagePublicId(article);
  const primaryImageUrl = primaryImagePublicId
    ? getOptimizedCloudinaryUrl(primaryImagePublicId, { width: 1200, quality: 85 })
    : undefined;

  return {
    title: article.title,
    description: article.abstract,
    keywords: article.keywords,
    openGraph: {
      title: article.title,
      description: article.abstract,
      type: "article",
      url: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/articles/v2/${article.slug}`,
      images: primaryImageUrl ? [{ url: primaryImageUrl, width: 1200, height: 630, alt: article.title }] : undefined,
    },
  };
}

// --- Main Page Component ---
export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  await connectDB();

  const article = await Article.findOne({ slug })
    .populate("createdBy", "name email")
    .populate("references")
    .lean();

  if (!article) notFound();

  // Create Reference Map for Citations
  const refIndexMap = new Map<string, number>();
  (article.references || []).forEach((r: any, i: number) => {
    if (r._id) refIndexMap.set(String(r._id), i + 1);
  });

  const created = new Date(article.createdAt);
  
  // Flatten sections for Table of Contents (only top 2 levels)
  const toc = (article.sections || []).map((sec: any, i: number) => ({
    id: `sec-${i}`,
    title: sec.title,
    children: (sec.children || []).map((child: any, j: number) => ({
      id: `sec-${i}-${j}`,
      title: child.title,
    }))
  }));

  return (
    <div className="min-h-screen bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] text-zinc-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* HEADER SECTION */}
        <header className="max-w-5xl mx-auto mb-16 text-center lg:text-left">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-6">
             {article.category && (
               <Link href={`/categories/${String(article.category.title)}`} className="text-xs font-bold tracking-wider uppercase text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">
                  {String(article.category.title)}
               </Link>
             )}
             <span className="text-xs text-zinc-500 font-mono">
                {created.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
             </span>
             <span className="text-xs text-zinc-600 font-mono">•</span>
             <span className="text-xs text-zinc-500 font-mono">
                {Math.ceil((article.sections?.length || 1) * 2)} min read
             </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] mb-8">
            {article.title}
          </h1>

          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 border-y border-zinc-800/60 py-6 bg-zinc-900/20 backdrop-blur-sm rounded-lg px-6">
            <div className="flex-1 text-center lg:text-left">
               <p className="text-zinc-400 text-sm font-medium uppercase tracking-widest mb-2">Authors</p>
               <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                 {article.authors?.map((a: any, i: number) => (
                   <span key={i} className="text-zinc-100 font-medium text-lg">
                     {a.name}{i < article.authors.length - 1 ? "," : ""}
                   </span>
                 ))}
               </div>
               {article.authors?.[0]?.affiliation && (
                 <p className="text-zinc-500 text-sm mt-1">{article.authors[0].affiliation}</p>
               )}
            </div>
            
            <div className="flex items-center gap-3 pl-0 lg:pl-6 lg:border-l border-zinc-800">
              <ShareMenu title={article.title} url={`${process.env.NEXT_PUBLIC_SITE_URL}/articles/v2/${article.slug}`} abstract={article.abstract} />
              <div className="h-4 w-[1px] bg-zinc-700"></div>
              <ViewsCounter slug={article.slug} initialViews={article.views || 0} />
            </div>
          </div>
        </header>

        {/* TWO COLUMN CONTENT LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-7xl mx-auto">
          
          {/* LEFT: Main Content (8 cols) */}
          <main className="lg:col-span-8 lg:min-w-0">
            
            {/* Abstract Card */}
            {article.abstract && (
              <div className="mb-12 p-6 md:p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 shadow-xl backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50"></div>
                <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Abstract
                </h2>
                <p className="text-lg md:text-xl leading-relaxed text-zinc-200 font-serif opacity-90">
                  {article.abstract}
                </p>
              </div>
            )}

            {/* Sections */}
            <article>
              {article.sections?.length ? (
                article.sections.map((sec: any, i: number) => (
                  <SectionRenderer
                    key={sec._id || i}
                    section={sec}
                    depth={1}
                    idPrefix={`sec-${i}`}
                    refIndexMap={refIndexMap}
                  />
                ))
              ) : (
                <div className="py-20 text-center text-zinc-600 italic">No content available.</div>
              )}
            </article>

            {/* References Section */}
            {article.references?.length > 0 && (
              <section id="references" className="mt-20 pt-10 border-t border-zinc-800">
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                  <span className="text-emerald-500/80">#</span> References
                </h3>
                <div className="space-y-4">
                  {article.references.map((r: any, i: number) => (
                    <div key={r._id || i} id={`ref-${i + 1}`} className="group flex gap-4 text-sm md:text-base p-3 rounded-lg hover:bg-zinc-900/30 transition-colors">
                      <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded bg-zinc-800 text-zinc-400 font-mono text-xs mt-0.5 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors">
                        {i + 1}
                      </span>
                      <div className="text-zinc-400 group-hover:text-zinc-300 transition-colors leading-relaxed">
                        <ReferenceLine r={r} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Resources Section */}
            {article.resources?.length > 0 && (
              <section className="mt-16">
                 <h3 className="text-xl font-bold text-white mb-6">Additional Resources</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {article.resources.map((r: any, i: number) => (
                       <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" 
                          className="block p-4 rounded-xl border border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/60 hover:border-emerald-500/30 transition-all group">
                          <div className="flex items-center justify-between mb-2">
                             <span className="text-xs font-mono text-emerald-500/70 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">{r.type}</span>
                             <svg className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          </div>
                          <div className="font-medium text-zinc-200 group-hover:text-white truncate">{r.title}</div>
                          {r.description && <div className="text-sm text-zinc-500 mt-1 line-clamp-1">{r.description}</div>}
                       </a>
                    ))}
                 </div>
              </section>
            )}

          </main>

          {/* RIGHT: Sticky Sidebar (4 cols) */}
          <aside className="hidden lg:block lg:col-span-4 relative pl-8">
            <div className="sticky top-10 space-y-8">
              
              {/* Table of Contents */}
              <nav className="bg-zinc-900/30 backdrop-blur-md rounded-xl border border-zinc-800/60 p-5 shadow-xl">
                <h4 className="text-sm font-bold text-zinc-100 uppercase tracking-widest mb-4 pb-2 border-b border-zinc-800/50">
                  On this page
                </h4>
                <ul className="space-y-1 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                  {toc.map((section: any) => (
                    <li key={section.id}>
                      <a href={`#${section.id}`} className="block py-1.5 text-sm text-zinc-400 hover:text-emerald-400 hover:pl-1 transition-all">
                        {section.title}
                      </a>
                      {section.children?.length > 0 && (
                        <ul className="ml-4 mt-1 space-y-1 border-l border-zinc-800 pl-3">
                          {section.children.map((child: any) => (
                            <li key={child.id}>
                              <a href={`#${child.id}`} className="block py-1 text-xs text-zinc-500 hover:text-emerald-300 transition-colors">
                                {child.title}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                  {article.references?.length > 0 && (
                    <li className="pt-2 mt-2 border-t border-zinc-800/50">
                       <a href="#references" className="block py-1 text-sm font-medium text-zinc-400 hover:text-emerald-400">References</a>
                    </li>
                  )}
                </ul>
              </nav>

              {/* Quick Info / Metadata Card */}
              <div className="bg-zinc-900/20 border border-zinc-800 rounded-xl p-5">
                 <div className="space-y-4">
                    {article.persistentId && (
                       <div>
                          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Persistent ID</div>
                          <div className="font-mono text-sm text-zinc-300 bg-zinc-950 px-2 py-1 rounded inline-block">{article.persistentId}</div>
                       </div>
                    )}
                    <div>
                       <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Keywords</div>
                       <div className="flex flex-wrap gap-2">
                          {article.keywords?.map((k: string) => (
                             <span key={k} className="text-xs text-zinc-400 bg-zinc-800/50 px-2 py-1 rounded hover:text-zinc-200 transition-colors cursor-default">
                                {k}
                             </span>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>

            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// --- Recursive Section Renderer ---
function SectionRenderer({
  section,
  depth,
  idPrefix,
  refIndexMap
}: {
  section: any;
  depth: number;
  idPrefix: string;
  refIndexMap: Map<string, number>;
}) {
  const HeadingTag = depth === 1 ? 'h2' : depth === 2 ? 'h3' : depth === 3 ? 'h4' : 'h6';
  
  // Dynamic styles based on depth
  const headingStyles = {
    1: 'text-2xl md:text-3xl font-bold text-white mt-16 mb-6 pb-3 border-b border-zinc-800 tracking-tight',
    2: 'text-xl md:text-2xl font-semibold text-zinc-100 mt-10 mb-4 tracking-tight',
    3: 'text-lg md:text-xl font-medium text-zinc-200 mt-8 mb-3',
    4: 'text-base font-bold text-zinc-300 mt-6 mb-2',
  }[depth > 4 ? 4 : depth] || '';

  return (
    <section id={idPrefix} className="scroll-mt-24">
      {/* Title with Anchor Link on Hover */}
      <HeadingTag className={`${headingStyles} group flex items-center gap-2`}>
        {section.title}
        <a href={`#${idPrefix}`} className="opacity-0 group-hover:opacity-100 text-emerald-500 text-lg transition-opacity" aria-label="Link to section">#</a>
      </HeadingTag>

      <div className="space-y-6">
        {section.blocks?.map((blk: any, bidx: number) => (
          <BlockRenderer key={blk._id || bidx} block={blk} refIndexMap={refIndexMap} />
        ))}
      </div>

      {section.children?.length ? (
        <div className="mt-4">
          {section.children.map((child: any, childIdx: number) => (
            <SectionRenderer
              key={child._id || childIdx}
              section={child}
              depth={depth + 1}
              idPrefix={`${idPrefix}-${childIdx}`}
              refIndexMap={refIndexMap}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

// --- Block Renderer ---
function BlockRenderer({ block, refIndexMap }: { block: any; refIndexMap: Map<string, number> }) {
  const citations = Array.isArray(block.citations)
    ? (block.citations
        .map((c: any) => (typeof c === "string" ? c : String(c)))
        .map((cid: string) => refIndexMap.get(cid))
        .filter(Boolean) as number[])
    : [];

  const CitationSup = () =>
    citations.length ? (
      <sup className="ml-0.5 text-[11px] font-semibold text-emerald-400 select-none">
        {citations.map((n, i) => (
          <React.Fragment key={n}>
            <a href={`#ref-${n}`} className="hover:underline hover:text-emerald-300 transition-colors px-[1px]">
              {n}
            </a>
            {i < citations.length - 1 && ","}
          </React.Fragment>
        ))}
      </sup>
    ) : null;

  switch (block.type) {
    case "text":
      return (
        <p className="text-[17px] md:text-[18px] leading-[1.8] text-zinc-300/90 whitespace-pre-wrap font-normal text-justify">
          {block.text}
          <CitationSup />
        </p>
      );

    case "image": {
      const publicId = block.image?.publicId;
      const src = publicId
          ? getOptimizedCloudinaryUrl(publicId, { width: 1200, quality: 85, format: "auto" })
          : block.image?.url || "";
      
      return (
        <figure className="my-8 group">
          <div className="rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={block.image?.caption || "Article Image"} className="w-full h-auto object-cover" loading="lazy" />
          </div>
          {(block.image?.caption || block.image?.credit) && (
            <figcaption className="mt-3 flex items-start gap-3 text-sm text-zinc-500 px-2">
               <span className="w-0.5 h-4 bg-emerald-500/50 mt-1 flex-shrink-0"></span>
               <div>
                  {block.image?.caption && <span className="font-medium text-zinc-400">{block.image.caption}</span>}
                  {block.image?.credit && <span className="ml-2 text-xs opacity-70">© {block.image.credit}</span>}
               </div>
            </figcaption>
          )}
        </figure>
      );
    }

    case "list":
      return (
        <ul className="my-6 space-y-2 ml-4">
          {(block.listItems || []).map((li: string, i: number) => (
            <li key={i} className="relative pl-6 text-[17px] leading-relaxed text-zinc-300/90">
              <span className="absolute left-0 top-2.5 w-1.5 h-1.5 rounded-full bg-emerald-500/60"></span>
              {li}
            </li>
          ))}
          <CitationSup />
        </ul>
      );

    case "quote":
      return (
        <blockquote className="my-10 pl-6 border-l-4 border-emerald-500 bg-gradient-to-r from-emerald-900/10 to-transparent py-4 pr-4 rounded-r-lg">
          <p className="text-xl md:text-2xl font-serif italic text-zinc-200 leading-relaxed opacity-90">
            "{block.text}"
          </p>
          {block.quoteAuthor && (
            <footer className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-400/80 uppercase tracking-wider">
               <span className="w-4 h-[1px] bg-emerald-500/50"></span>
               {block.quoteAuthor}
            </footer>
          )}
          <CitationSup />
        </blockquote>
      );

    case "code":
      return (
        <div className="my-8 rounded-lg overflow-hidden border border-zinc-800 bg-[#0d0d0d] shadow-2xl">
          {block.codeLanguage && (
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/80 border-b border-zinc-800">
               <span className="text-xs font-mono text-zinc-400 lowercase">{block.codeLanguage}</span>
               <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/20"></div>
               </div>
            </div>
          )}
          <pre className="p-5 overflow-x-auto text-sm font-mono leading-relaxed text-zinc-300">
            <code className="whitespace-pre">{block.text}</code>
          </pre>
        </div>
      );

    case "equation":
      return (
        <div className="my-8 p-6 flex justify-center items-center bg-zinc-900/30 border border-zinc-800/50 rounded-lg overflow-x-auto">
          <code className="font-mono text-lg md:text-xl text-emerald-300 whitespace-nowrap">
             {block.text}
          </code>
          <CitationSup />
        </div>
      );

    default:
      return null;
  }
}

// --- Helper for References ---
function ReferenceLine({ r }: { r: any }) {
  // APA-style formatting helper
  return (
    <span className="break-words">
       {r.authors && <span className="font-semibold text-zinc-300">{r.authors}. </span>}
       {r.year && <span className="text-zinc-500">({r.year}). </span>}
       <span className="italic text-zinc-200">{r.title}</span>
       {r.journal && <span>. <span className="italic opacity-80">{r.journal}</span></span>}
       {r.volume && <span>, {r.volume}</span>}
       {r.pages && <span>, {r.pages}</span>}
       .
       {r.doi && <a href={`https://doi.org/${r.doi}`} target="_blank" rel="noopener" className="ml-2 text-emerald-500/70 hover:text-emerald-400 text-xs hover:underline">doi:{r.doi}</a>}
       {r.url && <a href={r.url} target="_blank" rel="noopener" className="ml-2 text-emerald-500/70 hover:text-emerald-400 text-xs hover:underline">[View Link]</a>}
    </span>
  );
}