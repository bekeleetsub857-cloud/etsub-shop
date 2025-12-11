import { Link } from "react-router-dom";
import { useState } from "react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const CONTACT_NUMBER = "+251992011629";

  // Use PUBLIC_URL to correctly reference assets on GitHub Pages
  const logo192 = `${process.env.PUBLIC_URL}/logo192.png`;
  const logo512 = `${process.env.PUBLIC_URL}/logo512.png`;

  return (
    <header className="sticky top-0 z-[999] bg-[#064a40] shadow-xl">
      <div className="max-w-7xl mx-auto flex justify-between items-center p-4 md:p-6">
        {/* Logo + Brand */}
        <Link to="/" className="flex items-center gap-3 z-[1001]">
          <img
            src={logo192}
            srcSet={`${logo192} 192w, ${logo512} 512w`}
            sizes="(max-width: 768px) 48px, 64px"
            alt="ETSUB SHOP Logo"
            className="w-10 h-10 md:w-12 md:h-12 object-contain rounded-full"
          />
          <div className="leading-tight">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
              ETSUB <span className="text-yellow-400">SHOP</span>
            </h1>
            <p className="text-xs text-white/70 -mt-0.5 font-medium hidden md:block">
              Online Fashion Boutique
            </p>
          </div>
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-8 z-[1001]">
          <Link
            to="/"
            className="text-white hover:text-yellow-300 font-medium transition"
          >
            Home
          </Link>

          <Link
            to="/admin"
            className="text-white hover:text-yellow-300 font-medium transition"
          >
            Admin
          </Link>

          <a
            href={`tel:${CONTACT_NUMBER}`}
            className="text-white hover:text-yellow-300 font-medium transition"
          >
            Call Us: +251 992011629
          </a>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-white/20 transition z-[1001]"
        >
          <svg
            className={`w-6 h-6 text-white transition-transform ${
              isMenuOpen ? "rotate-90" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Panel */}
      <div
        className={`md:hidden fixed inset-x-0 top-16 bg-[#064a40] p-6 shadow-lg z-[1000] transition-all duration-300 ${
          isMenuOpen ? "translate-y-0 opacity-100 visible" : "-translate-y-2 opacity-0 invisible"
        }`}
      >
        <nav className="flex flex-col gap-4 text-center">
          <Link
            to="/"
            onClick={() => setIsMenuOpen(false)}
            className="py-3 text-lg text-white font-medium hover:text-yellow-300 border-b border-white/20"
          >
            Home
          </Link>

          <Link
            to="/admin"
            onClick={() => setIsMenuOpen(false)}
            className="py-3 text-lg text-white font-medium hover:text-yellow-300 border-b border-white/20"
          >
            Admin
          </Link>

          <a
            href={`tel:${CONTACT_NUMBER}`}
            onClick={() => setIsMenuOpen(false)}
            className="py-3 text-lg text-white font-medium hover:text-yellow-300"
          >
            Call Us: +251 992011629
          </a>
        </nav>
      </div>

      {/* Dark Background When Menu Open */}
      {isMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-[500]"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </header>
  );
}
