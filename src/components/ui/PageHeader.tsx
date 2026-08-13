"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "./Logo";

export interface PageHeaderProps {
  title?: string;
  showBack?: boolean;
  showHelp?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  showBack = false,
  showHelp = true,
}) => {
  const router = useRouter();

  return (
    <header className="bg-white border-b-2 border-slate-200 sticky top-0 z-10 py-3 px-4 sm:px-6 shadow-xs">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="min-touch-target px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-800 flex items-center gap-1 cursor-pointer focus:outline-none focus:ring-4 focus:ring-emerald-300"
              aria-label="Go back to previous screen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-base font-bold">Back</span>
            </button>
          )}
          <Link
            href="/patient"
            className="focus:outline-none focus:ring-4 focus:ring-emerald-200 rounded-lg p-1"
          >
            <Logo size="sm" variant="light" showText={true} />
          </Link>
        </div>

        {showHelp && (
          <Link
            href="/assistance"
            className="min-touch-target px-4 py-2 bg-amber-100 hover:bg-amber-200 border-2 border-amber-300 text-amber-950 rounded-xl font-bold text-base flex items-center gap-1.5 focus:outline-none focus:ring-4 focus:ring-amber-200"
            aria-label="Request assistance"
          >
            <svg className="w-5 h-5 text-amber-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Get Help</span>
          </Link>
        )}
      </div>
    </header>
  );
};
