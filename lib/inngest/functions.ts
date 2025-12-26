import { Inngest } from "inngest";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const inngest = new Inngest({ id: "zapia-ai" });

// --- Type Definitions for Events ---
type AppUserSynced = {
    name: "app/user.synced";
    data: {
        eventType: string;
        payload: any;
    };
};

type OrganizationCreated = {
    name: "organization.created";
    data: {
        eventType: string;
        payload: any;
    };
};

// --- Function 1: Sync User to Search (Idempotent by User ID) ---
export const syncUserSearch = inngest.createFunction(
    {
        id: "sync-user-search",
        // Idempotency: Deduplicate if same user event comes within 24h (default) or during execution
        idempotency: "event.data.payload.id"
    },
    { event: "app/user.synced" },
    async ({ event, step }) => {
        const { payload } = event.data;
        const userId = payload.id;

        await step.run("index-user-algolia", async () => {
            // Mocking Algolia indexing
            console.log(`Indexing user ${userId} to Search Engine...`);
            // await algolia.saveObject({ objectID: userId, ...payload });
            return { indexed: true, objectID: userId };
        });
    }
);

// --- Function 2: Provision Resources (Idempotent by Org ID) ---
// Triggered by 'organization.created' as requested
export const provisionResources = inngest.createFunction(
    {
        id: "provision-resources",
        idempotency: "event.data.payload.id"
    },
    { event: "organization.created" },
    async ({ event, step }) => {
        const { payload } = event.data;
        const orgId = payload.id;

        // Step 1: Create S3 Bucket
        await step.run("create-s3-bucket", async () => {
            console.log(`Creating S3 bucket for Org: ${orgId}`);
            // await s3.createBucket({ Bucket: `zapia-org-${orgId}` });
            return { bucketName: `zapia-org-${orgId}` };
        });

        // Step 2: Initialize External CRM/Resources
        await step.run("init-external-resources", async () => {
            console.log(`Provisioning external CRM for Org: ${orgId}`);
            // await crm.createWorkspace({ ... });
            return { crmId: `crm_${orgId}` };
        });
    }
);
