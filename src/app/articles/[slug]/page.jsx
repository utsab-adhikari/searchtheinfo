import ArticleClient from "./ArticleClient";

// Helper to get base URL on server
const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
};

// Fetch minimal article data for metadata (server-side)
async function fetchArticleForMetadata(slug) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/articles/${slug}`, {
      // Adjust revalidation as you like
      next: { revalidate: 60 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data?.article) return null;

    const a = data.article;

    return {
      title: a.title,
      excerpt: a.excerpt || a.description,
      tags: a.tags || [],
      slug: a.slug,
      featuredImage: a.featuredImage
        ? {
            url: a.featuredImage.url,
            title: a.featuredImage.title,
          }
        : null,
      publishedAt: a.publishedAt,
      updatedAt: a.updatedAt,
    };
  } catch (e) {
    console.error("Failed to fetch article for metadata:", e);
    return null;
  }
}

export async function generateMetadata({ params }) {
    const {slug} = await params;
  const article = await fetchArticleForMetadata(slug);
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/articles/${slug}`;

  // If article not found: 404-like metadata
  if (!article) {
    const title = "Article not found | SearchTheInfo";
    const description =
      "This article could not be found on SearchTheInfo. Browse other deep dives on networking, programming, AI, and technical topics.";

    return {
      title,
      description,
      alternates: {
        canonical: url,
      },
      robots: {
        index: false,
        follow: true,
      },
      openGraph: {
        title,
        description,
        url,
        siteName: "SearchTheInfo",
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  }

  const {
    title: rawTitle,
    excerpt,
    tags,
    featuredImage,
    publishedAt,
    updatedAt,
  } = article;

  const pageTitle = `${rawTitle} | SearchTheInfo`;
  const description =
    excerpt ||
    "Deep technical research on networking, programming, AI, and more — explained clearly.";

  const ogImageUrl = featuredImage?.url
    ? featuredImage.url.startsWith("http")
      ? featuredImage.url
      : `${baseUrl}${featuredImage.url}`
    : `${baseUrl}/default-og-image.png`; // optional fallback

  return {
    title: pageTitle,
    description,
    alternates: {
      canonical: url,
    },
    keywords: [
      ...(tags || []),
      "networking",
      "programming",
      "software engineering",
      "AI",
      "machine learning",
      "technical research",
      "SearchTheInfo",
    ],
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: "article",
      title: pageTitle,
      description,
      url,
      siteName: "SearchTheInfo",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: featuredImage?.title || rawTitle,
        },
      ],
      publishedTime: publishedAt || undefined,
      modifiedTime: updatedAt || undefined,
      tags,
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function Page({ params }) {
    const {slug} = await params;
  return <ArticleClient slug={slug} />;
}