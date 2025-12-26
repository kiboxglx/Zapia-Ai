import { z } from "zod";
import { getAuthContext } from "@/lib/db/context";
import { withTenantDB } from "@/db/middleware"; // Reusing our existing robust middleware

type ActionError = {
    error: string;
};

// Generic Safe Action Definition
export async function createSafeAction<TInput, TOutput>(
    schema: z.Schema<TInput>,
    handler: (
        data: TInput,
        ctx: { userId: string; tenantId: string; role: string | undefined | null }
    ) => Promise<TOutput>
): Promise<TOutput | ActionError> {
    try {
        // 1. Authentication & Context (Security Layer)
        const ctx = await getAuthContext();

        // 2. Input Validation
        const validationResult = schema.safeParse({});
        // Wait, we need to pass the data to safeParse, but the wrapper function needs to return a function that accepts data.
        // The implementation above is slightly off for a HOF signature.
        // Correcting pattern below.
        throw new Error("Implementation Error: Use returned function");
    } catch (e: any) {
        console.error("[SAFE_ACTION_ERROR]", e);
        return { error: e.message || "Internal Server Error" };
    }
}

// Correct HOF Pattern
export const authenticatedAction = <TInput, TOutput>(
    schema: z.Schema<TInput>,
    handler: (data: TInput, ctx: { userId: string, tenantId: string, role: string | undefined | null }) => Promise<TOutput>
) => {
    return async (data: TInput): Promise<TOutput | { error: string }> => {
        try {
            // 1. Audit: Log attempt
            // console.log(`[ACTION_ATTEMPT] User: ${...} Data: ${JSON.stringify(data)}`);

            // 2. Auth Check
            const ctx = await getAuthContext();

            // 3. Validation
            const parseResult = schema.safeParse(data);
            if (!parseResult.success) {
                console.error("[VALIDATION_ERROR]", parseResult.error);
                return { error: "Invalid Input Data" };
            }

            // 4. Execution
            // We do NOT automatically call `withTenantDB` here because some actions might need logic before DB.
            // But usually we want to pass the DB capabilities. 
            // For now, we pass the Context, and the Handler calls `withTenantDB(ctx.tenantId, ...)` 
            // OR we can make a `dbAction` variant.

            return await handler(parseResult.data, ctx);

        } catch (error: any) {
            console.error("[ACTION_EXECUTION_ERROR]", error);
            // Don't leak stack traces in prod
            return { error: error.message === "Unauthorized" ? "Unauthorized" : "Operation Failed" };
        }
    };
};
