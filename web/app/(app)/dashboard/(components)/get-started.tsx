'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QrCode, Copy, AlertTriangle, Download, Smartphone } from 'lucide-react'
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
      <Card>
        <CardHeader>
          <CardTitle>Get Started</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-muted-foreground'>
            To start using TextBee, you need to generate an API key and connect
            your device.
          </p>
          <GenerateApiKey/>
        </CardContent>
      </Card>

     
    </>
  )
}
