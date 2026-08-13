import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "highlight" | "bordered";
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = "default",
  children,
  className = "",
  ...props
}) => {
  const variantStyles = {
    default: "bg-white border-2 border-slate-200 shadow-sm",
    highlight: "bg-sky-50 border-2 border-sky-300 shadow-sm",
    bordered: "bg-white border-2 border-slate-300",
  };

  return (
    <div
      className={`rounded-2xl p-6 transition-all ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
