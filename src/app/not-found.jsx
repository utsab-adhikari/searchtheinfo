"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-[#0f1117] text-gray-100 px-4">
      {/* Main message */}
      <h1 className="text-6xl font-bold text-white mb-4">404</h1>
      <h2 className="text-2xl font-light text-gray-200 mb-6">
        Page Not Found
      </h2>
      <p className="text-gray-400 mb-8 text-center max-w-sm">
        Sorry, the page you are looking for does not exist or has been moved.
      </p>

      {/* Button to go back home */}
      <Link
        href="/"
        className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-md text-sm shadow transition"
      >
        Go Back Home
      </Link>
    </div>
  );
}
