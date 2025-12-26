export async function sendWhatsApp(to: string, text: string) {
    if (!to || !text) return;

    // Assuming Cloud API - this should be in .env
    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;
    const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
        console.warn("Missing WhatsApp Credentials, skipping send.");
        console.log(`[MOCK SEND] To: ${to}, Text: ${text}`);
        return;
    }

    try {
        const response = await fetch(
            `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${ACCESS_TOKEN}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to: to,
                    text: { body: text },
                }),
            }
        );

        if (!response.ok) {
            const err = await response.json();
            console.error("WhatsApp Send Error:", err);
            throw new Error("Failed to send WhatsApp message");
        }
        return await response.json();
    } catch (error) {
        console.error("Network Error Sending WhatsApp:", error);
        throw error;
    }
}
