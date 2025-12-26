'use client'

import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Search, Phone, Video, MoreVertical, Paperclip, Send } from 'lucide-react'

// --- Mock Data ---
const CONTACTS = [
    { id: '1', name: 'Alice Smith', avatar: '', lastMessage: 'Hey, I need help with...', unread: 2, time: '10:30' },
    { id: '2', name: 'Bob Johnson', avatar: '', lastMessage: 'Deal closed! 🚀', unread: 0, time: 'Yesterday' },
    { id: '3', name: 'Charlie Brown', avatar: '', lastMessage: 'Can you send the invoice?', unread: 0, time: 'Mon' },
]

export function ChatLayout() {
    const [selectedContact, setSelectedContact] = React.useState(CONTACTS[0])

    return (
        <div className="flex h-[calc(100vh-4rem)] md:h-screen w-full bg-background overflow-hidden border-t md:border-none">

            {/* Sidebar - Contact List */}
            <aside className="w-full md:w-[350px] border-r flex flex-col bg-card">
                {/* Header */}
                <div className="h-16 border-b flex items-center justify-between px-4 bg-muted/20">
                    <Avatar>
                        <AvatarFallback>ME</AvatarFallback>
                    </Avatar>
                    <div className="flex gap-4 text-muted-foreground">
                        <button><MoreVertical size={20} /></button>
                    </div>
                </div>

                {/* Search */}
                <div className="p-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            placeholder="Search or start new chat"
                            className="w-full bg-muted pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>

                {/* List */}
                <ScrollArea className="flex-1">
                    <div className="flex flex-col">
                        {CONTACTS.map(contact => (
                            <div
                                key={contact.id}
                                onClick={() => setSelectedContact(contact)}
                                className={cn(
                                    "flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/50",
                                    selectedContact.id === contact.id && "bg-muted"
                                )}
                            >
                                <Avatar>
                                    <AvatarImage src={contact.avatar} />
                                    <AvatarFallback>{contact.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold truncate">{contact.name}</span>
                                        <span className="text-[10px] text-muted-foreground">{contact.time}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        <p className="text-sm text-muted-foreground truncate">{contact.lastMessage}</p>
                                        {contact.unread > 0 && <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">{contact.unread}</Badge>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </aside>

            {/* Main Chat Area */}
            <main className="hidden md:flex flex-1 flex-col bg-muted/10 relative">

                {/* Header */}
                <div className="h-16 border-b flex items-center justify-between px-4 bg-card z-10">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarFallback>{selectedContact.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="font-semibold text-sm">{selectedContact.name}</h2>
                            <span className="text-xs text-muted-foreground">Online</span>
                        </div>
                    </div>
                    <div className="flex gap-4 text-muted-foreground">
                        <Search size={20} />
                        <MoreVertical size={20} />
                    </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-fixed opacity-90">
                    <div className="space-y-4 flex flex-col">
                        {/* Mock Messages */}
                        <MessageBubble text="Hello! How can I help you today?" time="10:00" isMe={false} />
                        <MessageBubble text="I have a question about the contract." time="10:02" isMe={true} />
                        <MessageBubble text="Sure, go ahead." time="10:03" isMe={false} />
                    </div>
                </ScrollArea>

                {/* Input */}
                <div className="min-h-[60px] bg-card border-t p-3 flex items-center gap-2">
                    <button className="text-muted-foreground hover:text-foreground p-2"><Paperclip size={20} /></button>
                    <input
                        placeholder="Type a message..."
                        className="flex-1 bg-muted px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button className="bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90"><Send size={18} /></button>
                </div>

            </main>
        </div>
    )
}

function MessageBubble({ text, time, isMe }: { text: string, time: string, isMe: boolean }) {
    return (
        <div className={cn(
            "max-w-[70%] rounded-lg p-3 shadow-sm text-sm relative",
            isMe ? "bg-[#d9fdd3] dark:bg-[#005c4b] self-end rounded-tr-none" : "bg-card self-start rounded-tl-none"
        )}>
            <p className="mr-8">{text}</p>
            <span className={cn(
                "absolute bottom-1 right-2 text-[10px]",
                isMe ? "text-green-800 dark:text-green-100" : "text-muted-foreground"
            )}>{time}</span>
        </div>
    )
}
