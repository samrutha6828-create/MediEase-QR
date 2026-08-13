import React from "react";
import { Button } from "./Button";
import { Card } from "./Card";

export interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading, please wait...",
}) => {
  return (
    <Card className="flex flex-col items-center justify-center p-12 text-center my-auto">
      <svg className="animate-spin h-12 w-12 text-emerald-600 mb-4" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      <p className="text-xl font-bold text-slate-800">{message}</p>
    </Card>
  );
};

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message = "Could not load information. Please try again.",
  onRetry,
}) => {
  return (
    <Card variant="bordered" className="border-rose-300 bg-rose-50 p-8 text-center my-auto">
      <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center mx-auto mb-3">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-2xl font-extrabold text-rose-900 mb-2">{title}</h2>
      <p className="text-lg text-rose-700 mb-6 font-medium">{message}</p>
      {onRetry && (
        <Button variant="danger" size="lg" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </Card>
  );
};

export interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  actionLabel,
  onAction,
}) => {
  return (
    <Card className="text-center p-8 my-auto">
      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center mx-auto mb-3">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
      <p className="text-lg text-slate-600 mb-6">{message}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="lg" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Card>
  );
};
