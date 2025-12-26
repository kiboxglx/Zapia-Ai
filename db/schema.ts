import { pgSchema, varchar, text, timestamp, boolean, uuid, jsonb, vector } from "drizzle-orm/pg-core";
// --- Schema Creator ---
export const createSchema = (schema_name: string) => {
    const schema = pgSchema(schema_name);

    const users = schema.table("users", {
        id: uuid("id").primaryKey().defaultRandom(),
        tenantId: varchar("tenant_id", { length: 255 }).notNull(), // Essential for RLS consistency check
        email: varchar("email", { length: 255 }).notNull().unique(),
        name: varchar("name", { length: 255 }),
        createdAt: timestamp("created_at").defaultNow(),
    });

    const projects = schema.table("projects", {
        id: uuid("id").primaryKey().defaultRandom(),
        tenantId: varchar("tenant_id", { length: 255 }).notNull(),
        name: varchar("name", { length: 255 }).notNull(),
        description: text("description"),
        ownerId: uuid("owner_id").references(() => users.id),
        createdAt: timestamp("created_at").defaultNow(),
    });

    const tasks = schema.table("tasks", {
        id: uuid("id").primaryKey().defaultRandom(),
        tenantId: varchar("tenant_id", { length: 255 }).notNull(),
        title: varchar("title", { length: 255 }).notNull(),
        status: varchar("status", { length: 50 }).default("todo"),
        projectId: uuid("project_id").references(() => projects.id),
        createdAt: timestamp("created_at").defaultNow(),
    });

    const contacts = schema.table("contacts", {
        id: uuid("id").primaryKey().defaultRandom(),
        tenantId: varchar("tenant_id", { length: 255 }).notNull(),
        phone: varchar("phone", { length: 50 }).notNull(), // Unique handling might be needed per tenant logic
        name: varchar("name", { length: 255 }),
        createdAt: timestamp("created_at").defaultNow(),
        updatedAt: timestamp("updated_at").defaultNow(),
    });

    const messages = schema.table("messages", {
        id: uuid("id").primaryKey().defaultRandom(),
        tenantId: varchar("tenant_id", { length: 255 }).notNull(),
        contactId: uuid("contact_id").references(() => contacts.id).notNull(),
        content: text("content"),
        type: varchar("type", { length: 50 }).default("text"), // text, image, etc.
        status: varchar("status", { length: 50 }).default("received"), // received, delivered, read
        direction: varchar("direction", { length: 20 }).notNull(), // inbound, outbound
        metadata: jsonb("metadata"), // flexible storage for whatsapp specific IDs (wam_id)
        createdAt: timestamp("created_at").defaultNow(),
    });

    /* AI + WhatsApp Configs */
    const aiConfigs = schema.table("ai_configs", {
        id: uuid("id").primaryKey().defaultRandom(),
        tenantId: varchar("tenant_id", { length: 255 }).notNull(),
        model: varchar("model", { length: 50 }).default("gpt-4o"),
        systemPrompt: text("system_prompt").default("You are a helpful assistant for Zapia AI."),
        openaiApiKey: varchar("openai_api_key", { length: 255 }),
        isActive: boolean("is_active").default(true),
        updatedAt: timestamp("updated_at").defaultNow(),
    });

    const whatsappConfigs = schema.table("whatsapp_configs", {
        id: uuid("id").primaryKey().defaultRandom(),
        tenantId: varchar("tenant_id", { length: 255 }).notNull(),
        phoneNumberId: varchar("phone_number_id", { length: 255 }).notNull(),
        accessToken: text("access_token").notNull(),
        verifyToken: varchar("verify_token", { length: 255 }).default("zapia_verify"),
        updatedAt: timestamp("updated_at").defaultNow(),
    });

    const embeddings = schema.table("embeddings", {
        id: uuid("id").primaryKey().defaultRandom(),
        tenantId: varchar("tenant_id", { length: 255 }).notNull(),
        content: text("content"),
        metadata: jsonb("metadata"),
        createdAt: timestamp("created_at").defaultNow(),
    });

    /* AI Configs above */
    // Vector extension must be enabled in DB: CREATE EXTENSION IF NOT EXISTS vector;
    const knowledgeBase = schema.table("knowledge_base", {
        id: uuid("id").primaryKey().defaultRandom(),
        tenantId: varchar("tenant_id", { length: 255 }).notNull(),
        content: text("content").notNull(),
        embedding: vector("embedding", { dimensions: 1536 }), // OpenAI text-embedding-3-small
        metadata: jsonb("metadata"),
        createdAt: timestamp("created_at").defaultNow(),
    });

    const pipelines = schema.table("pipelines", {
        id: uuid("id").primaryKey().defaultRandom(),
        tenantId: varchar("tenant_id", { length: 255 }).notNull(),
        name: varchar("name", { length: 255 }).notNull(),
        createdAt: timestamp("created_at").defaultNow(),
    });

    const stages = schema.table("stages", {
        id: uuid("id").primaryKey().defaultRandom(),
        tenantId: varchar("tenant_id", { length: 255 }).notNull(),
        pipelineId: uuid("pipeline_id").references(() => pipelines.id).notNull(),
        name: varchar("name", { length: 255 }).notNull(),
        order: varchar("order", { length: 50 }).notNull(),
        color: varchar("color", { length: 20 }).default("#e4e4e7"),
        createdAt: timestamp("created_at").defaultNow(),
    });

    const deals = schema.table("deals", {
        id: uuid("id").primaryKey().defaultRandom(),
        tenantId: varchar("tenant_id", { length: 255 }).notNull(),
        stageId: uuid("stage_id").references(() => stages.id).notNull(),
        title: varchar("title", { length: 255 }).notNull(),
        value: varchar("value", { length: 50 }).default("0"),
        priority: varchar("priority", { length: 50 }).default("medium"),
        contactId: uuid("contact_id").references(() => contacts.id),
        createdAt: timestamp("created_at").defaultNow(),
        updatedAt: timestamp("updated_at").defaultNow(),
    });

    /* Previous tables... */
    const subscriptions = schema.table("subscriptions", {
        id: uuid("id").primaryKey().defaultRandom(),
        tenantId: varchar("tenant_id", { length: 255 }).notNull(),
        stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
        status: varchar("status", { length: 50 }).default("inactive"), // active, trialing, past_due, canceled
        planTier: varchar("plan_tier", { length: 50 }).default("free"),
        currentPeriodEnd: timestamp("current_period_end"),
        createdAt: timestamp("created_at").defaultNow(),
        updatedAt: timestamp("updated_at").defaultNow(),
    });

    return { users, projects, tasks, contacts, messages, aiConfigs, whatsappConfigs, embeddings, knowledgeBase, pipelines, stages, deals, subscriptions };
};

// --- Utility: Get Configured Schema Object ---
export function getTenantSchema(tenantId: string) {
    if (!tenantId || !/^[a-z0-9_]+$/.test(tenantId)) {
        throw new Error("Invalid tenant ID format");
    }
    // Note: In a real migration system, you apply migrations to this schema name.
    return createSchema(tenantId);
}
