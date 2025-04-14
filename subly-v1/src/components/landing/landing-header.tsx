'use client'; // Header likely needs client-side logic for AuthButton

import { AuthButton } from "@/components/auth-button";

export function LandingHeader() {
  return (
    <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      <div className="flex justify-between items-center">
        {/* Logo/Brand */}
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-white">Subly</span>
          <span className="text-sm text-gray-400 hidden sm:inline">Subscription Manager</span>
        </div>
        {/* Auth Button */}
        <AuthButton 
          // Simplified button style
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg text-sm"
        />
      </div>
    </header>
  );
} 