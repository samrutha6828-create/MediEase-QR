import React from "react";

export interface OptionCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  title,
  subtitle,
  icon,
  selected = false,
  onClick,
  className = "",
}) => {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className={`w-full text-left p-6 rounded-2xl border-3 transition-all min-h-[72px] flex items-center justify-between cursor-pointer focus:outline-none focus:ring-4 focus:ring-sky-300 active:scale-[0.99] ${
        selected
          ? "bg-sky-50 border-sky-600 shadow-md text-slate-900"
          : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
      } ${className}`}
    >
      <div className="flex items-center gap-4">
        {icon && <div className="text-3xl text-sky-600 shrink-0">{icon}</div>}
        <div>
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="text-base text-slate-600 mt-1">{subtitle}</p>}
        </div>
      </div>
      <div className="shrink-0 ml-4">
        <div
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
            selected
              ? "border-sky-600 bg-sky-600 text-white"
              : "border-slate-300 bg-white"
          }`}
        >
          {selected && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
};
