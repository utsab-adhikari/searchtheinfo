"use client";

import React from "react";

export default function ArticleNotFound() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-[#0f1117] text-gray-100">

    <div>
        Article Not Found 😞 || Coming Soon
    </div>

      {/* Text */}
      <h1 className="text-3xl font-light text-white">
        SearchThe<span className="text-emerald-400 font-medium">Info</span>
      </h1>
      <p className="text-gray-400 mt-2">Loading, please wait...</p>
    </div>
  );
}
