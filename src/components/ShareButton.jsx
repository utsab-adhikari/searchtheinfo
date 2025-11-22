"use client";
import { useState } from "react";
import { FaFacebookF, FaWhatsapp, FaLink, FaTimes } from "react-icons/fa";

export default function ShareModal({ articleTitle }) {
  const [open, setOpen] = useState(false);
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    alert("Link copied to clipboard!");
    setOpen(false);
  };

  const handleFacebookShare = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      currentUrl
    )}`;
    window.open(fbUrl, "_blank", "width=600,height=400");
    setOpen(false);
  };

  const handleWhatsAppShare = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `${articleTitle} - ${currentUrl}`
    )}`;
    window.open(waUrl, "_blank");
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
      >
        <FaLink />
        <span className="">Share</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50">
          <div className="bg-[#1a1c23] rounded-xl p-6 w-80 sm:w-96 text-gray-100 relative shadow-xl">
            {/* Close Button */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
            >
              <FaTimes size={18} />
            </button>

            {/* Title */}
            <h2 className="text-lg font-semibold mb-4">{articleTitle}</h2>
            <p className="text-gray-400 mb-6">Share this article via:</p>

            {/* Share Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleFacebookShare}
                className="flex items-center justify-center gap-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <FaFacebookF /> Facebook
              </button>
              <button
                onClick={handleWhatsAppShare}
                className="flex items-center justify-center gap-3 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
              >
                <FaWhatsapp /> WhatsApp
              </button>
              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-3 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <FaLink /> Copy Link
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
