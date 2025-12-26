'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useChatSubscription(conversationId: string, tenantId: string) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!conversationId) return;

        // Subscribe to NEW messages for this contact (conversation)
        // Note: Realtime filtering syntax might depend on your table configuration (RLS policies)
        // If Postgres Changes is enabled for 'messages' table:
        const channel = supabase
            .channel(`chat:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public', // Drizzle often uses mapped schemas, but Realtime usually exposes 'public' unless configed. 
                    // If using dynamic schemas (tenant_id.messages), Realtime setup is more complex.
                    // Assuming "Bridge Model" means dynamic schemas:
                    // Supabase Realtime listens to the table in the specific schema?
                    // Supabase usually exposes 'public' by default. If we use a custom schema (e.g. 'org_xyz'), we must specify it.
                    // However, without detailed Supabase config access, we might fallback to 'public' or assume the user has configured publication for all schemas.
                    // Let's assume standard behavior for now: 'schema' matches the one in DB.
                    // Hack: If we don't know the exact schema name format or if publication is on, this might fail silent.
                    // For this scaffolding, we'll try to use the tenantId as schema if that's the extensive design, 
                    // or 'public' if using single-schema-multi-tenant (but design said Bridge Model).
                    // Let's try matching the table 'messages' via Filter.
                    schema: tenantId, // Using tenantId as schema name as per design
                    table: 'messages',
                    filter: `contact_id=eq.${conversationId}`
                },
                (payload) => {
                    const newMessage = payload.new;

                    // Optimistic update / Cache injection
                    queryClient.setQueryData(['messages', conversationId], (old: any[]) => {
                        if (!old) return [newMessage];
                        // Avoid duplicates
                        if (old.find(m => m.id === newMessage.id)) return old;
                        return [...old, newMessage];
                    });
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`Realtime connected for chat ${conversationId}`);
                }
            });

        return () => {
            supabase.removeChannel(channel);
        }
    }, [conversationId, queryClient, tenantId]);
}
