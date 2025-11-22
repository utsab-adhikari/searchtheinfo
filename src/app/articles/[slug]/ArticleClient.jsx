"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import axios from "axios";
import Header from "@/components/Header";
import { FaClock, FaEye } from "react-icons/fa6";
import { FaCalendar } from "react-icons/fa";
import ShareButton from "@/components/ShareButton";

/* === existing helpers === */

const CITATION_DATE_OPTIONS = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

const formatCitationDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", CITATION_DATE_OPTIONS);
};

export default function ArticleClient({ slug }) {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCitationNumber, setActiveCitationNumber] = useState(null);
  const [isTableOfContentsOpen, setIsTableOfContentsOpen] = useState(false);
  const { data: session } = useSession();

  const fetchArticle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/articles/${slug}`);

      if (!response.ok) {
        await response.json();
        return <ArticleNotFound />;
      }

      const data = await response.json();
      setArticle(data.article);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching article:", err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const getIPAddress = async () => {
    try {
      const res = await axios.get("https://api.ipify.org?format=json");
      return res.data.ip;
    } catch {
      return "unknown";
    }
  };

  const recordView = async (slugParam) => {
    try {
      const viewerId = (await session?.user?.id) || null;
      const ipAddress = await getIPAddress();

      await axios.post(`/api/articles/${slugParam}/view`, {
        viewerId,
        ipAddress,
      });

      setArticle((prev) =>
        prev
          ? {
              ...prev,
              views: [...(prev.views || []), { viewerId, ipAddress }],
            }
          : prev
      );
    } catch (err) {
      console.error("Failed to record view:", err);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchArticle();
      recordView(slug);
    }
  }, [slug, fetchArticle]);

  useEffect(() => {
    setActiveCitationNumber(null);
  }, [slug]);

  const handleCitationClick = useCallback((citationNumber, options = {}) => {
    if (!citationNumber) return;
    setActiveCitationNumber(citationNumber);
    if (options.scroll !== false) {
      const target = document.getElementById(`citation-${citationNumber}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, []);

  const scrollToHeading = useCallback((headingId) => {
    const element = document.getElementById(headingId);
    if (element) {
      const offset = 80;
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: "smooth",
      });
      setIsTableOfContentsOpen(false);
    }
  }, []);

  if (loading) {
    return <ArticleSkeleton />;
  }

  if (error || !article) {
    return <ArticleNotFound error={error} onRetry={fetchArticle} />;
  }

  const citations = article.citations || [];
  const citationPairs = citations.map((citation, index) => {
    const displayNumber =
      typeof citation.number === "number" ? citation.number : index + 1;
    return { citation, displayNumber };
  });
  const citationLookup = new Map(
    citationPairs.map(({ citation, displayNumber }) => [
      displayNumber,
      citation,
    ])
  );
  const sortedCitations = [...citationPairs].sort(
    (a, b) => a.displayNumber - b.displayNumber
  );
  const activeCitationData =
    activeCitationNumber !== null
      ? citationLookup.get(activeCitationNumber) ??
        citations[activeCitationNumber - 1]
      : null;

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-100">
      {/* Mobile Table of Contents Overlay */}
      {isTableOfContentsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 lg:hidden">
          <div className="bg-[#1a1c23] h-full w-80 max-w-full overflow-y-auto">
            <div className="p-4 border-b border-gray-800">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white">Contents</h2>
                <button
                  onClick={() => setIsTableOfContentsOpen(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <nav className="p-4">
              <ol className="space-y-2">
                {article.blocks
                  ?.filter((block) => block.type === "heading")
                  .map((heading, index) => (
                    <li key={index}>
                      <button
                        onClick={() => scrollToHeading(`heading-${index}`)}
                        className="text-left w-full text-emerald-400 hover:text-emerald-300 transition-colors text-sm"
                        style={{
                          paddingLeft: `${(heading.level - 1) * 16}px`,
                          fontSize: heading.level === 1 ? "1.1em" : "1em",
                        }}
                      >
                        {heading.content}
                      </button>
                    </li>
                  ))}
              </ol>
            </nav>
          </div>
        </div>
      )}

      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Table of Contents */}
          {article.blocks &&
            article.blocks.some((block) => block.type === "heading") && (
              <aside className="hidden lg:block lg:w-64 xl:w-72 flex-shrink-0">
                <nav className="sticky top-24 bg-[#1a1c23] border border-gray-800 rounded-lg p-6">
                  <h2 className="font-semibold text-white mb-4 text-lg">
                    Contents
                  </h2>
                  <ol className="space-y-3">
                    {article.blocks
                      .filter((block) => block.type === "heading")
                      .map((heading, index) => (
                        <li key={index}>
                          <button
                            onClick={() => scrollToHeading(`heading-${index}`)}
                            className="text-left w-full text-emerald-400 hover:text-emerald-300 transition-colors text-sm leading-relaxed"
                            style={{
                              paddingLeft: `${(heading.level - 1) * 16}px`,
                              fontSize: heading.level === 1 ? "1.1em" : "1em",
                              fontWeight: heading.level <= 2 ? "600" : "400",
                            }}
                          >
                            {heading.content}
                          </button>
                        </li>
                      ))}
                  </ol>
                </nav>
              </aside>
            )}

          {/* Main Article Content */}
          <main className="flex-1 min-w-0">
            <article className="bg-[#1a1c23] rounded-xl border border-gray-800 overflow-hidden">
              {/* Featured Image */}
              {article.featuredImage && (
                <div className="relative w-full h-48 sm:h-64 md:h-80 bg-gray-900 overflow-hidden">
                  <img
                    src={article.featuredImage.url}
                    alt={article.featuredImage.title || article.title}
                    className="w-full h-full object-cover"
                  />
                  {article.featuredImage.description && (
                    <span className="absolute bottom-2 right-2 text-gray-300 text-xs bg-black/40 px-2 py-1 rounded-md">
                      {article.featuredImage.description}
                    </span>
                  )}
                  {article.status === "draft" && (
                    <span className="absolute bottom-2 left-2 text-gray-300 text-xs bg-black/40 px-2 py-1 rounded-md">
                      Draft
                    </span>
                  )}
                  {article.featuredImage.attribution && (
                    <span className="absolute top-2 right-2 text-blue-300 text-xs bg-black/40 px-2 py-1 rounded-md">
                      {article.featuredImage.attribution}
                    </span>
                  )}
                  <div className=" absolute top-4 left-4 font-light text-white text-lg">
                    SearchThe
                    <span className="text-emerald-400 font-medium">Info</span>
                  </div>
                </div>
              )}
              <div className="p-4 sm:p-6 md:p-8">
                {/* Title and Metadata */}
                <header className="mb-6 md:mb-8 border-b border-gray-800 pb-6">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 md:mb-4 leading-tight">
                    {article.title}
                  </h1>

                  <div className="flex flex-wrap gap-3 md:gap-4 text-xs sm:text-sm text-gray-400 mb-3 md:mb-4">
                    <div className="flex items-center gap-2 text-gray-400 text-xs md:text-sm">
                      <FaClock />
                      {article.readingTime}
                    </div>
                    {article.views !== undefined && (
                      <div className="flex gap-2 items-center text-gray-400 text-xs md:text-sm">
                        <FaEye /> {article.views.length}
                      </div>
                    )}

                    {article.researchedBy && (
                      <div className="flex items-center gap-1 md:gap-2">
                        <span className="hidden sm:inline">
                          Researched by <b>{article.researchedBy.name}</b>
                        </span>
                        <span className="sm:hidden">
                          {article.researchedBy.name}
                        </span>
                      </div>
                    )}
                    {article.publishedAt && (
                      <div className="flex items-center gap-1 md:gap-2">
                        <span className="text-gray-400">
                          <FaCalendar />
                        </span>
                        <span>
                          {new Date(article.publishedAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {article.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full font-medium border border-emerald-500/30"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </header>

                {/* Excerpt */}
                {article.excerpt && (
                  <div className="bg-emerald-500/10 border-l-4 border-emerald-500 p-3 md:p-4 mb-6 md:mb-8 rounded-r">
                    <p className="text-base md:text-lg text-gray-200 italic">
                      {article.excerpt}
                    </p>
                  </div>
                )}

                {/* Mobile Table of Contents Button */}
                {article.blocks &&
                  article.blocks.some((block) => block.type === "heading") && (
                    <div className="lg:hidden mb-6">
                      <button
                        onClick={() => setIsTableOfContentsOpen(true)}
                        className="w-full bg-[#14161d] border border-gray-700 rounded-lg p-4 text-left hover:border-emerald-500 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-emerald-400 font-medium">
                            Table of Contents
                          </span>
                          <span className="text-gray-400">→</span>
                        </div>
                      </button>
                    </div>
                  )}

                {/* Article Content */}
                <div className="prose prose-sm sm:prose-base md:prose-lg max-w-none prose-invert">
                  {article.blocks &&
                    article.blocks.map((block, index) => (
                      <ArticleBlock
                        key={block._id || index}
                        block={block}
                        index={index}
                        citations={article.citations}
                        onCitationClick={handleCitationClick}
                      />
                    ))}
                </div>

                {/* Citations Section */}
                {sortedCitations.length > 0 && (
                  <section className="mt-8 md:mt-12 border-t border-gray-800 pt-6 md:pt-8">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">
                      References
                    </h2>
                    <div className="space-y-3 md:space-y-4">
                      {sortedCitations.map(({ citation, displayNumber }) => (
                        <Citation
                          key={citation._id || displayNumber}
                          citation={citation}
                          number={displayNumber}
                          isActive={activeCitationNumber === displayNumber}
                          onRequestDetails={() =>
                            handleCitationClick(displayNumber, {
                              scroll: false,
                            })
                          }
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Article Footer */}
                <footer className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-gray-800">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm text-gray-400">
                    <div>
                      <p>
                        Last updated:{" "}
                        {new Date(article.updatedAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                      {article.sources && article.sources.length > 0 && (
                        <p className="mt-1">
                          Sources: {article.sources.length} reference
                          {article.sources.length !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                    <ShareButton articleTitle={article.title} />
                  </div>
                </footer>
              </div>
            </article>

            {/* Related Articles */}
            <RelatedArticles currentSlug={article.slug} tags={article.tags} />
          </main>
        </div>
      </div>

      {/* Citation Modal */}
      {activeCitationNumber !== null && activeCitationData && (
        <CitationModal
          citation={activeCitationData}
          number={activeCitationNumber}
          onClose={() => setActiveCitationNumber(null)}
        />
      )}
    </div>
  );
}

// Article Block Component
function ArticleBlock({ block, index, citations, onCitationClick }) {
  useEffect(() => {
    // Global handler for citation clicks from dangerouslySetInnerHTML
    window.citationClickHandler = onCitationClick;
    return () => {
      window.citationClickHandler = null;
    };
  }, [onCitationClick]);

  switch (block.type) {
    case "heading":
      const HeadingTag = `h${block.level || 2}`;
      return (
        <HeadingTag
          id={`heading-${index}`}
          className="text-white font-bold mt-6 md:mt-8 mb-3 md:mb-4 scroll-mt-20"
          style={{
            fontSize:
              block.level === 1
                ? "1.75em"
                : block.level === 2
                ? "1.5em"
                : block.level === 3
                ? "1.25em"
                : "1.1em",
          }}
        >
          {block.content}
        </HeadingTag>
      );

    case "text": {
      const contentWithCitations = block.content?.replace(
        /\[(\d+)\]/g,
        (match, rawNumber) => {
          const requestedNumber = Number(rawNumber);
          if (!Number.isFinite(requestedNumber) || requestedNumber <= 0) {
            return match;
          }

          let displayNumber = requestedNumber;

          if (Array.isArray(citations) && citations.length > 0) {
            const citationMatch = citations.find((cite, idx) => {
              const candidateNumber =
                typeof cite.number === "number" ? cite.number : idx + 1;
              return candidateNumber === requestedNumber;
            });

            if (citationMatch) {
              const derivedNumber =
                typeof citationMatch.number === "number"
                  ? citationMatch.number
                  : citations.findIndex((cite) => cite === citationMatch) + 1;
              if (derivedNumber > 0) {
                displayNumber = derivedNumber;
              }
            }
          }

          return `<sup><button 
            onclick="event.preventDefault(); window.citationClickHandler && window.citationClickHandler(${displayNumber})"
            class="text-emerald-400 hover:text-emerald-300 font-medium text-xs align-super cursor-pointer mx-0.5 transition-colors"
            title="View citation ${displayNumber}"
          >[${displayNumber}]</button></sup>`;
        }
      );

      return (
        <div
          className="mb-4 md:mb-6 leading-6 md:leading-7 text-gray-300 text-sm md:text-base"
          dangerouslySetInnerHTML={{ __html: contentWithCitations }}
        />
      );
    }

    case "image":
      if (!block.image) return null;

      return (
        <figure className="my-6 md:my-8 text-center">
          <img
            src={block.image.url}
            alt={block.image.title || block.caption || "Article image"}
            className="mx-auto max-w-full h-auto rounded-lg border border-gray-700"
          />
          <figcaption className="mt-2 md:mt-3 text-xs md:text-sm text-gray-400 max-w-2xl mx-auto px-2">
            {block.caption || block.image.caption}
            {block.image.attribution && (
              <span className="text-gray-500 text-xs ml-2">
                ({block.image.attribution})
              </span>
            )}
          </figcaption>
        </figure>
      );

    default:
      return null;
  }
}

// Citation Component
function Citation({ citation, number, isActive, onRequestDetails }) {
  const publishedDate = formatCitationDate(citation.publishedDate);
  const accessedDate = formatCitationDate(citation.accessedDate);

  return (
    <div
      id={`citation-${number}`}
      className={`p-3 md:p-4 border-l-4 ${
        isActive
          ? "border-emerald-500 bg-emerald-500/10"
          : "border-gray-700 bg-[#14161d]"
      } rounded-r transition-colors`}
    >
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center font-medium mt-0.5">
          {number}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm md:text-base break-words">
            {citation.text}
          </p>
          {citation.authors && citation.authors.length > 0 && (
            <p className="text-xs md:text-sm text-gray-400 mt-1">
              <strong className="text-gray-300">Authors:</strong>{" "}
              {citation.authors.join(", ")}
            </p>
          )}
          {citation.publisher && (
            <p className="text-xs md:text-sm text-gray-400">
              <strong className="text-gray-300">Publisher:</strong>{" "}
              {citation.publisher}
            </p>
          )}
          {publishedDate && (
            <p className="text-xs md:text-sm text-gray-400">
              <strong className="text-gray-300">Published:</strong>{" "}
              {publishedDate}
            </p>
          )}
          {accessedDate && (
            <p className="text-xs md:text-sm text-gray-400">
              <strong className="text-gray-300">Accessed:</strong>{" "}
              {accessedDate}
            </p>
          )}
          {citation.url && (
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 text-xs md:text-sm break-all mt-1 inline-block transition-colors"
            >
              {citation.url}
            </a>
          )}
          {citation.note && (
            <p className="text-xs md:text-sm text-gray-500 mt-1 italic">
              {citation.note}
            </p>
          )}
          {onRequestDetails && (
            <button
              type="button"
              onClick={onRequestDetails}
              className="mt-2 inline-flex items-center gap-1 text-xs md:text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <span>View details</span>
              <span aria-hidden="true">→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Citation Modal Component
function CitationModal({ citation, number, onClose }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const publishedDate = formatCitationDate(citation.publishedDate);
  const accessedDate = formatCitationDate(citation.accessedDate);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1c23] border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg md:text-xl font-bold text-white">
              Citation {number ? `#${number}` : "Details"}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-2xl"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="space-y-3 md:space-y-4">
            <div>
              <strong className="text-gray-300 text-sm md:text-base">
                Reference:
              </strong>
              <p className="mt-1 text-white text-sm md:text-base">
                {citation.text}
              </p>
            </div>

            {citation.authors && citation.authors.length > 0 && (
              <div>
                <strong className="text-gray-300 text-sm md:text-base">
                  Authors:
                </strong>
                <p className="mt-1 text-gray-400 text-sm md:text-base">
                  {citation.authors.join(", ")}
                </p>
              </div>
            )}

            {citation.publisher && (
              <div>
                <strong className="text-gray-300 text-sm md:text-base">
                  Publisher:
                </strong>
                <p className="mt-1 text-gray-400 text-sm md:text-base">
                  {citation.publisher}
                </p>
              </div>
            )}

            {publishedDate && (
              <div>
                <strong className="text-gray-300 text-sm md:text-base">
                  Published:
                </strong>
                <p className="mt-1 text-gray-400 text-sm md:text-base">
                  {publishedDate}
                </p>
              </div>
            )}

            {accessedDate && (
              <div>
                <strong className="text-gray-300 text-sm md:text-base">
                  Accessed:
                </strong>
                <p className="mt-1 text-gray-400 text-sm md:text-base">
                  {accessedDate}
                </p>
              </div>
            )}

            {citation.url && (
              <div>
                <strong className="text-gray-300 text-sm md:text-base">
                  Source URL:
                </strong>
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-emerald-400 hover:text-emerald-300 break-all block transition-colors text-sm md:text-base"
                >
                  {citation.url}
                </a>
              </div>
            )}

            {citation.note && (
              <div>
                <strong className="text-gray-300 text-sm md:text-base">
                  Notes:
                </strong>
                <p className="mt-1 text-gray-400 italic text-sm md:text-base">
                  {citation.note}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6 pt-6 border-t border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm md:text-base"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Related Articles Component
function RelatedArticles({ currentSlug, tags }) {
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchRelated() {
      if (!tags || tags.length === 0) return;

      setLoading(true);
      try {
        const response = await fetch(
          `/api/articles/related?tags=${tags.join(
            ","
          )}&exclude=${currentSlug}&limit=4`
        );
        if (response.ok) {
          const data = await response.json();
          setRelatedArticles(data.articles || []);
        }
      } catch (error) {
        console.error("Error fetching related articles:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRelated();
  }, [tags, currentSlug]);

  if (relatedArticles.length === 0) return null;

  return (
    <section className="mt-8 md:mt-12">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">
        Related Research
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        {relatedArticles.map((article) => (
          <Link
            key={article._id}
            href={`/articles/${article.slug}`}
            className="block p-4 md:p-6 bg-[#1a1c23] border border-gray-800 rounded-lg hover:border-emerald-500 hover:shadow-lg transition-all"
          >
            <h3 className="font-semibold text-white mb-2 text-sm md:text-base line-clamp-2">
              {article.title}
            </h3>
            <p className="text-gray-400 text-xs md:text-sm mb-3 line-clamp-2">
              {article.excerpt}
            </p>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>{article.readingTime || 5} min read</span>
              <span>
                {new Date(
                  article.publishedAt || article.createdAt
                ).toLocaleDateString()}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// Loading Skeleton
function ArticleSkeleton() {
  return (
    <div className="min-h-screen bg-[#0f1117]">
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-[#0f1117]/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="text-xl sm:text-2xl">🔍</div>
              <div className="h-6 w-32 bg-gray-800 rounded animate-pulse"></div>
            </div>
            <div className="hidden lg:flex gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-4 w-16 bg-gray-800 rounded animate-pulse"
                ></div>
              ))}
            </div>
            <div className="lg:hidden">
              <div className="h-8 w-8 bg-gray-800 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Skeleton */}
          <div className="hidden lg:block lg:w-64 flex-shrink-0">
            <div className="sticky top-24 bg-[#1a1c23] border border-gray-800 rounded-lg p-6">
              <div className="h-6 bg-gray-800 rounded animate-pulse mb-4 w-3/4"></div>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-4 bg-gray-800 rounded animate-pulse mb-3"
                  style={{ marginLeft: `${i * 8}px` }}
                ></div>
              ))}
            </div>
          </div>

          {/* Main Content Skeleton */}
          <div className="flex-1">
            <div className="bg-[#1a1c23] rounded-xl border border-gray-800 p-4 sm:p-6 md:p-8">
              <div className="h-8 bg-gray-800 rounded animate-pulse mb-4 w-3/4"></div>
              <div className="h-4 bg-gray-800 rounded animate-pulse mb-2 w-1/2"></div>
              <div className="h-4 bg-gray-800 rounded animate-pulse mb-8 w-1/3"></div>

              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-4 bg-gray-800 rounded animate-pulse mb-3"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Error Component
function ArticleNotFound({ error, onRetry }) {
  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4 text-emerald-400">🔍</div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Article Not Found
        </h1>
        <p className="text-gray-400 mb-6">
          {error ||
            "The article you're looking for doesn't exist or hasn't been published yet."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/articles"
            className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            Browse All Articles
          </Link>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
