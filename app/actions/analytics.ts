'use server'

import { z } from 'zod'
import { withTenantDB } from '@/db/middleware'
import { sql, desc, gte, eq, asc } from 'drizzle-orm'
import { authenticatedAction } from '@/lib/safe-action'

const EmptySchema = z.object({})

export const getDashboardMetrics = authenticatedAction(EmptySchema, async (_, ctx) => {
    return await withTenantDB(ctx.tenantId, async (tx, schema) => {
        // 1. KPI Queries

        // Total Active Deals
        const dealsCount = await tx.select({ count: sql<number>`count(*)` })
            .from(schema.deals);

        // Pipeline Value (Sum of all deals)
        // Note: 'value' column is varchar in schema, need cast. Ideally it should be decimal/integer.
        // We will perform a safe cast in SQL or JS. SQL: sum(cast(value as numeric))
        const pipelineVal = await tx.select({
            total: sql<number>`sum(cast(${schema.deals.value} as numeric))`
        }).from(schema.deals);

        // Messages Today (Inbound + Outbound)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const msgsToday = await tx.select({ count: sql<number>`count(*)` })
            .from(schema.messages)
            .where(gte(schema.messages.createdAt, startOfDay));

        // 2. Funnel Data (Deals per Stage)
        // Join with stages to get names
        const funnel = await tx.select({
            stage: schema.stages.name,
            count: sql<number>`count(${schema.deals.id})`,
            order: schema.stages.order
        })
            .from(schema.stages)
            .leftJoin(schema.deals, eq(schema.stages.id, schema.deals.stageId))
            .groupBy(schema.stages.id, schema.stages.name, schema.stages.order)
            .orderBy(asc(schema.stages.order)); // We need 'asc' import from drizzle-orm but I missed it in top imports. I will fix imports.

        // 3. Activity History (Last 7 Days)
        // Complex SQL grouping by day.
        // Postgres specific: to_char(created_at, 'YYYY-MM-DD')
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const activity = await tx.select({
            date: sql<string>`to_char(${schema.messages.createdAt}, 'MM-DD')`,
            count: sql<number>`count(*)`
        })
            .from(schema.messages)
            .where(gte(schema.messages.createdAt, sevenDaysAgo))
            .groupBy(sql`to_char(${schema.messages.createdAt}, 'MM-DD')`)
            .orderBy(sql`to_char(${schema.messages.createdAt}, 'MM-DD')`);

        // 4. Recent Activity (Sidebar)
        const recentMessages = await tx.select({
            id: schema.messages.id,
            content: schema.messages.content,
            direction: schema.messages.direction,
            createdAt: schema.messages.createdAt,
            contactName: schema.contacts.name,
        })
            .from(schema.messages)
            .leftJoin(schema.contacts, eq(schema.messages.contactId, schema.contacts.id))
            .orderBy(desc(schema.messages.createdAt))
            .limit(5);

        return {
            kpis: {
                totalDeals: Number(dealsCount[0]?.count || 0),
                pipelineValue: Number(pipelineVal[0]?.total || 0),
                messagesToday: Number(msgsToday[0]?.count || 0)
            },
            funnel: funnel.map(f => ({ name: f.stage, value: Number(f.count) })),
            activity: activity.map(a => ({ date: a.date, messages: Number(a.count) })),
            recent: recentMessages
        };
    });
});
