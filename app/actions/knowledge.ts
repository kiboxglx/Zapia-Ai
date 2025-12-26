'use server'

import { z } from 'zod'
import { authenticatedAction } from '@/lib/safe-action'
import { withTenantDB } from '@/db/middleware'
import { openai } from '@ai-sdk/openai'
import { embed } from 'ai'
import { sql } from 'drizzle-orm'

const KnowledgeSchema = z.object({
    text: z.string().min(10)
})

export const addKnowledge = authenticatedAction(KnowledgeSchema, async ({ text }, ctx) => {
    // 1. Generate Embedding
    // We use standard OpenAI 'text-embedding-3-small' model
    const { embedding } = await embed({
        model: openai.embedding('text-embedding-3-small'),
        value: text
    });

    // 2. Save to DB
    await withTenantDB(ctx.tenantId, async (tx, schema) => {
        await tx.insert(schema.knowledgeBase).values({
            tenantId: ctx.tenantId,
            content: text,
            embedding: embedding as any // Drizzle requires specific array format, sometimes cast needed depending on strictness
        });
    });

    return { success: true };
});
