"use client";
import Header from "@/components/Header";
import Link from "next/link";
import React, { useState } from "react";
import { FaGithub, FaLinkedin, FaXTwitter, FaFacebook } from "react-icons/fa6";

export default function Home() {
  const [email, setEmail] = useState("");

  const recentArticles = [
    {
      id: "coming-soon-01",
      title: "From Packets to Platforms: Understanding Computer Networks",
      excerpt:
        "A practical guide to how data actually moves across the internet — from physical links to application protocols.",
      tag: "Networking · Systems",
      date: "Sep 28, 2025",
      readTime: "15 min",
    },
    {
      id: "coming-soon-02",
      title: "Writing Better Code: Abstractions, Patterns, and Trade‑offs",
      excerpt:
        "Beyond syntax: principles, patterns, and ways of thinking that make your programs more robust and scalable.",
      tag: "Programming · Software Design",
      date: "Sep 18, 2025",
      readTime: "10 min",
    },
    {
      id: "coming-soon-03",
      title: "AI in the Real World: From Research Papers to Products",
      excerpt:
        "How ideas from machine learning research turn into usable systems, tools, and everyday applications.",
      tag: "AI · Applied Research",
      date: "Aug 30, 2025",
      readTime: "12 min",
    },
  ];

  const researchDomains = [
    {
      title: "Computer Networking",
      description:
        "Internet architecture, routing, protocols, distributed systems, and how real-world networks operate.",
    },
    {
      title: "Programming & Software Engineering",
      description:
        "Code design, best practices, algorithms, data structures, and building reliable software.",
    },
    {
      title: "Artificial Intelligence & Machine Learning",
      description:
        "Core ML concepts, applied AI, model behavior, and how AI systems impact real applications.",
    },
    {
      title: "Systems & Infrastructure",
      description:
        "Operating systems, cloud infrastructure, scalability, observability, and performance engineering.",
    },
    {
      title: "Academic & Technical Writing",
      description:
        "Turning dense technical and academic material into clear, accessible explanations.",
    },
    {
      title: "Tech & Society",
      description:
        "How emerging technologies shape education, work, privacy, and everyday life.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-100">
      <Header />

      {/* Hero */}
      <section className="text-center py-16 px-4 sm:px-6 max-w-2xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-light mb-4">
          SearchThe<span className="text-emerald-400 font-medium">Info</span>
        </h1>
        <p className="text-gray-400 mb-8 text-sm sm:text-base">
          Deep dives into Networking, Programming, AI, and academic topics —
          explained clearly, with a focus on how things actually work.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href={"/articles"}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-md text-sm shadow transition"
          >
            Explore Articles
          </Link>
          <Link
            href={"/interested"}
            className="border border-gray-700 bg-[#1a1c23] text-sm px-6 py-3 rounded-md hover:border-emerald-500 transition"
          >
            I&apos;m Interested
          </Link>
        </div>
      </section>

      {/* Articles */}
      <section
        id="articles"
        className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4 sm:gap-0">
          <h2 className="text-2xl sm:text-3xl font-light text-white">
            Recent Tech Insights
          </h2>
          <a href="/articles" className="text-emerald-400 font-medium text-sm">
            View all →
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {recentArticles.map((article) => (
            <div
              key={article.id}
              className="bg-[#1a1c23] border border-gray-800 rounded-lg p-5 sm:p-6 hover:border-emerald-500 transition"
            >
              <div className="flex justify-between text-xs mb-2 sm:mb-3">
                <span className="text-emerald-400 font-medium">
                  {article.tag}
                </span>
                <span className="text-gray-500">{article.date}</span>
              </div>
              <h3 className="text-lg font-medium mb-2 text-white">
                {article.title}
              </h3>
              <p className="text-gray-400 text-sm mb-4">{article.excerpt}</p>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{article.readTime}</span>
                <a
                  href={`/#${article.id}`}
                  className="text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Read →
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Research Domains */}
      <section
        id="domains"
        className="border-y border-gray-800 bg-[#14161d] py-16 sm:py-20"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-light text-white mb-2">
            Tech & Research Domains
          </h2>
          <p className="text-gray-400 mb-10 text-sm sm:text-base">
            Areas I explore across networking, programming, AI, and modern
            computing.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {researchDomains.map((domain, i) => (
              <div
                key={i}
                className="bg-[#1a1c23] border border-gray-800 rounded-lg p-5 sm:p-6 hover:border-emerald-500 transition"
              >
                <h3 className="text-lg font-medium mb-2 text-white">
                  {domain.title}
                </h3>
                <p className="text-gray-400 text-sm">{domain.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join Research Community */}
      <section className="py-20 px-4 sm:px-6 text-center bg-[#0f1117]">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl sm:text-3xl font-medium text-white mb-3">
            Join the Tech & Research Community
          </h2>
          <p className="text-gray-400 mb-6 text-sm sm:text-base">
            Get notified when new deep-dive articles on networking, programming,
            AI, and academic topics go live.
          </p>
          <button className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm sm:text-base px-6 py-3 rounded-md shadow transition">
            Join Now
          </button>
        </div>
      </section>
    </div>
  );
}