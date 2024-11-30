import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { ApiEndpoints } from '@/config/api'
import { Routes } from '@/config/routes'
import { useToast } from '@/hooks/use-toast'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QrCode, Copy, Smartphone, Download, AlertTriangle } from 'lucide-react'
import React, { useState } from 'react'
import QRCode from 'react-qr-code'

export default function GenerateApiKey() {
  const [isGenerateKeyModalOpen, setIsGenerateKeyModalOpen] = useState(false)
  const [isConfirmGenerateKeyModalOpen, setIsConfirmGenerateKeyModalOpen] =
    useState(false)

  const handleConfirmGenerateKey = () => {
    setIsConfirmGenerateKeyModalOpen(true)
  }

  const queryClient = useQueryClient()

  // invalidate devices query after successful api key generation
  const {
    isPending: isGeneratingApiKey,
    error: generateApiKeyError,
    mutateAsync: generateApiKey,
    data: generatedApiKey,
  } = useMutation({
    mutationKey: ['generate-api-key'],
    onSuccess: (data) => {
      setIsConfirmGenerateKeyModalOpen(false)
      setIsGenerateKeyModalOpen(true)
      queryClient.invalidateQueries({ queryKey: ['apiKeys', 'stats'] })
      queryClient.refetchQueries({ queryKey: ['apiKeys', 'stats'] })
    },
    mutationFn: () =>
      httpBrowserClient
        .post(ApiEndpoints.auth.generateApiKey())
        .then((res) => res.data),
  })

  const { toast } = useToast()

  const handleCopyKey = () => {
    navigator.clipboard.writeText(generatedApiKey?.data)
    toast({
      title: 'API key copied to clipboard',
    })
  }

  return (
    <>
      <Button onClick={handleConfirmGenerateKey}>
        <QrCode className='mr-2 h-4 w-4' />
        Generate API Key
      </Button>

      <Dialog
        open={isConfirmGenerateKeyModalOpen}
        onOpenChange={setIsConfirmGenerateKeyModalOpen}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Create new API Key</DialogTitle>
            <DialogDescription>
              <div className='space-y-2 text-sm text-muted-foreground'>
                <p>
                  By clicking generate, you will be able to view your API key.
                  Make sure to save it before closing the modal as you will not
                  be able to view it again.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className='flex flex-col space-y-4'>
            <Button
              onClick={() => generateApiKey()}
              disabled={isGeneratingApiKey}
            >
              {isGeneratingApiKey ? (
                <div className='flex justify-center items-center h-full'>
                  <Spinner size='sm' className='text-white' />
                </div>
              ) : (
                'Generate API Key'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isGenerateKeyModalOpen}
        onOpenChange={setIsGenerateKeyModalOpen}
      >
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Your API Key</DialogTitle>
            <DialogDescription>
              Use this API key to connect your device or authenticate your
              service.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-6'>
            <div className='flex justify-center p-4 bg-muted rounded-lg '>
              {generatedApiKey?.data && (
                <QRCode value={generatedApiKey?.data} size={120} />
              )}
            </div>

            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <code className='relative rounded bg-muted px-[0.5rem] py-[0.3rem] font-mono text-sm flex-1'>
                  {generatedApiKey?.data}
                </code>
                <Button variant='outline' size='icon' onClick={handleCopyKey}>
                  <Copy className='h-4 w-4' />
                </Button>
              </div>
            </div>

            <div className='space-y-4 text-sm'>
              <div className='space-y-2'>
                <h4 className='font-medium flex items-center gap-2'>
                  <Smartphone className='h-4 w-4' />
                  For Device Registration
                </h4>
                <p className='text-muted-foreground'>
                  Open the TextBee app and scan the QR code, or manually enter
                  the API key in the app and click register/update.
                </p>
              </div>

              <div className='space-y-2'>
                <h4 className='font-medium flex items-center gap-2'>
                  <Download className='h-4 w-4' />
                  Don&apos;t have the app?
                </h4>
                <p className='text-muted-foreground'>
                  Download the APK from{' '}
                  <a
                    href={Routes.downloadAndroidApp}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-primary hover:underline'
                  >
                    {Routes.downloadAndroidApp}
                  </a>{' '}
                  and install it.
                </p>
              </div>

              <div className='space-y-2'>
                <h4 className='font-medium'>For External Services</h4>
                <p className='text-muted-foreground'>
                  Copy the API key and store it securely for authenticating your
                  external service with TextBee.
                </p>
              </div>

              <div className='rounded-md bg-yellow-50 dark:bg-yellow-900/30 p-3 mt-4'>
                <div className='flex items-center gap-2 text-yellow-800 dark:text-yellow-200'>
                  <AlertTriangle className='h-4 w-4' />
                  <p className='text-sm font-medium'>Important</p>
                </div>
                <p className='mt-2 text-sm text-yellow-700 dark:text-yellow-300'>
                  Once you close this modal, you will not be able to view your
                  API key again. Make sure to save it before closing.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
