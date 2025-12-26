import { inngest } from '@/lib/inngest/client'
import { NextRequest } from 'next/server'

// Meta sends the verification token in GET requests
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams

    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    // Hardcoded for simplicity as requested, preferably use env var
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'zapia_verify_token'

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED')
            return new Response(challenge, { status: 200 })
        } else {
            return new Response('Forbidden', { status: 403 })
        }
    }

    return new Response('Bad Request', { status: 400 })
}

export async function POST(req: NextRequest) {
    try {
        // 1. Extract Tenant Logic
        // Strategy: Tenant ID passed as ?tenantId=xyz in the Webhook URL
        const searchParams = req.nextUrl.searchParams
        const tenantId = searchParams.get('tenantId')

        const body = await req.json()

        // Basic Validation: Check if it's a WhatsApp object
        if (body.object) {
            if (
                body.entry &&
                body.entry[0].changes &&
                body.entry[0].changes[0] &&
                body.entry[0].changes[0].value.messages &&
                body.entry[0].changes[0].value.messages[0]
            ) {
                // Extract relevant payload only to keep event size small
                const value = body.entry[0].changes[0].value;
                const wam_id = value.messages[0].id;

                // If we don't have a tenantId from URL, we can't process multi-tenancy securely yet.
                // In production, we might map body.entry[0].id (WABA ID) to a tenant.
                // For now, logging error if missing
                if (!tenantId) {
                    console.error("Missing tenantId in Webhook URL");
                    // Response 200 to Meta anyway to stop retries, but log error
                    return new Response('OK - Missing Tenant', { status: 200 });
                }

                // 2. Dispatch to Inngest (Fan-out)
                await inngest.send({
                    name: 'whatsapp/message.received',
                    data: {
                        tenantId: tenantId,
                        payload: {
                            messages: value.messages,
                            contacts: value.contacts,
                            wam_id: wam_id
                        }
                    }
                })
            }
            return new Response('EVENT_RECEIVED', { status: 200 })
        } else {
            return new Response('Not a WhatsApp Event', { status: 404 })
        }
    } catch (err) {
        console.error(err)
        return new Response('Internal Server Error', { status: 500 })
    }
}
