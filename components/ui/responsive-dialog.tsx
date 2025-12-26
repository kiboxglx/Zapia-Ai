'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Drawer as VaulDrawer } from 'vaul';
import { useMediaQuery } from '@/hooks/use-media-query';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Shared Types ---
interface ResponsiveDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
    title?: string;
    description?: string;
    trigger?: React.ReactNode;
}

export function ResponsiveDialog({
    children,
    open,
    onOpenChange,
    title,
    description,
    trigger
}: ResponsiveDialogProps) {
    const isDesktop = useMediaQuery('(min-width: 768px)');

    if (isDesktop) {
        return (
            <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
                {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
                <DialogPrimitive.Portal>
                    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                    <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
                        {(title || description) && (
                            <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                                {title && <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">{title}</DialogPrimitive.Title>}
                                {description && <DialogPrimitive.Description className="text-sm text-muted-foreground">{description}</DialogPrimitive.Description>}
                            </div>
                        )}
                        {children}
                        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </DialogPrimitive.Close>
                    </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
            </DialogPrimitive.Root>
        );
    }

    return (
        <VaulDrawer.Root open={open} onOpenChange={onOpenChange}>
            {trigger && <VaulDrawer.Trigger asChild>{trigger}</VaulDrawer.Trigger>}
            <VaulDrawer.Portal>
                <VaulDrawer.Overlay className="fixed inset-0 z-50 bg-black/80" />
                <VaulDrawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background outline-none">
                    <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
                    <div className="px-4 pb-10 pt-4">
                        {(title || description) && (
                            <div className="mb-4 flex flex-col space-y-1.5 text-center sm:text-left">
                                {title && <VaulDrawer.Title className="text-lg font-semibold leading-none tracking-tight">{title}</VaulDrawer.Title>}
                                {description && <VaulDrawer.Description className="text-sm text-muted-foreground">{description}</VaulDrawer.Description>}
                            </div>
                        )}
                        {children}
                    </div>
                </VaulDrawer.Content>
            </VaulDrawer.Portal>
        </VaulDrawer.Root>
    );
}

// Helper components for structure (optional usage)
export function ResponsiveDialogContent({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

export function ResponsiveDialogHeader({ children }: { children: React.ReactNode }) {
    return <div className="flex flex-col space-y-1.5 text-center sm:text-left">{children}</div>;
}

export function ResponsiveDialogFooter({ children }: { children: React.ReactNode }) {
    return <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">{children}</div>;
}
