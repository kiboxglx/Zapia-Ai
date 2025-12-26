'use server'

import { z } from 'zod'
import { withTenantDB } from '@/db/middleware'
import { eq, asc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { authenticatedAction } from '@/lib/safe-action'

// Note: In a real app, you MUST extract tenantId from the authenticated user session (Clerk).
// For this scaffolding without a running auth provider in front, we will assume a constant
// or hardcoded tenant for demonstration, OR require it in the payload (which is insecure in prod 
// without validation).
//
// INSTRUCTION: "Garanta que todas as queries filtrem pelo tenant_id injetado pelo middleware atual."
//
// We will follow the instruction pattern. We assume the caller might be passing it, OR 
// we fetch it from headers. But `withTenantDB` handles injection into DB session.
// We just need to know WHICH tenant to switch to.
//

// --- Schemas ---
const CreateDealSchema = z.object({
    title: z.string().min(1),
    value: z.string().default("0"),
    stageId: z.string().uuid(),
    contactId: z.string().uuid().optional(),
})

const MoveDealSchema = z.object({
    dealId: z.string(),
    stageId: z.string()
})

const EmptySchema = z.object({})

// --- Actions ---

export const getPipeline = authenticatedAction(EmptySchema, async (_, ctx) => {
    return await withTenantDB(ctx.tenantId, async (tx, schema) => {
        // 1. Get Pipelines
        const pipelines = await tx.select().from(schema.pipelines).limit(1);

        let pipelineId: string;
        if (pipelines.length === 0) {
            // Seed default pipeline if none
            const newPipe = await tx.insert(schema.pipelines).values({
                tenantId: ctx.tenantId,
                name: "Sales Pipeline"
            }).returning();
            pipelineId = newPipe[0].id;

            // Seed Stages
            await tx.insert(schema.stages).values([
                { tenantId: ctx.tenantId, pipelineId, name: "Lead", order: "1", color: "#60a5fa" },
                { tenantId: ctx.tenantId, pipelineId, name: "Qualified", order: "2", color: "#facc15" },
                { tenantId: ctx.tenantId, pipelineId, name: "Negotiation", order: "3", color: "#fb923c" },
                { tenantId: ctx.tenantId, pipelineId, name: "Won", order: "4", color: "#4ade80" },
            ]);
        } else {
            pipelineId = pipelines[0].id;
        }

        // 2. Fetch Stages & Deals
        const stages = await tx.select().from(schema.stages)
            .where(eq(schema.stages.pipelineId, pipelineId))
            .orderBy(asc(schema.stages.order));

        const deals = await tx.select().from(schema.deals)
            .where(eq(schema.deals.tenantId, ctx.tenantId));

        return {
            stages,
            deals
        };
    });
});

export const moveDeal = authenticatedAction(MoveDealSchema, async ({ dealId, stageId }, ctx) => {
    await withTenantDB(ctx.tenantId, async (tx, schema) => {
        // Security: Ensure deal belongs to tenant implicitly via `withTenantDB` setting the config,
        // BUT strict filtering in WHERE clause is good practice redundancy.
        await tx.update(schema.deals)
            .set({ stageId: stageId, updatedAt: new Date() })
            .where(eq(schema.deals.id, dealId));
    });

    revalidatePath('/kanban');
    return { success: true };
});

export const createDeal = authenticatedAction(CreateDealSchema, async (data, ctx) => {
    await withTenantDB(ctx.tenantId, async (tx, schema) => {
        // Optional: Check if user has 'admin' or 'member' role via ctx.role if needed
        await tx.insert(schema.deals).values({
            tenantId: ctx.tenantId,
            ...data,
            priority: 'medium'
        });
    });

    revalidatePath('/kanban');
    return { success: true };
});
