'use client'

import { isToday, isYesterday, subWeeks, subMonths } from 'date-fns'
import { useState } from 'react'
import useSWRInfinite from 'swr/infinite'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    useSidebar
} from '@/components/ui/sidebar'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ChatItem } from './sidebar-history-item'
import { Loader2 } from 'lucide-react'

const PAGE_SIZE = 20

const groupChatsByDate = (chats: any[]) => {
    const now = new Date()
    const weekly = subWeeks(now, 1)
    const monthly = subMonths(now, 1)

    return chats.reduce((acc: any, chat: any) => {
        const d = new Date(chat.createdAt)
        if (isToday(d)) acc.today.push(chat)
        else if (isYesterday(d)) acc.yesterday.push(chat)
        else if (d > weekly) acc.lastWeek.push(chat)
        else if (d > monthly) acc.lastMonth.push(chat)
        else acc.older.push(chat)
        return acc
    }, { today: [], yesterday: [], lastWeek: [], lastMonth: [], older: [] })
}

export function SimpleSidebar({ userId }: { userId: string | undefined }) {
    const { setOpenMobile } = useSidebar()
    const router = useRouter()
    const searchParams = useSearchParams()
    const id = searchParams.get('id')
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const { data, setSize, size, isLoading, mutate } = useSWRInfinite(
        (index, prev) => {
            if (prev && !prev.hasMore) return null
            return `/api/history?limit=${PAGE_SIZE}${prev ? `&ending_before=${prev.chats.at(-1)?.id}` : ''}`
        },
        (url) => fetch(url).then(res => res.json())
    )

    const chats = data ? data.flatMap(d => d.chats) : []
    const grouped = groupChatsByDate(chats)
    const hasMore = data ? data[data.length - 1]?.hasMore : false

    const handleDelete = async () => {
        if (!deleteId) return
        const res = await fetch(`/api/chat?id=${deleteId}`, { method: 'DELETE' })
        if (res.ok) {
            mutate()
            if (id === deleteId) router.push('/dashboard/chat')
        }
        setDeleteId(null)
    }

    if (!userId) return null

    return (
        <>
            <SidebarGroup>
                <SidebarGroupContent>
                    <SidebarMenu>
                        {Object.entries(grouped).map(([label, items]: [string, any]) => (
                            items.length > 0 && (
                                <div key={label} className="mb-4">
                                    <div className="px-2 py-1 text-xs text-sidebar-foreground/50 capitalize">
                                        {label === 'today' ? 'Hoje' : label === 'yesterday' ? 'Ontem' : label}
                                    </div>
                                    {items.map((chat: any) => (
                                        <ChatItem
                                            key={chat.id}
                                            chat={chat}
                                            isActive={chat.id === id}
                                            onDelete={setDeleteId}
                                            setOpenMobile={setOpenMobile}
                                        />
                                    ))}
                                </div>
                            )
                        ))}
                    </SidebarMenu>

                    {hasMore && (
                        <button
                            onClick={() => setSize(size + 1)}
                            className="w-full py-2 text-xs text-center text-sidebar-foreground/50 hover:text-sidebar-foreground"
                        >
                            {isLoading ? <Loader2 className="animate-spin h-3 w-3 mx-auto" /> : 'Carregar mais'}
                        </button>
                    )}
                </SidebarGroupContent>
            </SidebarGroup>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação é permanente.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
