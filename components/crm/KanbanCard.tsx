'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// Helper to format currency
const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
}

// Props interface based on the logic we have in MobileKanban
interface KanbanCardProps {
    deal: {
        id: string
        title: string
        value: string
        priority: string
        contactId?: string
        createdAt?: string
    }
    isDragging?: boolean
    isOverlay?: boolean
}

export function KanbanCard({ deal, isDragging, isOverlay }: KanbanCardProps) {
    if (!deal) return null;

    // Determine priority color
    const priorityColor = {
        high: "destructive",
        medium: "secondary", // using 'secondary' from badge variants
        low: "outline"
    }[deal.priority] || "outline";

    return (
        <div className={cn(
            "p-3 bg-card rounded-lg border shadow-sm touch-none select-none transition-all group hover:shadow-md cursor-grab active:cursor-grabbing",
            isDragging && "opacity-50 grayscale",
            isOverlay && "scale-105 shadow-xl ring-2 ring-primary rotate-2 z-50"
        )}>
            {/* Header: Title and Avatar */}
            <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-sm line-clamp-2 leading-tight">{deal.title}</span>
                <Avatar className="h-6 w-6 text-[10px]">
                    <AvatarFallback className="bg-primary/10 text-primary">DS</AvatarFallback>
                </Avatar>
            </div>

            {/* Separator / Details */}
            <div className="flex items-center justify-between mt-3">
                <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Value</span>
                    <span className="font-mono text-xs font-medium text-foreground">
                        {formatCurrency(deal.value)}
                    </span>
                </div>

                <Badge variant={priorityColor as any} className="text-[10px] px-1.5 h-5 capitalize">
                    {deal.priority}
                </Badge>
            </div>

            {/* Footer: Date or other meta */}
            <div className="mt-2 pt-2 border-t flex justify-end">
                <span className="text-[9px] text-muted-foreground">
                    {new Date().toLocaleDateString()}
                </span>
            </div>
        </div>
    )
}
