'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Copy, Key, MoreVertical, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useMutation, useQuery } from '@tanstack/react-query'
import httpBrowserClient from '@/lib/httpBrowserClient'
import { ApiEndpoints } from '@/config/api'
import { Skeleton } from '@/components/ui/skeleton'

export default function ApiKeys() {
  const {
    isPending,
    error,
    data: apiKeys,
    refetch: refetchApiKeys,
  } = useQuery({
    queryKey: ['apiKeys'],
    queryFn: () =>
      httpBrowserClient
        .get(ApiEndpoints.auth.listApiKeys())
        .then((res) => res.data),
    // select: (res) => res.data,
  })

  const { toast } = useToast()

  const [selectedKey, setSelectedKey] = useState<(typeof apiKeys)[0] | null>(
    null
  )
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false)
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')

  const {
    mutate: revokeApiKey,
    isPending: isRevokingApiKey,
    error: revokeApiKeyError,
    isSuccess: isRevokeApiKeySuccess,
  } = useMutation({
    mutationFn: (id: string) =>
      httpBrowserClient.post(ApiEndpoints.auth.revokeApiKey(id)),
    onSuccess: () => {
      setIsRevokeDialogOpen(false)
      toast({
        title: `API key "${selectedKey.apiKey}" has been revoked`,
      })
      refetchApiKeys()
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error revoking API key',
        description: revokeApiKeyError?.message,
      })
    },
  })

  const {
    mutate: deleteApiKey,
    isPending: isDeletingApiKey,
    error: deleteApiKeyError,
    isSuccess: isDeleteApiKeySuccess,
  } = useMutation({
    mutationFn: (id: string) =>
      httpBrowserClient.delete(ApiEndpoints.auth.deleteApiKey(id)),
    onSuccess: () => {
      setIsDeleteDialogOpen(false)
      toast({
        title: `API key deleted`,
      })
      refetchApiKeys()
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error deleting API key',
        description: deleteApiKeyError?.message,
      })
    },
  })
  const {
    mutate: renameApiKey,
    isPending: isRenamingApiKey,
    error: renameApiKeyError,
    isSuccess: isRenameApiKeySuccess,
  } = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      httpBrowserClient.patch(ApiEndpoints.auth.renameApiKey(id), { name }),
    onSuccess: () => {
      setIsRenameDialogOpen(false)
      toast({
        title: `API key renamed to "${newKeyName}"`,
      })
      refetchApiKeys()
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error renaming API key',
        description: renameApiKeyError?.message,
      })
    },
  })

  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-lg'>API Keys</CardTitle>
      </CardHeader>
      <CardContent>
          <div className='space-y-2'>
            {isPending && (
              <>
                {[1, 2, 3].map((i) => (
                  <Card key={i} className='border-0 shadow-none'>
                    <CardContent className='flex items-center p-3'>
                      <Skeleton className='h-6 w-6 mr-3' />
                      <div className='flex-1'>
                        <div className='flex items-center justify-between'>
                          <Skeleton className='h-4 w-24' />
                          <Skeleton className='h-4 w-16' />
                        </div>
                        <div className='flex items-center space-x-2 mt-1'>
                          <Skeleton className='h-4 w-64' />
                        </div>
                        <div className='flex items-center mt-1 space-x-3'>
                          <Skeleton className='h-3 w-32' />
                          <Skeleton className='h-3 w-32' />
                        </div>
                      </div>
                      <Skeleton className='h-6 w-6' />
                    </CardContent>
                  </Card>
                ))}
              </>
            )}

            {error && (
              <div className='flex justify-center items-center h-full'>
                <div>Error: {error.message}</div>
              </div>
            )}

            {!isPending && !error && apiKeys?.data?.length === 0 && (
              <div className='flex justify-center items-center h-full'>
                <div>No API keys found</div>
              </div>
            )}

            {apiKeys?.data?.map((apiKey) => (
              <Card key={apiKey._id} className='border-0 shadow-none'>
                <CardContent className='flex items-center p-3'>
                  <Key className='h-6 w-6 mr-3' />
                  <div className='flex-1'>
                    <div className='flex items-center justify-between'>
                      <h3 className='font-semibold text-sm'>
                        {apiKey.name || 'API Key'}
                      </h3>
                      <Badge
                        variant={apiKey.revokedAt ? 'secondary' : 'default'}
                        className='text-xs'
                      >
                        {apiKey.revokedAt ? 'Revoked' : 'Active'}
                      </Badge>
                    </div>
                    <div className='flex items-center space-x-2 mt-1'>
                      <code className='relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs'>
                        {apiKey.apiKey}
                      </code>
                    </div>
                    <div className='flex items-center mt-1 space-x-3 text-xs text-muted-foreground'>
                      <div>
                        Created at:{' '}
                        {new Date(apiKey.createdAt).toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </div>
                      <div>
                        Last used: {/* if usage count is 0, show never  */}
                        {apiKey?.lastUsedAt && apiKey.usageCount > 0
                          ? new Date(apiKey.lastUsedAt).toLocaleString(
                              'en-US',
                              {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              }
                            )
                          : 'Never'}
                      </div>
                    </div>
                  </div>
                  <div className=''>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon' className='h-6 w-6'>
                          <MoreVertical className='h-3 w-3' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedKey(apiKey)
                            setNewKeyName(apiKey.name || 'API Key')
                            setIsRenameDialogOpen(true)
                          }}
                        >
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className='text-destructive'
                          onClick={() => {
                            setSelectedKey(apiKey)
                            setIsRevokeDialogOpen(true)
                          }}
                          disabled={!!apiKey.revokedAt}
                        >
                          Revoke
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className='text-destructive'
                          onClick={() => {
                            setSelectedKey(apiKey)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

        {/* Revoke Dialog */}
        <Dialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Revoke API Key</DialogTitle>
              <DialogDescription>
                Are you sure you want to revoke this API key? This action cannot
                be undone, and any applications using this key will stop working
                immediately.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setIsRevokeDialogOpen(false)}
                disabled={isRevokingApiKey}
              >
                Cancel
              </Button>
              <Button
                variant='destructive'
                onClick={() => revokeApiKey(selectedKey?._id)}
                disabled={isRevokingApiKey}
              >
                {isRevokingApiKey ? (
                  <Loader2 className='h-4 w-4 animate-spin mr-2' />
                ) : null}
                Revoke Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete API Key</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this API key? This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeletingApiKey}
              >
                Cancel
              </Button>
              <Button
                variant='destructive'
                onClick={() => deleteApiKey(selectedKey?._id)}
                disabled={isDeletingApiKey}
              >
                {isDeletingApiKey ? (
                  <Loader2 className='h-4 w-4 animate-spin mr-2' />
                ) : null}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rename Dialog */}
        <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename API Key</DialogTitle>
              <DialogDescription>
                Enter a new name for your API key.
              </DialogDescription>
            </DialogHeader>
            <Input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder='Enter new name'
            />
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setIsRenameDialogOpen(false)}
                disabled={isRenamingApiKey}
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  renameApiKey({
                    id: selectedKey?._id,
                    name: newKeyName?.trim(),
                  })
                }
                disabled={isRenamingApiKey || !newKeyName?.trim()}
              >
                {isRenamingApiKey ? (
                  <Loader2 className='h-4 w-4 animate-spin mr-2' />
                ) : null}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
