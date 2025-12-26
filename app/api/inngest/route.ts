import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { syncUserSearch, provisionResources } from "@/lib/inngest/functions";
import { receiveWhatsAppMessage } from "@/lib/inngest/functions/whatsapp";

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        syncUserSearch,
        provisionResources,
        receiveWhatsAppMessage
    ],
});
