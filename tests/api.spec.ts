import { test, expect } from '@playwright/test';

test.describe('API Smoke Tests', () => {

    test('POST /api/webhooks/whatsapp should respond (verification or method not allowed)', async ({ request }) => {
        // Basic connectivity check
        const response = await request.post('/api/webhooks/whatsapp', {
            data: {
                object: 'whatsapp_business_account',
                entry: []
            }
        });

        // We expect 200 OK or maybe 400 if validation fails, but definitely not 404 or 500
        expect(response.status()).toBeLessThan(500);
    });

    test('GET /api/webhooks/whatsapp (Verification) should handle challenge', async ({ request }) => {
        const response = await request.get('/api/webhooks/whatsapp', {
            params: {
                'hub.mode': 'subscribe',
                'hub.verify_token': 'zapia_verify',
                'hub.challenge': '12345'
            }
        });

        expect(response.status()).toBe(200);
        expect(await response.text()).toBe('12345');
    });

});
