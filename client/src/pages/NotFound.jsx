import React from "react";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream-50 px-4 text-center">
      <p className="text-6xl font-bold text-saffron-500">404</p>
      <h1 className="text-xl font-semibold text-maroon-800">Page Not Found</h1>
      <p className="max-w-sm text-sm text-maroon-700/70">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link
        to="/"
        className="mt-2 flex min-h-[48px] items-center gap-2 rounded-full bg-maroon-700 px-6 text-sm font-semibold text-white hover:bg-maroon-800"
      >
        <Home size={16} /> Back to Home
      </Link>
    </div>
  );
}
