"use client";
import { FaGithub, FaLinkedin, FaXTwitter, FaFacebook, FaEnvelope } from "react-icons/fa6";
import Link from "next/link";
import React from "react";

export default function SecondLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className=" text-gray-100">
        <>{children}</>

        <footer className="border-t border-gray-800 bg-zinc-950 text-gray-400">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
              
              {/* Brand & Description */}
              <div>
                <Link href="/" className="inline-block mb-3">
                  <strong className="text-xl font-light text-white">
                    SearchThe
                    <span className="text-emerald-400 font-medium">Info</span>
                  </strong>
                </Link>
                <p className="text-sm text-gray-500 mb-4">
                  Academic and technical deep dives on networking, AI, systems, and software engineering.
                </p>
                <p className="text-sm flex items-center gap-2">
                  <FaEnvelope className="text-emerald-400" />
                  <a href="mailto:contact@utsabadhikari.me" className="hover:text-emerald-400 transition">
                    contact@utsabadhikari.me
                  </a>
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-white font-medium mb-4 text-sm uppercase tracking-wider">Explore</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/articles" className="hover:text-emerald-400 transition">Articles</Link></li>
                  <li><Link href="/interested" className="hover:text-emerald-400 transition">Get Involved</Link></li>
                  <li><Link href="/about" className="hover:text-emerald-400 transition">About</Link></li>
                  <li><a href="https://utsabadhikari.me" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition">Portfolio</a></li>
                </ul>
              </div>

              {/* Research Domains */}
              <div>
                <h3 className="text-white font-medium mb-4 text-sm uppercase tracking-wider">Domains</h3>
                <ul className="space-y-2 text-sm">
                  <li>Computer Networking</li>
                  <li>AI & Machine Learning</li>
                  <li>Systems Engineering</li>
                  <li>Software Design</li>
                  <li>Tech & Society</li>
                </ul>
              </div>

              {/* Social & Community */}
              <div>
                <h3 className="text-white font-medium mb-4 text-sm uppercase tracking-wider">Connect</h3>
                <div className="flex gap-4 mb-4">
                  <a
                    href="https://github.com/utsab-adhikari/searchtheinfo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-emerald-400 text-xl transition"
                    aria-label="GitHub"
                  >
                    <FaGithub />
                  </a>
                  <a
                    href="https://linkedin.com/in/utsabadhikari" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-emerald-400 text-xl transition"
                    aria-label="LinkedIn"
                  >
                    <FaLinkedin />
                  </a>
                  <a
                    href="https://x.com/searchtheinfo" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-emerald-400 text-xl transition"
                    aria-label="X (Twitter)"
                  >
                    <FaXTwitter />
                  </a>
                  <a
                    href="https://www.facebook.com/searchtheinfo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-emerald-400 text-xl transition"
                    aria-label="Facebook"
                  >
                    <FaFacebook />
                  </a>
                </div>
                <p className="text-xs text-gray-500">
                  Open to research collabs, open-source contributions, and academic discussions.
                </p>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-6 border-t border-gray-800 text-center text-xs text-gray-500">
              © {new Date().getFullYear()} SearchTheInfo — An initiative by{" "}
              <a
                href="https://utsabadhikari.me"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline"
              >
                Utsab Adhikari
              </a>
              . All Rights Reserved.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}