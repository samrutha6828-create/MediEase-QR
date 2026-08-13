import React from "react";

export interface BadgeProps {
  variant?: "info" | "success" | "warning" | "error" | "neutral";
  size?: "md" | "lg";
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "info",
  size = "lg",
  children,
  className = "",
}) => {
  const variantStyles = {
    info: "bg-sky-100 text-sky-900 border-sky-300",
    success: "bg-emerald-100 text-emerald-900 border-emerald-300",
    warning: "bg-amber-100 text-amber-900 border-amber-300",
    error: "bg-rose-100 text-rose-900 border-rose-300",
    neutral: "bg-slate-100 text-slate-800 border-slate-300",
  };

  const sizeStyles = {
    md: "px-3 py-1 text-sm font-semibold",
    lg: "px-4 py-1.5 text-base font-bold",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};
