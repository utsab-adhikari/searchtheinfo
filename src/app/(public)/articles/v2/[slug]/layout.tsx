import React from "react";
import type { Metadata } from "next";

// Minimal shape for metadata generation
interface ArticleMeta {
  slug: string;
  title: string;
  abstract?: string;
  keywords?: string[];
  status?: string;
  sections?: any[];
}

// Util: get optimized Cloudinary URL (same as page, but server-only envs allowed)
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

function findFirstImagePublicId(article: Partial<ArticleMeta> & { sections?: any[] }): string | null {
  for (const sec of article.sections || []) {
    for (const blk of sec.blocks || []) {
      if (blk.type === "image" && blk.image?.publicId)
        return blk.image.publicId;
      if (blk.type === "image" && blk.image?.url) return null;
    }
  }
  return null;
}

function getBaseUrl(): string {
  let base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  if (base.endsWith("/")) base = base.slice(0, -1);
  return base;
}

async function fetchArticleMeta(slug: string): Promise<ArticleMeta | null> {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(
      `${baseUrl}/api/articles/v1/${encodeURIComponent(slug)}`,
      {
        next: { revalidate: 300 },
      },
    );

    if (!res.ok) return null;

    const data = (await res.json()) as {
      success: boolean;
      article?: ArticleMeta & { sections?: any[] };
      message?: string;
    };

    if (!data.success || !data.article) return null;
    return data.article;
  } catch (error) {
    console.error("Error fetching article metadata:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticleMeta(slug);

  if (!article) {
    return {
      title: "Article not found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const primaryImagePublicId = findFirstImagePublicId(article);
  const primaryImageUrl =
    (primaryImagePublicId &&
      getOptimizedCloudinaryUrl(primaryImagePublicId, {
        width: 1200,
        quality: 85,
      })) ||
    undefined;

  const title = article.title;
  const description = article.abstract || `Read: ${article.title}`;

  const baseUrl = getBaseUrl();
  const articlePath = `/articles/v1/${article.slug}`;
  const fullUrl = `${baseUrl}${articlePath}`;

  return {
    title: `${title} | Research Archive` ,
    description,
    keywords: article.keywords,
    alternates: {
      canonical: fullUrl,
    },
    robots: {
      index: article.status === "published",
      follow: article.status === "published",
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: fullUrl,
      images: primaryImageUrl
        ? [
            {
              url: primaryImageUrl,
              width: 1200,
              height: 630,
              alt: article.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: primaryImageUrl ? [primaryImageUrl] : undefined,
    },
  };
}

export default function ArticleSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
