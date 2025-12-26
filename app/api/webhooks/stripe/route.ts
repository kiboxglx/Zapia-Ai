import { headers } from 'next/headers'
import Stripe from 'stripe'
import { withTenantDB } from '@/db/middleware'
import { eq } from 'drizzle-orm'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia' as any
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
    const body = await req.text();
    const sig = (await headers()).get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const tenantId = session.metadata?.tenantId;

                if (tenantId) {
                    await withTenantDB(tenantId, async (tx, schema) => {
                        // Update subscription status
                        // We assume only 1 subscription row per tenant for now
                        const existing = await tx.select().from(schema.subscriptions).limit(1);
                        if (existing.length > 0) {
                            await tx.update(schema.subscriptions).set({
                                status: 'active',
                                stripeCustomerId: session.customer as string,
                                updatedAt: new Date()
                            }).where(eq(schema.subscriptions.id, existing[0].id));
                        } else {
                            // Should have been created in checkout flow, but fallback
                            await tx.insert(schema.subscriptions).values({
                                tenantId,
                                stripeCustomerId: session.customer as string,
                                status: 'active'
                            });
                        }
                    });
                }
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                const customerId = invoice.customer as string;

                // We need tenantId. Fetch customer to get metadata if not present in invoice
                const customer = await stripe.customers.retrieve(customerId);
                if (!customer.deleted && (customer as Stripe.Customer).metadata?.tenantId) {
                    const tenantId = (customer as Stripe.Customer).metadata.tenantId;
                    await withTenantDB(tenantId, async (tx, schema) => {
                        // Update Current Period End
                        // invoice.lines.data[0].period.end (timestamp)
                        const periodEnd = new Date(invoice.lines.data[0].period.end * 1000);

                        const bg = await tx.select().from(schema.subscriptions).limit(1);
                        if (bg.length > 0) {
                            await tx.update(schema.subscriptions).set({
                                status: 'active',
                                currentPeriodEnd: periodEnd,
                                updatedAt: new Date()
                            }).where(eq(schema.subscriptions.id, bg[0].id));
                        }
                    });
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                // Fetch customer to find tenant
                const customer = await stripe.customers.retrieve(subscription.customer as string);
                if (!customer.deleted && (customer as Stripe.Customer).metadata?.tenantId) {
                    const tenantId = (customer as Stripe.Customer).metadata.tenantId;
                    await withTenantDB(tenantId, async (tx, schema) => {
                        const bg = await tx.select().from(schema.subscriptions).limit(1);
                        if (bg.length > 0) {
                            await tx.update(schema.subscriptions).set({
                                status: 'canceled',
                                updatedAt: new Date()
                            }).where(eq(schema.subscriptions.id, bg[0].id));
                        }
                    });
                }
                break;
            }
        }
    } catch (error) {
        console.error("Stripe Webhook Handler Error:", error);
        return new Response('Handler Failed', { status: 500 });
    }

    return new Response('Received', { status: 200 });
}
