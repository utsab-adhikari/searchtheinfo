"use client";

import Header from "@/components/Header";
import { Mail, MessageCircle, Github, Linkedin, Code, ExternalLink, Users, BookOpen, Database, Zap } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px] text-zinc-100">
      <Header />
      
      
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-8 md:pb-16 md:pt-10">
        {/* Header Section */}
        <section className="mb-10 md:mb-12">
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-5xl mb-4">
            SearchThe<span className="text-emerald-400">Info</span>
          </h1>
          <p className="text-lg text-zinc-400 md:text-xl leading-relaxed max-w-3xl">
            A modern research platform for publishing, organizing, and showcasing in-depth technical articles with professional editing tools.
          </p>
        </section>

        {/* About the Project */}
        <section className="mb-10 rounded-xl border border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-400" />
            About the Platform
          </h2>
          <div className="space-y-4 text-zinc-300 leading-relaxed">
            <p>
              <span className="font-semibold text-emerald-400">SearchTheInfo</span> is a full-stack research and content management platform designed for publishing high-quality, in-depth technical articles. Built with modern web technologies, it provides a comprehensive ecosystem for researchers, writers, and content creators.
            </p>
            <p>
              The platform features a powerful editor with support for rich content blocks, citations, resources, images, and more. It includes an admin dashboard for content management, user management, analytics tracking, and activity monitoring.
            </p>
            <p>
              Whether you're documenting technical research, writing educational content, or building a knowledge base, SearchTheInfo provides all the tools you need in one elegant, professional interface.
            </p>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="mb-10 rounded-xl border border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Code className="w-6 h-6 text-emerald-400" />
            Tech Stack & Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Frontend</h3>
                  <p className="text-sm text-zinc-400">Next.js 14, React, TypeScript, Tailwind CSS</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                  <Database className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Backend</h3>
                  <p className="text-sm text-zinc-400">Next.js API Routes, MongoDB, Mongoose</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Authentication</h3>
                  <p className="text-sm text-zinc-400">NextAuth.js with secure session management</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-white mb-3">Key Features</h3>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Rich content editor with multiple block types
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Citations and reference management
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Image upload and media library
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Admin dashboard with analytics
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Activity tracking and monitoring
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Google Analytics integration
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Responsive design with dark theme
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Repository */}
        <section className="mb-10 rounded-xl border border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Github className="w-6 h-6 text-emerald-400" />
            Open Source Repository
          </h2>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            This project is open source and available on GitHub. Feel free to explore the code, contribute, or use it as inspiration for your own projects.
          </p>
          <a
            href="https://github.com/utsab-adhikari/searchtheinfo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-white font-medium transition-all group"
          >
            <Github className="w-5 h-5" />
            View on GitHub
            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-zinc-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">Next.js 14</p>
              <p className="text-xs text-zinc-500 mt-1">Framework</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">TypeScript</p>
              <p className="text-xs text-zinc-500 mt-1">Language</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-violet-400">MongoDB</p>
              <p className="text-xs text-zinc-500 mt-1">Database</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-cyan-400">Tailwind</p>
              <p className="text-xs text-zinc-500 mt-1">Styling</p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Mail className="w-6 h-6 text-emerald-400" />
            Get in Touch
          </h2>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            Have questions, feedback, or want to collaborate? Feel free to reach out through any of the following channels:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <a
              href="mailto:contact@utsabadhikari.me"
              className="flex items-center gap-4 p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:border-emerald-500/50 hover:bg-zinc-800 transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white mb-0.5">Email</p>
                <p className="text-sm text-zinc-400 truncate">contact@utsabadhikari.me</p>
              </div>
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/9779867508725"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:border-emerald-500/50 hover:bg-zinc-800 transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white mb-0.5">WhatsApp</p>
                <p className="text-sm text-zinc-400 truncate">+977 9867508725</p>
              </div>
            </a>

            {/* LinkedIn */}
            <a
              href="https://linkedin.com/in/utsabadhikari"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:border-blue-500/50 hover:bg-zinc-800 transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Linkedin className="w-6 h-6 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white mb-0.5">LinkedIn</p>
                <p className="text-sm text-zinc-400 truncate">in/utsabadhikari</p>
              </div>
            </a>

            {/* GitHub */}
            <a
              href="https://github.com/utsab-adhikari"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:border-violet-500/50 hover:bg-zinc-800 transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Github className="w-6 h-6 text-violet-400" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white mb-0.5">GitHub</p>
                <p className="text-sm text-zinc-400 truncate">/utsab-adhikari</p>
              </div>
            </a>
          </div>
        </section>

      </div>
    </div>
  );
}
