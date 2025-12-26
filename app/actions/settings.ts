'use server'

import { z } from 'zod'
import { withTenantDB } from '@/db/middleware'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { authenticatedAction } from '@/lib/safe-action'

// --- VALIDATION SCHEMAS ---
export const AISettingsSchema = z.object({
    model: z.enum(["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"]),
    systemPrompt: z.string().min(10, "Prompt must be at least 10 chars"),
    openaiApiKey: z.string().optional(),
    isActive: z.boolean().default(true),
})

export const WhatsAppSettingsSchema = z.object({
    phoneNumberId: z.string().min(1, "Phone Number ID Required"),
    accessToken: z.string().min(1, "Access Token Required"),
    verifyToken: z.string().default("zapia_verify"),
})

const EmptySchema = z.object({})

// --- ACTIONS ---

export const getSettings = authenticatedAction(EmptySchema, async (_, ctx) => {
    return await withTenantDB(ctx.tenantId, async (tx, schema) => {
        const ai = await tx.select().from(schema.aiConfigs).limit(1);
        const wa = await tx.select().from(schema.whatsappConfigs).limit(1);

        return {
            ai: ai[0] || { model: "gpt-4o", systemPrompt: "", isActive: true },
            whatsapp: wa[0] || { phoneNumberId: "", accessToken: "", verifyToken: "zapia_verify" }
        }
    });
});

export const saveAISettings = authenticatedAction(AISettingsSchema, async (data, ctx) => {
    await withTenantDB(ctx.tenantId, async (tx, schema) => {
        const existing = await tx.select().from(schema.aiConfigs).limit(1);

        if (existing.length > 0) {
            await tx.update(schema.aiConfigs)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(schema.aiConfigs.id, existing[0].id));
        } else {
            // Note: tenantId is schema-bound, but explicitly setting it in column is good
            await tx.insert(schema.aiConfigs).values({
                tenantId: ctx.tenantId,
                ...data
            });
        }
    });

    revalidatePath('/dashboard/settings');
    return { success: true };
});

export const saveWhatsAppSettings = authenticatedAction(WhatsAppSettingsSchema, async (data, ctx) => {
    // Audit log could go here via decorator or manually
    await withTenantDB(ctx.tenantId, async (tx, schema) => {
        const existing = await tx.select().from(schema.whatsappConfigs).limit(1);

        if (existing.length > 0) {
            await tx.update(schema.whatsappConfigs)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(schema.whatsappConfigs.id, existing[0].id));
        } else {
            await tx.insert(schema.whatsappConfigs).values({
                tenantId: ctx.tenantId,
                ...data
            });
        }
    });

    revalidatePath('/dashboard/settings');
    return { success: true };
});
