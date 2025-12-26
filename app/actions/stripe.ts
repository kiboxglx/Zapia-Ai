'use server'

import { z } from 'zod'
import { authenticatedAction } from '@/lib/safe-action'
import { withTenantDB } from '@/db/middleware'
import Stripe from 'stripe'
import { currentUser } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia' // Use latest or what is installed
});

const CheckoutSchema = z.object({
    planId: z.string() // in this simplified version, planId is the priceId
})

export const createCheckoutSession = authenticatedAction(CheckoutSchema, async ({ planId }, ctx) => {
    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress;

    if (!email) throw new Error("User email not found");

    // 1. Get or Create Customer
    let customerId: string | undefined;

    await withTenantDB(ctx.tenantId, async (tx, schema) => {
        const sub = await tx.select().from(schema.subscriptions).limit(1);
        if (sub.length > 0 && sub[0].stripeCustomerId) {
            customerId = sub[0].stripeCustomerId;
        }
    });

    if (!customerId) {
        // Create new customer in Stripe
        const customer = await stripe.customers.create({
            email,
            metadata: {
                tenantId: ctx.tenantId,
                userId: ctx.userId
            }
        });
        customerId = customer.id;

        // Save to DB
        await withTenantDB(ctx.tenantId, async (tx, schema) => {
            // Check existence again to be safe or upsert
            const existing = await tx.select().from(schema.subscriptions).limit(1);
            if (existing.length === 0) {
                await tx.insert(schema.subscriptions).values({
                    tenantId: ctx.tenantId,
                    stripeCustomerId: customerId,
                    status: 'inactive'
                });
            } else {
                await tx.update(schema.subscriptions)
                    .set({ stripeCustomerId: customerId })
                    .where(eq(schema.subscriptions.id, existing[0].id));
            }
        });
    }

    // 2. Create Session
    const origin = (await headers()).get('origin') || 'http://localhost:3000';

    // Hardcoded priceId mapping if planId is a tier name, or assume planId IS priceId
    // For demo: verify planId or just pass it if valid.

    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
            {
                price: planId,
                quantity: 1
            }
        ],
        mode: 'subscription',
        success_url: `${origin}/dashboard/settings?success=true`,
        cancel_url: `${origin}/dashboard/settings?canceled=true`,
        metadata: {
            tenantId: ctx.tenantId
        }
    });

    if (!session.url) throw new Error("Failed to create session");

    return { url: session.url };
});
