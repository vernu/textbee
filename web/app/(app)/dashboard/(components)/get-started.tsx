'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QrCode, Copy, AlertTriangle, Download, Smartphone, Lightbulb } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import QRCode from 'react-qr-code'
import GenerateApiKey from './generate-api-key'

export default function GetStartedCard() {
  const [isGenerateKeyModalOpen, setIsGenerateKeyModalOpen] = useState(false)
  const [isConfirmGenerateKeyModalOpen, setIsConfirmGenerateKeyModalOpen] =
    useState(false)
  const [apiKey, setApiKey] = useState('')

  const handleConfirmGenerateKey = () => {
    setIsConfirmGenerateKeyModalOpen(true)
  }

  const handleGenerateKey = () => {
    setIsConfirmGenerateKeyModalOpen(false)
    // Simulate API key generation
    const newKey = 'sk_live_' + Math.random().toString(36).substring(2, 15)
    setApiKey(newKey)
    setIsGenerateKeyModalOpen(true)
  }
  const { toast } = useToast()

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey)
    toast({
      title: 'API key copied to clipboard',
    })
  }

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey)
    toast({
      title: 'API key copied to clipboard',
    })
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="rounded-full bg-primary/20 p-1.5">
                <Lightbulb className="h-4 w-4 text-primary" />
              </div>
              <CardTitle>Quick Start Guide</CardTitle>
            </div>
          </div>
          <CardDescription className="mt-2">
            Complete these steps to start using TextBee SMS Gateway
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start space-x-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                1
              </div>
              <div className="space-y-1">
                <p className="font-medium">Download TextBee App</p>
                <p className="text-sm text-muted-foreground">
                  Install the TextBee app on your Android device
                </p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => window.open('https://dl.textbee.dev', '_blank')}>
                  <Download className="mr-2 h-4 w-4" />
                  Download App APK
                </Button>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary">
                2
              </div>
              <div className="space-y-1">
                <p className="font-medium">Generate API Key</p>
                <p className="text-sm text-muted-foreground">
                  Create an API key to authenticate your requests
                </p>
                <GenerateApiKey />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
