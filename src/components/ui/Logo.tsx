import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
  showText?: boolean;
}

export function Logo({ size = "md", variant = "light", showText = true }: LogoProps) {
  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const isLight = variant === "light";

  return (
    <div className="inline-flex items-center gap-3 select-none">
      {/* Natural Herbal Leaf + Medical Cross Symbol */}
      <div
        className={`${iconSizes[size]} rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-md p-2`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-white"
        >
          {/* Stylized Natural Leaf Contour */}
          <path
            d="M6 16C6 8 12 4 20 4C24 4 27 7 27 11C27 19 21 27 12 27C8 27 6 24 6 16Z"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Subtle Central Medical Harmony Line */}
          <path
            d="M13 19L23 9"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M18 19V13H12"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <span
            className={`${textSizes[size]} font-black tracking-tight ${
              isLight ? "text-slate-900" : "text-white"
            }`}
          >
            MediEase
          </span>
          <span
            className={`text-[10px] font-bold tracking-wider uppercase ${
              isLight ? "text-emerald-700" : "text-emerald-400"
            }`}
          >
            Healthcare Services
          </span>
        </div>
      )}
    </div>
  );
}
