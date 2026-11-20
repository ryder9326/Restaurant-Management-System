import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  maxWidthClass?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({
  open,
  title,
  subtitle,
  onClose,
  maxWidthClass = 'max-w-xl',
  children,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-dialog-title"
    >
      <div
        className="fixed inset-0 bg-[#1F1D1A]/45 transition-opacity no-print"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`relative z-10 flex max-h-[90vh] w-full ${maxWidthClass} flex-col rounded-xl border border-[#E6E2DC] bg-white shadow-xl overflow-hidden`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E6E2DC] px-6 py-4 no-print">
          <div className="min-w-0">
            <h2
              id="modal-dialog-title"
              className="font-display text-lg font-bold text-[#1F1D1A]"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-xs text-[#6E675E]">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#5E5850] transition-colors hover:bg-[#F2EFEA] hover:text-[#1F1D1A] focus-visible:outline-2 focus-visible:outline-[#C2572B] cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2.5 border-t border-[#E6E2DC] bg-[#FAF9F7] px-6 py-3.5 no-print">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
