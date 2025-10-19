import GridShape from "../../components/common/GridShape";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";

export default function NotFound() {
  return (
    <>
      <PageMeta
        title="404 Page Not Found | ZAMAN.AI Dashboard"
        description="This page doesn't exist in the ZAMAN.AI admin dashboard system"
      />
      <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden z-1 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <GridShape />
        <div className="mx-auto w-full max-w-[300px] text-center sm:max-w-[400px]">
          <div className="mb-6">
            <svg width="300" height="200" viewBox="0 0 300 200" className="mx-auto">
              {/* ZAMAN.AI-themed 404 illustration */}
              <rect width="300" height="200" fill="transparent" />
              
              {/* ZAMAN.AI logo shape */}
              <path 
                d="M150 50L180 90H120L150 50Z" 
                fill="#ff671b" 
                className="animate-bounce"
              />
              
              {/* 404 text with ZAMAN.AI colors */}
              <text 
                x="150" 
                y="140" 
                fontFamily="sans-serif" 
                fontWeight="bold" 
                fontSize="60" 
                textAnchor="middle"
                fill="#ff671b"
              >
                404
              </text>
              
              {/* Decorative elements */}
              <circle cx="80" cy="60" r="8" fill="#f38b00" opacity="0.7" />
              <circle cx="220" cy="70" r="6" fill="#8db92e" opacity="0.7" />
              <path 
                d="M100 160L120 180M120 160L100 180" 
                stroke="#ff671b" 
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path 
                d="M180 160L200 180M200 160L180 180" 
                stroke="#ff671b" 
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <h1 className="mb-4 text-3xl font-bold text-gray-800 dark:text-white/90 sm:text-4xl">
            Page Not Found
          </h1>

          <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <Link
            to="/"
            className="
              inline-flex items-center justify-center
              rounded-xl
              bg-[#ff671b] text-white
              px-6 py-3 text-base font-medium
              shadow-md
              hover:bg-[#e05c17] hover:shadow-lg
              transition-all duration-200
              dark:bg-[#ff671b] dark:hover:bg-[#e05c17]
            "
          >
            Return to Dashboard
          </Link>
        </div>
        
        {/* Footer */}
        <p className="absolute text-sm text-center text-gray-500 -translate-x-1/2 bottom-6 left-1/2 dark:text-gray-400">
          © {new Date().getFullYear()} ZAMAN.AI Dashboard
        </p>
      </div>
    </>
  );
}