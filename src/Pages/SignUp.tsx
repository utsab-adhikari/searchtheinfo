"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { FaGoogle } from "react-icons/fa";

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong");

      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: true,
        callbackUrl: "/",
      });

      if (result?.error) setError(result.error);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => signIn("google", { callbackUrl: "/" });

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500/20 selection:text-emerald-200 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Grid background */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* Brand header */}
      <div className="relative sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link href="/" className="inline-block text-lg font-semibold text-white hover:text-zinc-200 transition-colors">
          SearchThe<span className="text-emerald-400">Info</span>
        </Link>
      </div>

      {/* Card */}
      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900/60 border border-zinc-800 backdrop-blur-sm py-8 px-6 rounded-xl sm:px-8">
          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-semibold text-white">Create your account</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Already have an account?
              {" "}
              <Link href="/login" className="font-medium text-emerald-400 hover:text-emerald-300">
                Sign in
              </Link>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 bg-red-950/40 border border-red-800 text-red-300 px-4 py-3 rounded-md text-sm" role="alert" aria-live="polite">
              {error}
            </div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label className="block text-sm font-medium text-zinc-300" htmlFor="name">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                placeholder="Utsab Adhikari"
                aria-invalid={!!error}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                placeholder="you@example.com"
                aria-invalid={!!error}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-md transition disabled:opacity-50"
            >
              {isLoading && (
                <span className="inline-block h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" aria-hidden />
              )}
              {isLoading ? "Creating account" : "Sign up"}
            </button>
          </form>

          {/* Social Sign In */}
          <div className="mt-8">
            <div className="flex items-center gap-3 text-zinc-500 text-xs">
              <div className="flex-1 h-px bg-zinc-800" />
              <span>Or continue with</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <button
                onClick={handleGoogleSignIn}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-md hover:bg-zinc-800 text-zinc-200 text-sm transition"
              >
                <FaGoogle /> Continue with Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
