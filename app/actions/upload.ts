'use server'

import { createClient } from '@supabase/supabase-js'
import { authenticatedAction } from '@/lib/safe-action'
import { z } from 'zod'

// We need a Service Role client for uploads if we want to bypass RLS policies on storage objects purely server-side
// OR we just use the anon key if policies allow authenticated uploads.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Add this to .env

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

// Since FormData is not directly Zod validatable in a simple object schema without parsing,
// we will use a workaround or manual parsing in the handler if strictly using `authenticatedAction`.
// `authenticatedAction` expects a JSON object typically.
// Server Actions + FormData usually means `action(formData)`.
// We'll create a standalone action for now that wraps auth check manually or use a slightly different pattern for FormData.

export async function uploadMedia(formData: FormData) {
    const file = formData.get('file') as File;
    const tenantId = formData.get('tenantId') as string;

    if (!file || !tenantId) throw new Error("Missing file or tenant");

    // File validation
    if (file.size > 10 * 1024 * 1024) throw new Error("File too large (max 10MB)");

    const buffer = await file.arrayBuffer();
    const fileExt = file.name.split('.').pop();
    const fileName = `${tenantId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await adminClient
        .storage
        .from('chat-media')
        .upload(fileName, buffer, {
            contentType: file.type,
            upsert: false
        });

    if (error) {
        console.error("Upload error:", error);
        throw new Error("Upload failed");
    }

    const { data: { publicUrl } } = adminClient
        .storage
        .from('chat-media')
        .getPublicUrl(fileName);

    return { url: publicUrl, type: file.type };
}
