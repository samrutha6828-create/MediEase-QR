import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  errorMessage,
  id,
  className = "",
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const errorId = errorMessage ? `${inputId}-error` : undefined;

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label htmlFor={inputId} className="text-lg font-bold text-slate-900">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={!!errorMessage}
        aria-describedby={errorMessage ? errorId : helperText ? helperId : undefined}
        className={`h-14 px-4 text-lg bg-white border-2 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-200 transition-all ${
          errorMessage
            ? "border-rose-500 focus:border-rose-600"
            : "border-slate-300 focus:border-sky-600"
        } ${className}`}
        {...props}
      />
      {helperText && !errorMessage && (
        <p id={helperId} className="text-base text-slate-600 font-medium">
          {helperText}
        </p>
      )}
      {errorMessage && (
        <p id={errorId} className="text-base font-bold text-rose-600 flex items-center gap-1.5">
          <span>⚠️</span> {errorMessage}
        </p>
      )}
    </div>
  );
};
