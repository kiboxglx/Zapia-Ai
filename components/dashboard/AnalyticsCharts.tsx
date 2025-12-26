'use client'

import React from 'react'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    AreaChart, Area, CartesianGrid
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, MessageSquare, Users, Activity } from "lucide-react"

// --- Components ---

interface KPICardProps {
    title: string;
    value: string | number;
    description: string;
    icon: React.ElementType;
}

export function KPICard({ title, value, description, icon: Icon }: KPICardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )
}

interface FunnelChartProps {
    data: { name: string, value: number }[];
}

export function PipelineFunnel({ data }: FunnelChartProps) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" fill="#adfa1d" radius={[0, 4, 4, 0]} barSize={32} />
            </BarChart>
        </ResponsiveContainer>
    )
}

interface ActivityChartProps {
    data: { date: string, messages: number }[];
}

export function ActivityChart({ data }: ActivityChartProps) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip />
                <Area type="monotone" dataKey="messages" stroke="#8884d8" fillOpacity={1} fill="url(#colorMessages)" />
            </AreaChart>
        </ResponsiveContainer>
    )
}
