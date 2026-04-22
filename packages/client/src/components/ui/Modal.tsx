import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, description, children, className }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content
          className={cn(
            // #149/#152/#153 — Tall forms (e.g. Global Employee "Add",
            // Exit/FnF detail) overflowed the viewport because the dialog
            // had no height cap. Cap at 90vh and split into a fixed header
            // + scrollable body so the title and close button always stay
            // reachable no matter how long the body gets.
            "fixed left-1/2 top-1/2 z-50 flex w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-gray-200 bg-white shadow-xl focus:outline-none",
            "max-h-[90vh]",
            className,
          )}
        >
          <div className="flex items-center justify-between border-b border-gray-100 p-6 pb-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-gray-900">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="mt-1 text-sm text-gray-500">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <div className="overflow-y-auto p-6 pt-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
