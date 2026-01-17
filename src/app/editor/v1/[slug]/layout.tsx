import type { Metadata } from "next";
import React from "react";

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
};

async function fetchArticleForMetadata(slug: string) {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/articles/v1/${slug}`, {
      next: { revalidate: 120 },
    });

    if (!res.ok) return null;

    const data = await res.json().catch(() => null as any);
    if (!data?.data) return null;

    const a = data.data;

    return {
      title: a.title as string,
      excerpt: (a.excerpt as string) || (a.description as string),
      tags: (a.tags as string[]) || [],
      slug: a.slug as string,
      featuredImage: a.featuredImage
        ? {
            url: typeof a.featuredImage.url === "string" ? a.featuredImage.url : undefined,
            title: a.featuredImage.title as string | undefined,
          }
        : null,
      publishedAt: (a.publishedAt as string) || (a.createdAt as string),
      updatedAt: (a.updatedAt as string) || undefined,
    };
  } catch (e) {
    console.error("Failed to fetch article for metadata:", e);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticleForMetadata(slug);
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/articles/v1/${slug}`;

  const DEFAULT_OG_IMAGE = `${baseUrl}/og-image.png`;

  if (!article) {
    const title = "Article not found | SearchTheInfo";
    const description =
      "This article could not be found on SearchTheInfo. Browse other deep dives on networking, programming, AI, and technical topics.";

    return {
      title,
      description,
      alternates: { canonical: url },
      robots: { index: false, follow: true },
      openGraph: {
        title,
        description,
        url,
        siteName: "SearchTheInfo",
        type: "article",
        images: [{ url: DEFAULT_OG_IMAGE }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [DEFAULT_OG_IMAGE],
      },
    };
  }

  const { title: rawTitle, excerpt, tags, featuredImage, publishedAt, updatedAt } = article;

  const pageTitle = `Editor | ${rawTitle}`;
  const description =
    excerpt ||
    "Deep technical research on networking, programming, AI, and more — explained clearly.";

  let ogImageUrl = DEFAULT_OG_IMAGE;

  if (featuredImage?.url) {
    if (featuredImage.url.startsWith("http")) {
      ogImageUrl = featuredImage.url;
    } else {
      ogImageUrl = `${baseUrl}${featuredImage.url}`;
    }
  }

  return {
    title: pageTitle,
    description,
    alternates: { canonical: url },
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
    robots: { index: true, follow: true },
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

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}