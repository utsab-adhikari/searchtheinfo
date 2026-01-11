"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Terminal,
  Cpu,
  Globe,
  BookOpen,
  Users,
  Layers,
  Search,
} from "lucide-react";
import Header from "@/components/Header";
import { useSession } from "next-auth/react";
import { FaTimes } from "react-icons/fa";
import { FaBars } from "react-icons/fa6";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  tag: string;
  date: string;
  readTime: string;
}

interface Domain {
  title: string;
  description: string;
  icon: React.ElementType;
}

const recentArticles: Article[] = [
  {
    id: "net-01",
    title: "From Packets to Platforms: Understanding Computer Networks",
    excerpt:
      "A practical guide to how data actually moves across the internet — from physical links to application protocols.",
    tag: "Networking",
    date: "Sep 28, 2025",
    readTime: "15 min",
  },
  {
    id: "code-01",
    title: "Writing Better Code: Abstractions, Patterns, and Trade‑offs",
    excerpt:
      "Beyond syntax: principles, patterns, and ways of thinking that make your programs more robust and scalable.",
    tag: "Software Design",
    date: "Sep 18, 2025",
    readTime: "10 min",
  },
  {
    id: "ai-01",
    title: "AI in the Real World: From Research Papers to Products",
    excerpt:
      "How ideas from machine learning research turn into usable systems, tools, and everyday applications.",
    tag: "Applied AI",
    date: "Aug 30, 2025",
    readTime: "12 min",
  },
];

const researchDomains: Domain[] = [
  {
    title: "Computer Networking",
    description:
      "Internet architecture, routing, protocols, distributed systems, and real-world ops.",
    icon: Globe,
  },
  {
    title: "Software Engineering",
    description:
      "Code design, best practices, algorithms, and building reliable abstractions.",
    icon: Terminal,
  },
  {
    title: "AI & Machine Learning",
    description:
      "Core ML concepts, applied AI, model behavior, and systems impact.",
    icon: Cpu,
  },
  {
    title: "Systems & Infra",
    description:
      "OS, cloud infrastructure, scalability, observability, and performance.",
    icon: Layers,
  },
  {
    title: "Database",
    description:
      "Data modeling, storage engines, query optimization, and transaction management.",
    icon: BookOpen,
  },
  {
    title: "Tech, Trends & Society",
    description:
      "How technology shapes society, ethics in tech, and future trends.",
    icon: Users,
  },
];

export default function Home() {
  const [email, setEmail] = useState("");
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    //  newsletter logic
    console.log("Subscribing:", email);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-zinc-800 selection:text-zinc-100 font-sans">
      <main className="relative z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

       <Header />

        <section className="relative pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-24 px-4 text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs sm:text-sm font-medium mb-6 sm:mb-8">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            live: version 0.1.1 (test) deployed jan 11, 2026
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-4 sm:mb-6 text-white leading-tight">
            Decoding the <br className="hidden sm:block" />
            Complex World of Tech
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-zinc-300 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed">
            Deep dives into Networking, Programming, AI, and academic topics.
            Understanding clearly, focusing on{" "}
            <span className="font-semibold text-emerald-400">
              first principles
            </span>{" "}
            and how things actually work.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Link
              href="/articles"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              Start Reading <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/interested"
              className="px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 transition-all text-zinc-300 flex items-center justify-center text-sm sm:text-base"
            >
              Interested
            </Link>
          </div>
        </section>

        <section
          id="articles"
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 sm:mb-12 gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
                Recent Insights
              </h2>
              <p className="text-zinc-400 mt-2 text-sm sm:text-base">
                Latest breakdowns and technical deep dives.
              </p>
            </div>
            <Link
              href="/articles"
              className="group flex items-center gap-1 text-emerald-400 text-sm font-medium hover:text-emerald-300 transition-colors"
            >
              View archive{" "}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-6 lg:gap-8">
            {recentArticles.map((article) => (
              <Link
                key={article.id}
                href={`/article/${article.id}`}
                className="group h-full"
              >
                <div className="h-full bg-zinc-900/50 border border-zinc-700 rounded-xl p-6 hover:border-emerald-500/50 hover:bg-zinc-900/70 transition-all flex flex-col backdrop-blur-sm">
                  <div className="flex justify-between items-start mb-4">
                    <span className="inline-block px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide uppercase">
                      {article.tag}
                    </span>
                    <span className="text-zinc-500 text-xs font-medium">
                      {article.readTime}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-semibold text-zinc-100 mb-3 group-hover:text-emerald-300 transition-colors leading-tight">
                    {article.title}
                  </h3>

                  <p className="text-zinc-400 text-sm sm:text-base leading-relaxed mb-6 flex-grow">
                    {article.excerpt}
                  </p>

                  <div className="flex items-center text-xs text-zinc-500 border-t border-zinc-800 pt-4 w-full mt-auto">
                    <span>{article.date}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section
          id="domains"
          className="relative py-16 sm:py-20 lg:py-24 bg-zinc-900/30 border-y border-zinc-800"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mb-4">
                Research Domains
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                Core areas of exploration. We don't just skim the surface; we go
                deep into the architecture of modern computing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
              {researchDomains.map((domain, i) => (
                <div
                  key={i}
                  className="flex gap-4 items-start group p-4 rounded-lg hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-colors">
                    <domain.icon className="w-6 h-6 sm:w-7 sm:h-7 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                      {domain.title}
                    </h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      {domain.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative mx-auto mt-5 max-w-md rounded-xl border border-emerald-500/30 bg-zinc-950 p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500 text-sm font-semibold text-emerald-400">
              UA
            </div>

            <div className="flex flex-col">
              <p className="text-xs uppercase tracking-wide text-emerald-500">
                Admin
              </p>
              <h1 className="text-lg font-semibold text-white leading-tight">
                Utsab Adhikari
              </h1>
              <p className="text-sm text-zinc-400">
                IT Engineering Student · Next.js Developer
              </p>
            </div>
          </div>
        </section>

        <section className="relative py-16 sm:py-20 lg:py-24 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-4">
              Join the Inner Circle
            </h2>
            <p className="text-zinc-400 mb-8 text-sm sm:text-base leading-relaxed">
              Get notified when new deep-dive articles drop. No spam, just
              technical breakdowns.
            </p>

            <form
              onSubmit={handleSubscribe}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="email"
                placeholder="developer@example.com"
                className="flex-1 bg-zinc-900/80 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-sm sm:text-base"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 sm:px-8 py-3 rounded-lg font-semibold transition-all whitespace-nowrap text-sm sm:text-base"
              >
                Subscribe
              </button>
            </form>
            <p className="text-xs sm:text-sm text-zinc-600 mt-4">
              Unsubscribe anytime.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
