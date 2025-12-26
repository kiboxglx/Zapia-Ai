'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSettings, saveAISettings, saveWhatsAppSettings, AISettingsSchema, WhatsAppSettingsSchema } from '@/app/actions/settings'
import { AutoForm } from '@/components/AutoForm'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card' // Assuming ui exists or using mock div
import { Copy } from 'lucide-react'

// --- Mock UI Components if not present yet to ensure build ---
function UICard({ children, className }: any) { return <div className={`border rounded-lg bg-card text-card-foreground shadow-sm ${className}`}>{children}</div> }
function UICardHeader({ children }: any) { return <div className="flex flex-col space-y-1.5 p-6">{children}</div> }
function UICardTitle({ children }: any) { return <h3 className="text-2xl font-semibold leading-none tracking-tight">{children}</h3> }
function UICardDescription({ children }: any) { return <p className="text-sm text-muted-foreground">{children}</p> }
function UICardContent({ children }: any) { return <div className="p-6 pt-0">{children}</div> }

export default function SettingsPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['settings'],
        queryFn: () => getSettings()
    });

    const onSaveAI = async (values: any) => {
        try {
            await saveAISettings(values);
            toast.success("AI Settings Saved!");
        } catch (e) {
            toast.error("Failed to save AI settings");
        }
    }

    const onSaveWA = async (values: any) => {
        try {
            await saveWhatsAppSettings(values);
            toast.success("WhatsApp Connected!");
        } catch (e) {
            toast.error("Failed to save WhatsApp settings");
        }
    }

    if (isLoading) return <div className="p-8">Loading settings...</div>

    // Mock Host for display
    const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/whatsapp?tenantId=org_default_test` : "Loading...";

    return (
        <div className="container mx-auto p-4 space-y-8 max-w-4xl pb-24">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

            {/* AI Configuration */}
            <UICard>
                <UICardHeader>
                    <UICardTitle>AI Brain Configuration</UICardTitle>
                    <UICardDescription>Customize your agent's personality and intelligence.</UICardDescription>
                </UICardHeader>
                <UICardContent>
                    <AutoForm
                        schema={AISettingsSchema}
                        defaultValues={data?.ai}
                        onSubmit={onSaveAI}
                    />
                </UICardContent>
            </UICard>

            {/* WhatsApp Connection */}
            <UICard>
                <UICardHeader>
                    <UICardTitle>WhatsApp Connection</UICardTitle>
                    <UICardDescription>Connect your Meta Business Account.</UICardDescription>
                </UICardHeader>
                <UICardContent className="space-y-6">
                    <div className="bg-muted p-4 rounded-md flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase">Webhook URL</p>
                            <code className="text-sm block truncate max-w-[300px] md:max-w-full">{webhookUrl}</code>
                        </div>
                        <button onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.info("Copied!") }} className="p-2 hover:bg-background rounded">
                            <Copy size={16} />
                        </button>
                    </div>

                    <AutoForm
                        schema={WhatsAppSettingsSchema}
                        defaultValues={data?.whatsapp}
                        onSubmit={onSaveWA}
                    />
                </UICardContent>
            </UICard>
        </div>
    )
}
