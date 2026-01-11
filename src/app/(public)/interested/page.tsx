"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { Loader2 } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

export default function Interested() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    projectType: "",
    researchTopics: "",
    timeline: "",
    budget: "",
    requirements: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.currentTarget;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/interested", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Submission failed");
      }

      setSubmitted(true);
      setForm({
        name: "",
        email: "",
        projectType: "",
        researchTopics: "",
        timeline: "",
        budget: "",
        requirements: "",
      });
      toast.success("Thank you for your interest!");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] text-gray-100">

        <Toaster position="top-right" />
        <Header />

        {/* Success Message */}
        <section className="max-w-2xl mx-auto px-6 py-20 text-center">
          <div className="relative bg-zinc-900 border border-emerald-500/30 rounded-xl p-8">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl text-emerald-400">✓</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Thank You for Your Interest!
            </h1>
            <p className="text-gray-400 mb-6">
              We've received your submission and will contact you within 24 hours to discuss
              your custom research platform. We're excited to learn more about your project!
            </p>

            <div className="space-y-4 mb-8">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-emerald-400 font-medium mb-2">What happens next?</h3>
                <ul className="text-sm text-gray-400 space-y-1 text-left">
                  <li>• We'll review your project requirements</li>
                  <li>• Schedule a free consultation call</li>
                  <li>• Provide a detailed proposal and timeline</li>
                  <li>• Answer any questions you have</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-500">Prefer to reach out directly?</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="mailto:contact@utsabadhikari.me"
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:border-emerald-500 transition-colors"
                >
                  contact@utsabadhikari.me
                </a>
                <a
                  href="https://wa.me/9779867508725"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:border-emerald-500 transition-colors"
                >
                  +977 9867508725
                </a>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-800">
              <Link
                href="/"
                className="text-emerald-400 hover:text-emerald-300 font-medium"
              >
                ← Return to Homepage
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screens bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] text-gray-100">
        <div className=""></div>

      <Toaster position="top-right" />
      <Header />

      {/* Intro Section */}
      <section className="text-center py-16 px-4 sm:px-6 max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-light mb-4 text-white">
          Interested in Your Own <span className="text-emerald-400 font-medium">Research Platform?</span>
        </h1>
        <p className="text-gray-400 mb-8 text-sm sm:text-base leading-relaxed">
          We're crafting personalized research editing and showcase platforms —
          built to transform your academic or creative work into a structured,
          interactive, and visually engaging experience.
          <br />
          You'll get a custom-built space with tailored design, secure backend,
          and easy content management — ideal for students, researchers, or
          independent creators who want to publish and organize knowledge professionally.
        </p>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 rounded-md border-y border-gray-800 bg-[#14161d]">
        <h2 className="text-2xl sm:text-3xl font-light text-center text-white mb-10">
          How We Can Make It Personal for You
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-center">
          {[
            {
              title: "Customized Interface",
              desc: "Your research dashboard, tailored to your theme, with modular layouts and optimized readability.",
            },
            {
              title: "Editable & Collaborative",
              desc: "Write, edit, and organize research content easily — with options for co-authoring and version tracking.",
            },
            {
              title: "Portfolio-Ready Design",
              desc: "Integrated project showcase for personal branding — connected to your domain or portfolio.",
            },
            {
              title: "Secure & Scalable",
              desc: "Built with MERN/Next.js backend, secure authentication, and scalable cloud setup.",
            },
            {
              title: "Analytics & Insights",
              desc: "Track visitors, engagement, and reading time — useful for improving and sharing impact.",
            },
            {
              title: "Expandable Features",
              desc: "Add AI summarizers, publication tools, citations, and multimedia embeds as your work evolves.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-[#1a1c23] border border-gray-800 rounded-lg p-6 hover:border-emerald-500 transition"
            >
              <h3 className="text-lg font-medium mb-2 text-white">
                {item.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Form Section */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-medium text-white mb-3">
              Express Your Interest
            </h2>
            <p className="text-gray-400 text-sm sm:text-base">
              Fill out this detailed form — we'll get in touch to discuss your
              personalized research or showcase platform.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 bg-[#1a1c23] border border-gray-800 rounded-lg p-6 shadow"
          >
            {/* Name & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2 text-gray-300">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm mb-2 text-gray-300">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            {/* Project Type */}
            <div>
              <label className="block text-sm mb-2 text-gray-300">Project Type *</label>
              <select
                name="projectType"
                value={form.projectType}
                onChange={handleChange}
                required
                className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="">Select your project type</option>
                <option value="academic">Academic Research</option>
                <option value="personal">Personal Research Project</option>
                <option value="institutional">Institutional Platform</option>
                <option value="educational">Educational Content</option>
                <option value="corporate">Corporate R&D</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Research Topics */}
            <div>
              <label className="block text-sm mb-2 text-gray-300">Research Topics *</label>
              <input
                type="text"
                name="researchTopics"
                value={form.researchTopics}
                onChange={handleChange}
                required
                className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="e.g., History, Science, Technology, Literature..."
              />
            </div>

            {/* Timeline & Budget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2 text-gray-300">Timeline *</label>
                <select
                  name="timeline"
                  value={form.timeline}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="">Select timeline</option>
                  <option value="asap">As soon as possible</option>
                  <option value="1month">Within 1 month</option>
                  <option value="3months">Within 3 months</option>
                  <option value="6months">Within 6 months</option>
                  <option value="flexible">Flexible timeline</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2 text-gray-300">Budget Range *</label>
                <select
                  name="budget"
                  value={form.budget}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="">Select budget range</option>
                  <option value="basic">Basic Setup ($500-$1,000)</option>
                  <option value="standard">Standard Platform ($1,000-$2,500)</option>
                  <option value="premium">Premium Custom ($2,500-$5,000)</option>
                  <option value="enterprise">Enterprise Solution ($5,000+)</option>
                  <option value="discuss">Let's discuss</option>
                </select>
              </div>
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm mb-2 text-gray-300">Specific Requirements</label>
              <textarea
                name="requirements"
                value={form.requirements}
                onChange={handleChange}
                rows={4}
                className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                placeholder="Tell us about any specific features, integrations, or special requirements you have..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white font-medium px-6 py-3 rounded-lg shadow transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Interest"
              )}
            </button>
          </form>

          <div className="text-center mt-8">
            <p className="text-gray-400 text-sm">
              For direct contact or project discussion:{" "}
              <a
                href="mailto:contact@utsabadhikari.me"
                className="text-emerald-400 hover:text-emerald-300"
              >
                contact@utsabadhikari.me
              </a>
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Do visit{" "}
              <a
                href="https://utsabadhikari.me"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300"
              >
                utsabadhikari.me
              </a>{" "}
              to learn more about my work and vision.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
