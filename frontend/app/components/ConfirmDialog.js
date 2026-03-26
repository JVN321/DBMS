'use client';

import { AlertCircle } from 'lucide-react';

export default function ConfirmDialog({ isOpen, title, message, confirmText, cancelText, onConfirm, onCancel, isLoading, isDangerous, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="rounded-xl border border-card-border bg-card p-6 max-w-sm w-full mx-4 animate-in">
        {/* Icon */}
        <div className={`rounded-lg ${isDangerous ? 'bg-danger/10' : 'bg-warning/10'} p-3 w-fit mb-4`}>
          <AlertCircle size={24} className={isDangerous ? 'text-danger' : 'text-warning'} />
        </div>

        {/* Content */}
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-sm text-muted mb-4">{message}</p>

        {children}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-card-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5 disabled:opacity-50"
          >
            {cancelText || 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
              isDangerous
                ? 'bg-danger hover:bg-danger/90'
                : 'bg-accent hover:bg-accent-hover'
            }`}
          >
            {isLoading ? 'Processing...' : confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
