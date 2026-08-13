import React from "react";
import { PageHeader } from "./PageHeader";

export interface PageContainerProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showHelp?: boolean;
  stepIndicator?: string;
  children: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  subtitle,
  showBack = true,
  showHelp = true,
  stepIndicator,
  children,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <PageHeader showBack={showBack} showHelp={showHelp} />

      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-6 sm:py-8 flex flex-col">
        {stepIndicator && (
          <div className="mb-2">
            <span className="text-sm font-extrabold uppercase tracking-wider text-sky-700 bg-sky-100 px-3 py-1 rounded-full border border-sky-200">
              {stepIndicator}
            </span>
          </div>
        )}

        {title && (
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-lg sm:text-xl text-slate-600 mt-2 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div className="flex-1 flex flex-col">{children}</div>
      </main>
    </div>
  );
};
