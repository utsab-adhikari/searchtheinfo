"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { FaGoogle, FaGithub, FaTwitter } from "react-icons/fa";

export default function SignIn() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const callbackUrl = "/";

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        ...formData,
        redirect: true,
        callbackUrl,
      });
      if (result?.error) setError(result.error);
    } catch {
      setError("An error occurred during sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = (provider) => signIn(provider, { callbackUrl });

  return (
    <div className="min-h-screen bg-[#1c1f26] text-gray-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center">
          <Link href="/" className="text-xl font-light">
            SearchThe
            <span className="text-emerald-400 font-medium">Info</span>
          </Link>
        </div>
        <h2 className="mt-6 text-3xl font-light text-gray-100">
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-gray-400">
          Or{" "}
          <Link
            href="/auth/signup"
            className="font-medium text-emerald-400 hover:text-emerald-300"
          >
            create a new account
          </Link>
        </p>
      </div>

      {/* Form */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#252932] border border-gray-700 py-8 px-6 shadow rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Email address
              </label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-300"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  href="#"
                  className="font-medium text-emerald-400 hover:text-emerald-300"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-md transition disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Social Sign In */}
          <div className="mt-8">
            <div className="relative flex justify-center text-sm text-gray-400">
              <span className="px-2 bg-[#252932]">Or continue with</span>
            </div>

            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={() => handleSocialSignIn("google")}
                className="flex justify-center w-full items-center gap-2 px-4 py-2 border border-gray-700 rounded-md hover:bg-gray-800 text-gray-300 text-sm transition"
              >
                <FaGoogle /> Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
