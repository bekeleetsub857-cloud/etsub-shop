// src/components/Header.jsx
import { Link } from "react-router-dom";
import { useState } from "react";

export default function Header() {
  const [lang, setLang] = useState("en");

  return (
    // UPDATED: Using a deeper, modern indigo/purple gradient for a premium look
    <header className="bg-gradient-to-r from-indigo-800 to-purple-800 text-white p-4 shadow-xl sticky top-0 z-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
        {/* Logo and Brand Name Section */}
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <img
            src={process.env.PUBLIC_URL + "/logo.png"} 
            alt="Etsub Online Shopping Logo"
            // UPDATED: Increased size for prominence
            className="h-16 w-16 object-contain rounded-full shadow-lg border-2 border-white"
          />
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Etsub <span className="text-pink-300">Online</span>
          </h1>
        </div>

        <nav className="mt-4 md:mt-0 flex gap-6 items-center">
          <Link to="/" className="text-lg hover:text-pink-300 transition-colors font-semibold">Home</Link>
          <Link to="/admin" className="text-lg hover:text-pink-300 transition-colors font-semibold">Admin</Link>
          <button
            onClick={() => setLang(lang === "en" ? "am" : "en")}
            className="px-4 py-2 bg-pink-500 text-white rounded-full font-bold hover:bg-pink-600 transition-all transform hover:scale-105 shadow-md"
          >
            {lang === "en" ? "አማ" : "EN"}
          </button>
        </nav>
      </div>
    </header>
  );
}