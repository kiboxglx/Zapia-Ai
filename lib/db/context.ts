import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function getTenantId(): Promise<string> {
    const { orgId } = await auth();

    if (!orgId) {
        // If no org is selected, we can't determine the tenant context.
        // In a real scenario, you might redirect to an org selection screen 
        // or return null and let the caller handle it.
        // For security, we throw/redirect.

        // For API routes/Server Actions, redirection might not be ideal via exception, 
        // but Next.js handles it.
        // However, if we are in a context where we MUST have a tenant:
        throw new Error("Unauthorized: No Organization Selected");
    }

    return orgId;
}

export async function getAuthContext() {
    const { userId, orgId, orgRole } = await auth();

    if (!userId || !orgId) {
        throw new Error("Unauthorized");
    }

    return {
        userId,
        tenantId: orgId,
        role: orgRole // 'org:admin' | 'org:member'
    };
}
