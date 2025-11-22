"use client";
import Header from "@/components/Header";
import Link from "next/link";
import { FaGithub, FaFacebook, FaGlobe, FaWhatsapp, FaEnvelope } from "react-icons/fa";
import { HiOutlineMail } from "react-icons/hi";

export default function AboutClientPage() {
  const contacts = [
    {
      icon: <FaGlobe className="text-emerald-400 text-lg" />,
      label: "Portfolio",
      value: "utsabadhikari.me",
      link: "https://utsabadhikari.me",
    },
    {
      icon: <FaEnvelope className="text-emerald-400 text-lg" />,
      label: "Professional Email",
      value: "contact@utsabadhikari.me",
      link: "mailto:contact@utsabadhikari.me",
    },
    {
      icon: <FaGithub className="text-emerald-400 text-lg" />,
      label: "GitHub",
      value: "/utsab-adhikari/searchtheinfo",
      link: "https://github.com/utsab-adhikari/searchtheinfo",
    },
    {
      icon: <FaFacebook className="text-emerald-400 text-lg" />,
      label: "Facebook",
      value: "/searchtheinfo",
      link: "https://facebook.com/searchtheinfo",
    },
    {
      icon: <FaWhatsapp className="text-emerald-400 text-lg" />,
      label: "WhatsApp",
      value: "+977 9867508725",
      link: "https://wa.me/9779867508725",
    },
    {
      icon: <HiOutlineMail className="text-emerald-400 text-lg" />,
      label: "Personal Email",
      value: "utsab_ad@proton.me",
      link: "mailto:utsab_ad@proton.me",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-100 flex flex-col">
     <Header />

      {/* About Section */}
      <main className="flex-grow px-6 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-10">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4">
              About <span className="text-emerald-400">SearchTheInfo</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              SearchTheInfo is a modern research and content platform built for researchers, writers, 
              and curious minds. It helps organize knowledge, manage ideas, and present research 
              efficiently — all in one place.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-gray-400 text-base leading-relaxed">
              Hi, I’m <span className="text-emerald-400 font-medium">Utsab Adhikari</span> — a full-stack 
              developer and IT engineering student from Nepal. I love building useful digital tools 
              that connect technology with creativity and purpose.
            </p>
          </div>

          <div className="border-t border-gray-800"></div>

          {/* Contact Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white">🌐 Connect with Me</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              {contacts.map((item, i) => (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-[#1a1c23] border border-gray-800 hover:border-emerald-500/40 rounded-lg p-4 transition-colors"
                >
                  {item.icon}
                  <div>
                    <p className="text-sm text-gray-400">{item.label}</p>
                    <p className="text-white font-medium hover:text-emerald-400 transition-colors text-sm">
                      {item.value}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
