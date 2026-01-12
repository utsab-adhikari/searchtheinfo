"use client";

import React from "react";
import Link from "next/link";
import ThemeToggle from "./theme-toggle";
import ViewsCounter from "./views-counter";
import ShareMenu from "./share-menu";

interface ArticleHeaderProps {
  title: string;
  authors: Array<{ name: string }>;
  created: Date;
  updated: Date;
  category?: { title: string };
  persistentId?: string;
  keywords?: string[];
  slug: string;
  views: number;
  abstract: string;
}

export default function ArticleHeader({
  title,
  authors,
  created,
  updated,
  category,
  persistentId,
  keywords,
  slug,
  views,
  abstract,
}: ArticleHeaderProps) {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6">
          <div className="flex-1 w-full">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
              {title}
            </h1>
            {authors && authors.length > 0 && (
              <p className="mt-2 sm:mt-3 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
                {authors.map((a: any) => a.name).filter(Boolean).join(", ")}
              </p>
            )}
            <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1">
                <span className="font-medium">Published:</span>
                <time dateTime={created.toISOString()}>{created.toLocaleDateString()}</time>
              </span>
              <span className="text-zinc-300 dark:text-zinc-600">•</span>
              <span className="inline-flex items-center gap-1">
                <span className="font-medium">Updated:</span>
                <time dateTime={updated.toISOString()}>{updated.toLocaleDateString()}</time>
              </span>
              {category && (
                <>
                  <span className="text-zinc-300 dark:text-zinc-600">•</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="font-medium">Category:</span>
                    <Link 
                      href={`/categories/${String(category.title)}`} 
                      className="text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      {String(category.title)}
                    </Link>
                  </span>
                </>
              )}
              {persistentId && (
                <>
                  <span className="hidden sm:inline text-zinc-300 dark:text-zinc-600">•</span>
                  <span className="inline-flex items-center gap-1 w-full sm:w-auto">
                    <span className="font-medium">ID:</span>
                    <span className="font-mono text-xs">{persistentId}</span>
                  </span>
                </>
              )}
            </div>
            {keywords?.length ? (
              <div className="mt-3 sm:mt-4 flex flex-wrap gap-2">
                {keywords.map((k: string, i: number) => (
                  <span 
                    key={`${k}-${i}`} 
                    className="text-xs sm:text-sm px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 transition-colors"
                  >
                    {k}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex-shrink-0 flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <ShareMenu
                title={title}
                url={`${process.env.NEXT_PUBLIC_SITE_URL || ""}/articles/v1/${slug}`}
                abstract={abstract || ""}
              />
            </div>
            <ViewsCounter slug={slug} initialViews={views || 0} />
          </div>
        </div>
      </div>
    </header>
  );
}
