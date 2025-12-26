'use client'

import React from 'react'
import {
    DndContext,
    closestCenter,
    useSensor,
    useSensors,
    DragOverlay,
    TouchSensor,
    MouseSensor,
    DragStartEvent,
    DragEndEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPipeline, moveDeal } from '@/app/actions/crm';
import { KanbanCard } from '@/components/crm/KanbanCard';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';

export function MobileKanban() {
    const queryClient = useQueryClient();
    const [activeId, setActiveId] = React.useState<string | null>(null);

    // 1. Data Fetching
    const { data, isLoading } = useQuery({
        queryKey: ['crm-pipeline'],
        queryFn: () => getPipeline()
    });

    // 2. Mutation (Optimistic)
    const mutation = useMutation({
        mutationFn: async ({ dealId, stageId }: { dealId: string, stageId: string }) => {
            return await moveDeal(dealId, stageId);
        },
        onMutate: async (newItem) => {
            await queryClient.cancelQueries({ queryKey: ['crm-pipeline'] });
            const previous = queryClient.getQueryData(['crm-pipeline']);

            queryClient.setQueryData(['crm-pipeline'], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    deals: old.deals.map((d: any) =>
                        d.id === newItem.dealId ? { ...d, stageId: newItem.stageId } : d
                    )
                }
            });
            return { previous };
        },
        onError: (err, newItem, context) => {
            if (context?.previous) {
                queryClient.setQueryData(['crm-pipeline'], context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['crm-pipeline'] });
        }
    });

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(50);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            let newStageId = over.data.current?.sortable?.containerId;

            if (!newStageId && data?.stages.find((s: any) => s.id === over.id)) {
                newStageId = over.id;
            }

            if (newStageId) {
                mutation.mutate({ dealId: active.id as string, stageId: newStageId });
            }
        }
        setActiveId(null);
    }

    if (isLoading) return <DashboardSkeleton />

    const stages = data?.stages || [];
    const deals = data?.deals || [];

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex w-full h-full overflow-x-auto snap-x snap-mandatory p-4 gap-4 no-scrollbar">
                {stages.map((col: any) => (
                    <KanbanColumn
                        key={col.id}
                        id={col.id}
                        title={col.name}
                        items={deals.filter((d: any) => d.stageId === col.id)}
                    />
                ))}
            </div>
            <DragOverlay>
                {activeId ? <KanbanCard deal={deals.find((d: any) => d.id === activeId)} isOverlay /> : null}
            </DragOverlay>
        </DndContext>
    )
}

function KanbanColumn({ id, title, items }: { id: string, title: string, items: any[] }) {
    const itemIds = items.map(d => d.id);

    return (
        <div className="min-w-[85vw] md:min-w-[350px] bg-muted/50 rounded-xl p-4 flex flex-col gap-3 snap-center h-full max-h-[80vh] border">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{title}</h3>
                <span className="text-xs font-mono bg-background px-2 py-1 rounded shadow-sm">{items.length}</span>
            </div>
            <SortableContext id={id} items={itemIds} strategy={verticalListSortingStrategy}>
                <div className="flex-1 overflow-y-auto space-y-3 p-1 min-h-[100px] scrollbar-thin">
                    {items.map(deal => <SortableItem key={deal.id} deal={deal} />)}
                </div>
            </SortableContext>
        </div>
    )
}

function SortableItem({ deal }: { deal: any }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: deal.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <KanbanCard deal={deal} isDragging={isDragging} />
        </div>
    )
}
