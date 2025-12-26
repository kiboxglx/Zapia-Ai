import { db } from "@/lib/db";
import { getTenantSchema } from "./schema";
import { sql } from "drizzle-orm";

/**
 * Higher-Order Function to execute database operations within a specific tenant context.
 * This guarantees:
 * 1. The `app.tenant_id` session variable is set.
 * 2. The operations connect to the correct dynamic schema.
 * 3. RLS policies (if present) are enforced by the session variable.
 */
export async function withTenantDB<T>(
    tenantId: string,
    callback: (tx: any, schema: ReturnType<typeof getTenantSchema>) => Promise<T>
): Promise<T> {
    // Validate basic tenant ID safety to prevent injection
    if (!tenantId.match(/^[a-z0-9_-]+$/)) {
        throw new Error("Invalid Tenant ID");
    }

    return db.transaction(async (tx) => {
        // 1. Set the Session Constraint
        // This is the CRITICIAL step for RLS and preventing leaks.
        // 'LOCAL' means it only applies to this transaction block.
        await tx.execute(sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`);

        // 2. Resolve the Schema Context
        const schema = getTenantSchema(tenantId);

        // 3. Execute the user callback
        // We pass 'tx' (the transaction client) and 'schema' (the table definitions)
        // The user MUST use these to execute queries.
        return await callback(tx, schema);
    });
}
