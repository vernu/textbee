'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { ApiEndpoints } from '@/config/api'
import { Badge } from '@/components/ui/badge'
import { Copy, Check } from 'lucide-react'

const STORAGE_KEYS = {
    DISMISSED: 'black_friday_modal_dismissed',
    LAST_SHOWN: 'black_friday_modal_last_shown',
}

const SHOW_INTERVAL = 6 * 60 * 60 * 1000 // 6 hours

export default function BlackFridayModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [copiedCode, setCopiedCode] = useState<string | null>(null)

    const { data: currentSubscription, isLoading } = useQuery({
        queryKey: ['currentSubscription'],
        queryFn: () =>
            httpBrowserClient
                .get(ApiEndpoints.billing.currentSubscription())
                .then((res) => res.data),
    })

    useEffect(() => {
        if (isLoading || !currentSubscription) return

        // Only show for free plan
        if (currentSubscription?.plan?.name !== 'free') return

        // Check if permanently dismissed
        if (localStorage.getItem(STORAGE_KEYS.DISMISSED) === 'true') return

        // Check last shown time
        const lastShown = localStorage.getItem(STORAGE_KEYS.LAST_SHOWN)
        const now = Date.now()
        if (lastShown && now - parseInt(lastShown) < SHOW_INTERVAL) return

        // Show modal
        setIsOpen(true)
    }, [currentSubscription, isLoading])

    const handleDismiss = () => {
        localStorage.setItem(STORAGE_KEYS.DISMISSED, 'true')
        setIsOpen(false)
    }

    const handleRemindLater = () => {
        localStorage.setItem(STORAGE_KEYS.LAST_SHOWN, Date.now().toString())
        setIsOpen(false)
    }

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code)
        setCopiedCode(code)
        setTimeout(() => setCopiedCode(null), 2000)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleRemindLater()}>
            <DialogContent className="sm:max-w-xl border-2 border-purple-500/20 shadow-2xl shadow-purple-500/10">
                <DialogHeader>
                    <div className="mx-auto bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-2 animate-pulse">
                        LIMITED TIME OFFER
                    </div>
                    <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
                        🔥 Black Friday Sale
                    </DialogTitle>
                    <DialogDescription className="text-center text-base">
                        Upgrade to Pro and unlock the full potential of textbee.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Benefits List */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        {[
                            "Increased SMS limits",
                            "No daily limits",
                            "No bulk send limits",
                            "Priority support",
                        ].map((benefit, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                    <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                                </div>
                                <span>{benefit}</span>
                            </div>
                        ))}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-muted p-4 rounded-lg space-y-3 flex flex-col justify-between">
                            <div className="flex items-start justify-between">
                                <div className="flex flex-col">
                                    <span className="font-medium">Monthly Plan</span>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-muted-foreground line-through">$9.99</span>
                                        <span className="font-bold text-green-600">$5.99</span>
                                    </div>
                                </div>
                                <Badge variant="secondary" className="bg-black text-white hover:bg-black/90">40% OFF</Badge>
                            </div>
                            <div className="flex items-center gap-2 bg-background p-2 rounded border border-dashed border-primary/50">
                                <code className="flex-1 font-mono font-bold text-center text-primary text-sm">BLACKFRIDAY40</code>
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyCode('BLACKFRIDAY40')}>
                                    {copiedCode === 'BLACKFRIDAY40' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-4 rounded-lg space-y-3 border border-purple-200 dark:border-purple-800 flex flex-col justify-between">
                            <div className="absolute -top-3 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                BEST VALUE
                            </div>
                            <div className="flex items-start justify-between">
                                <div className="flex flex-col">
                                    <span className="font-medium">Yearly Plan</span>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-muted-foreground line-through">$99.90</span>
                                        <span className="font-bold text-green-600">$49.90</span>
                                    </div>
                                </div>
                                <Badge variant="secondary" className="bg-black text-white hover:bg-black/90">50% OFF</Badge>
                            </div>
                            <div className="flex items-center gap-2 bg-background p-2 rounded border border-dashed border-primary/50">
                                <code className="flex-1 font-mono font-bold text-center text-primary text-sm">BLACKFRIDAY50</code>
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyCode('BLACKFRIDAY50')}>
                                    {copiedCode === 'BLACKFRIDAY50' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-center text-muted-foreground">
                        Apply code at checkout to redeem.
                    </p>
                </div>

                <DialogFooter className="flex-col sm:flex-col gap-2">
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold h-11 shadow-lg shadow-purple-500/20" asChild>
                        <Link href="/checkout/pro">
                            Claim Offer Now
                        </Link>
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground">
                        Cancel anytime. Secure payment.
                    </p>
                    <div className="flex items-center justify-between w-full pt-1">
                        <Button variant="ghost" size="sm" onClick={handleRemindLater} className="text-muted-foreground h-auto py-1">
                            Remind me later
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleDismiss} className="text-muted-foreground hover:text-destructive h-auto py-1">
                            Don't show again
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
