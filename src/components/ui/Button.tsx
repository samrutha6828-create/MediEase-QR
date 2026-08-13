import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "md" | "lg" | "xl";
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "lg",
  isLoading = false,
  fullWidth = true,
  children,
  className = "",
  disabled,
  type = "button",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-bold rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]";

  const variantStyles = {
    primary: "bg-sky-600 hover:bg-sky-700 text-white shadow-md active:bg-sky-800",
    secondary: "bg-slate-800 hover:bg-slate-900 text-white shadow-md active:bg-black",
    outline: "bg-white border-2 border-slate-300 hover:border-slate-400 text-slate-900 hover:bg-slate-50",
    danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-md active:bg-rose-800",
    ghost: "bg-transparent text-sky-800 hover:bg-sky-100 font-bold",
  };

  const sizeStyles = {
    md: "h-12 px-5 text-base min-h-[48px]",
    lg: "h-14 px-6 text-lg min-h-[56px]", // Primary elderly recommendation
    xl: "h-16 px-8 text-xl min-h-[64px]",
  };

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-current" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>Please wait...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
