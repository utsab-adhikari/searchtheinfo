// components/AuthButtons.jsx
"use client";
import { useState } from "react";

export default function AuthButtons() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  return (
    <div className="relative">
      <button 
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Login / Sign Up
      </button>
      
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">For Members</h3>
              <p className="text-sm text-gray-600 mb-3">
                Access exclusive content, save articles, and join discussions.
              </p>
              <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition">
                Member Login
              </button>
            </div>
            
            <div className="border-t pt-3">
              <h3 className="font-semibold text-gray-900 mb-2">For Administrators</h3>
              <p className="text-sm text-gray-600 mb-3">
                Content management and platform administration.
              </p>
              <button className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition">
                Admin Portal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}