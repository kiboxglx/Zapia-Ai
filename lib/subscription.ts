import { withTenantDB } from '@/db/middleware'

export async function checkSubscription(tenantId: string): Promise<boolean> {
    if (!tenantId) return false;

    // For specific "Zapia Internal" or free tier logic, we might bypass.
    // implementation:
    return await withTenantDB(tenantId, async (tx, schema) => {
        const sub = await tx.select().from(schema.subscriptions).limit(1);

        if (sub.length === 0) {
            // No record -> Implicitly Inactive or Free Trial?
            // If we want to enforce payments, return false.
            // If we have a free tier by default, return true.
            // Requirement says "block ... if status not active".
            // So return false.
            return false;
        }

        const status = sub[0].status;
        return status === 'active' || status === 'trialing';
    });
}
