'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDashboardMetrics } from '@/app/actions/analytics'
import { KPICard, PipelineFunnel, ActivityChart } from '@/components/dashboard/AnalyticsCharts'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Activity, DollarSign, MessageSquare, Users, ArrowUpRight } from 'lucide-react'
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function DashboardPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['dashboard-metrics'],
        queryFn: async () => {
            const result = await getDashboardMetrics({});
            if ('error' in result) throw new Error(result.error);
            return result;
        }
    });

    if (isLoading) return <DashboardSkeleton />
    if (!data) return <div className="p-8">Failed to load analytics.</div>

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    {/* DateRangePicker could go here */}
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Total Leads"
                    value={data.kpis.totalDeals}
                    description="Active opportunities"
                    icon={Users}
                />
                <KPICard
                    title="Pipeline Value"
                    value={formatCurrency(data.kpis.pipelineValue)}
                    description="Weighted probable value"
                    icon={DollarSign}
                />
                <KPICard
                    title="Messages Today"
                    value={data.kpis.messagesToday}
                    description="Inbound & Outbound volume"
                    icon={MessageSquare}
                />
                <KPICard
                    title="Conversion Rate"
                    value="+12.5%"
                    description="Compared to last week"
                    icon={Activity}
                />
            </div>

            {/* Charts Area */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Main Chart (Activity) */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Message Volume</CardTitle>
                        <CardDescription>
                            Interaction activity over the last 7 days.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ActivityChart data={data.activity} />
                    </CardContent>
                </Card>

                {/* Secondary Chart (Funnel) */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Pipeline Funnel</CardTitle>
                        <CardDescription>
                            Deal distribution by stage.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PipelineFunnel data={data.funnel} />
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity List */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Latest messages across all channels.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px]">
                            <div className="space-y-4">
                                {data.recent.map((msg: any) => (
                                    <div key={msg.id} className="flex items-center">
                                        <Avatar className="h-9 w-9">
                                            <AvatarFallback>
                                                {msg.contactName?.substring(0, 2).toUpperCase() || "??"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">{msg.contactName}</p>
                                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                {msg.direction === 'outbound' ? 'You: ' : ''}{msg.content}
                                            </p>
                                        </div>
                                        <div className="ml-auto font-medium text-[10px] text-muted-foreground">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
