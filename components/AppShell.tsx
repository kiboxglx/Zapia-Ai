'use client'

import * as React from 'react'
import { useMediaQuery } from '@/hooks/use-media-query'
import { Toaster } from 'sonner'
import { LayoutDashboard, MessageSquare, Kanban as KanbanIcon, Settings, Plus, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Chats', icon: MessageSquare, href: '/chats' },
    { label: 'Kanban', icon: KanbanIcon, href: '/kanban' },
    { label: 'Config', icon: Settings, href: '/dashboard/settings' },
]

export function AppShell({ children }: { children: React.ReactNode }) {
    const isDesktop = useMediaQuery("(min-width: 768px)")
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <div className="flex h-screen w-full flex-col md:flex-row bg-background text-foreground overflow-hidden">
            {isDesktop && <Sidebar />}

            <main className="flex-1 overflow-y-auto relative scroll-smooth">
                {children}
            </main>

            {!isDesktop && <BottomNav />}
            <Toaster position="top-center" />
        </div>
    )
}

function Sidebar() {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = React.useState(false)

    return (
        <aside className={cn(
            "flex flex-col border-r bg-card transition-all duration-300",
            collapsed ? "w-16" : "w-64"
        )}>
            <div className="flex h-16 items-center justify-between px-4 border-b">
                {!collapsed && <span className="font-bold text-lg tracking-tight">Zapia AI</span>}
                <button onClick={() => setCollapsed(!collapsed)} className="p-2 ghost hover:bg-muted rounded-md text-muted-foreground hover:text-foreground">
                    <Menu size={20} />
                </button>
            </div>
            <nav className="flex-1 p-2 space-y-1">
                {NAV_ITEMS.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                            pathname === item.href
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            collapsed && "justify-center px-0"
                        )}
                    >
                        <item.icon size={20} />
                        {!collapsed && <span>{item.label}</span>}
                    </Link>
                ))}
            </nav>
            <div className="p-4 border-t">
                {!collapsed && <div className="text-xs text-muted-foreground">© 2024 Zapia</div>}
            </div>
        </aside>
    )
}

function BottomNav() {
    const pathname = usePathname()

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-lg border-t flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
            {NAV_ITEMS.slice(0, 2).map((item) => (
                <NavItem key={item.href} item={item} isActive={pathname === item.href} />
            ))}

            <div className="relative -top-6">
                <button className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform ring-4 ring-background">
                    <Plus size={28} />
                </button>
            </div>

            {NAV_ITEMS.slice(2).map((item) => (
                <NavItem key={item.href} item={item} isActive={pathname === item.href} />
            ))}
        </nav>
    )
}

function NavItem({ item, isActive }: { item: typeof NAV_ITEMS[0], isActive: boolean }) {
    return (
        <Link
            href={item.href}
            className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[60px] p-2 rounded-lg transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
            )}
        >
            <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
        </Link>
    )
}
