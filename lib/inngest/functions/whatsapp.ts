import { inngest } from '@/lib/inngest/client'
import { withTenantDB } from '@/db/middleware'
import { eq, desc, sql, cosineDistance, gt } from 'drizzle-orm'
import { generateText, embed } from 'ai'
import { openai } from '@ai-sdk/openai'
import { sendWhatsApp } from '@/lib/whatsapp/client'

// Triggered by webhook
export const receiveWhatsAppMessage = inngest.createFunction(
    {
        id: "whatsapp-message-received",
        idempotency: "event.data.payload.wam_id"
    },
    { event: "whatsapp/message.received" },
    async ({ event, step }) => {
        const { tenantId, payload } = event.data;

        if (!tenantId || !payload) return { error: "Missing data" };

        const messageData = payload.messages?.[0];
        const contactData = payload.contacts?.[0];

        if (!messageData) return { skipped: true };

        const senderPhone = messageData.from;
        const senderName = contactData?.profile?.name || senderPhone;
        const messageContent = messageData.text?.body || `[${messageData.type}]`;
        const waMessageId = messageData.id;

        // Step 1: Persist Inbound Message
        const { contactId } = await step.run("persist-message", async () => {
            return await withTenantDB(tenantId, async (tx, schema) => {
                let cid: string;

                const existing = await tx.select().from(schema.contacts)
                    .where(eq(schema.contacts.phone, senderPhone))
                    .limit(1);

                if (existing.length > 0) {
                    cid = existing[0].id;
                } else {
                    const newContact = await tx.insert(schema.contacts).values({
                        tenantId,
                        phone: senderPhone,
                        name: senderName
                    }).returning();
                    cid = newContact[0].id;
                }

                await tx.insert(schema.messages).values({
                    tenantId,
                    contactId: cid,
                    direction: 'inbound',
                    content: messageContent,
                    type: messageData.type,
                    status: 'received',
                    metadata: { wam_id: waMessageId }
                });

                return { contactId: cid };
            });
        });

        // Step 2: Generate AI Response (RAG Enhanced)
        await step.run("generate-ai-response", async () => {
            // 1. Generate Input Embedding for RAG
            // Only if text message
            let contextText = "";
            if (messageData.type === 'text') {
                try {
                    const { embedding } = await embed({
                        model: openai.embedding('text-embedding-3-small'),
                        value: messageContent
                    });

                    // 2. Vector Search
                    await withTenantDB(tenantId, async (tx, schema) => {
                        // Cosine similarity search
                        // We select chunks with similarity logic
                        // order by embedding <=> input_vector
                        const similarity = sql<number>`1 - (${cosineDistance(schema.knowledgeBase.embedding, embedding)})`;

                        const chunks = await tx.select({
                            content: schema.knowledgeBase.content,
                            similarity: similarity
                        })
                            .from(schema.knowledgeBase)
                            .where(gt(similarity, 0.5)) // Filter relevance > 0.5
                            .orderBy(desc(similarity))
                            .limit(3);

                        if (chunks.length > 0) {
                            const chunkText = chunks.map(c => `- ${c.content}`).join('\\n');
                            contextText = `\\n\\nRELEVANT KNOWLEDGE BASE:\\n${chunkText}`;
                        }
                    });
                } catch (e) {
                    console.error("RAG Error:", e);
                    // Proceed without context if RAG fails
                }
            }

            // 3. Get History & Config
            const { history, systemPrompt, modelName } = await withTenantDB(tenantId, async (tx, schema) => {
                const recentMessages = await tx.select().from(schema.messages)
                    .where(eq(schema.messages.contactId, contactId))
                    .orderBy(desc(schema.messages.createdAt))
                    .limit(20);

                const configs = await tx.select().from(schema.aiConfigs).limit(1);
                const config = configs[0];

                return {
                    history: recentMessages.reverse(),
                    systemPrompt: (config?.systemPrompt || "You are a helpful assistant.") + contextText, // Inject Context
                    modelName: config?.model || "gpt-4o"
                };
            });

            // 4. Call LLM
            const messagesForAI = history.map(msg => ({
                role: msg.direction === 'inbound' ? 'user' : 'assistant',
                content: msg.content || "",
            })) as any;

            const { text } = await generateText({
                model: openai(modelName),
                system: systemPrompt,
                messages: messagesForAI,
            });

            if (!text) return { error: "No response generated" };

            // 5. Send via WhatsApp
            await sendWhatsApp(senderPhone, text);

            // 6. Persist Outbound
            await withTenantDB(tenantId, async (tx, schema) => {
                await tx.insert(schema.messages).values({
                    tenantId,
                    contactId: contactId,
                    direction: 'outbound',
                    content: text,
                    status: 'delivered',
                });
            });

            return { replied: true, rag: !!contextText };
        });
    }
);
