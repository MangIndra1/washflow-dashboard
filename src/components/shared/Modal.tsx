import type { ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { DialogDescription, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
} as const;

/**
 * Modal berbasis Radix Dialog (via shadcn): focus trap, tombol Esc, klik overlay,
 * dan scroll-lock ditangani otomatis. API props sama seperti versi sebelumnya.
 */
export function Modal({ isOpen, onClose, title, subtitle, children, size = 'md', footer }: ModalProps) {
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogPortal>
        <DialogOverlay className="bg-black/50 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-white shadow-2xl outline-none',
            sizeClasses[size],
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 p-6">
            <div>
              <DialogTitle className="text-slate-900" style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                {title}
              </DialogTitle>
              {subtitle ? (
                <DialogDescription className="mt-0.5 text-sm text-slate-500">{subtitle}</DialogDescription>
              ) : (
                <DialogDescription className="sr-only">{title}</DialogDescription>
              )}
            </div>
            <DialogPrimitive.Close
              aria-label="Close"
              className="ml-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>

          {/* Footer */}
          {footer && <div className="border-t border-slate-100 p-6">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
}
