'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Download,
  Clock,
  Calendar,
  ArrowDownToLine,
  FileDown,
  Tag,
  Github,
  PackageOpen,
  Info,
  ChevronDown,
  Check,
  ExternalLink,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Skeleton } from '@/components/ui/skeleton'

interface Release {
  id: number
  name: string
  tag_name: string
  published_at: string
  body: string
  html_url: string
  assets: Array<{
    id: number
    name: string
    browser_download_url: string
    size: number
    download_count: number
  }>
  prerelease: boolean
}
export default function DownloadPage() {
  const [releases, setReleases] = useState<Release[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    async function fetchReleases() {
      try {
        const response = await fetch(
          'https://api.github.com/repos/vernu/textbee/releases'
        )
        if (!response.ok) {
          throw new Error('Failed to fetch releases')
        }
        const data = await response.json()
        setReleases(data)
      } catch (err) {
        setError('Failed to load releases. Please try again later.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchReleases()
  }, [])

  // Get the latest stable release (not prerelease)
  const latestRelease = releases.find((release) => !release.prerelease)

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    else return (bytes / 1048576).toFixed(1) + ' MB'
  }

  // Parse markdown lists from release notes
  const parseReleaseNotes = (body: string) => {
    if (!body) return { description: '', changelog: [] }

    const lines = body.split('\n').map((line) => line.trim())

    // Find where the changelog starts (usually after ## Changelog or similar)
    const changelogIndex = lines.findIndex(
      (line) =>
        line.startsWith('##') &&
        (line.toLowerCase().includes('changelog') ||
          line.toLowerCase().includes('changes') ||
          line.toLowerCase().includes("what's new"))
    )

    let description = ''
    let changelog: string[] = []

    if (changelogIndex > 0) {
      description = lines.slice(0, changelogIndex).join('\n')
      changelog = lines
        .slice(changelogIndex + 1)
        .filter((line) => line.startsWith('-') || line.startsWith('*'))
        .map((line) => line.substring(1).trim())
    } else {
      // If no explicit changelog section, treat list items as changelog
      const listItems = lines.filter(
        (line) => line.startsWith('-') || line.startsWith('*')
      )
      if (listItems.length > 0) {
        changelog = listItems.map((line) => line.substring(1).trim())
        description = lines
          .filter((line) => !line.startsWith('-') && !line.startsWith('*'))
          .join('\n')
      } else {
        description = body
      }
    }

    return { description, changelog }
  }

  return (
    <div className='min-h-screen py-16 px-4'>
      <div className='container mx-auto max-w-5xl'>
        <div className='text-center mb-12'>
          <div className='inline-flex items-center rounded-full border px-3 py-1 text-sm bg-brand-50 dark:bg-brand-950 border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 mb-4'>
            <Download className='h-3.5 w-3.5 mr-2' /> Download TextBee
          </div>
          <h1 className='text-4xl font-bold tracking-tight text-gray-900 dark:text-white'>
            Download TextBee App
          </h1>
          <p className='mt-4 text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto'>
            Transform your Android device into a powerful SMS gateway with our
            easy-to-use application.
          </p>
        </div>

        {/* Latest release section */}
        <div className='mb-16'>
          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden'>
            <div className='p-6 sm:p-8'>
              <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6'>
                <div>
                  <div className='flex items-center gap-2 mb-2'>
                    <Badge className='bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 hover:bg-green-100'>
                      Latest Version
                    </Badge>
                    {latestRelease?.prerelease && (
                      <Badge
                        variant='outline'
                        className='bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
                      >
                        Beta
                      </Badge>
                    )}
                  </div>

                  {loading ? (
                    <Skeleton className='h-8 w-48' />
                  ) : error ? (
                    <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
                      TextBee App
                    </h2>
                  ) : (
                    <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
                      {latestRelease?.name || 'TextBee App'}
                    </h2>
                  )}
                </div>

                {loading ? (
                  <Skeleton className='h-10 w-36' />
                ) : error ? (
                  <Button disabled>Download Unavailable</Button>
                ) : latestRelease?.assets?.length ? (
                  <Button
                    size='lg'
                    className='bg-brand-600 hover:bg-brand-700 text-white'
                    asChild
                  >
                    <Link
                      href={latestRelease.assets[0].browser_download_url}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <ArrowDownToLine className='mr-2 h-5 w-5' />
                      Download Now
                    </Link>
                  </Button>
                ) : (
                  <Button disabled>No Downloads Available</Button>
                )}
              </div>

              {loading ? (
                <div className='space-y-4'>
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-4 w-3/4' />
                </div>
              ) : error ? (
                <div className='text-red-500 dark:text-red-400'>{error}</div>
              ) : latestRelease ? (
                <>
                  <div className='flex flex-wrap gap-4 mb-6 text-sm text-gray-600 dark:text-gray-400'>
                    <div className='flex items-center'>
                      <Tag className='h-4 w-4 mr-1' />
                      <span>Version: {latestRelease.tag_name}</span>
                    </div>
                    <div className='flex items-center'>
                      <Calendar className='h-4 w-4 mr-1' />
                      <span>
                        Released: {formatDate(latestRelease.published_at)}
                      </span>
                    </div>
                    {latestRelease.assets?.[0] && (
                      <>
                        <div className='flex items-center'>
                          <FileDown className='h-4 w-4 mr-1' />
                          <span>
                            Size: {formatFileSize(latestRelease.assets[0].size)}
                          </span>
                        </div>
                        <div className='flex items-center'>
                          <Download className='h-4 w-4 mr-1' />
                          <span>
                            Downloads:{' '}
                            {latestRelease.assets[0].download_count.toLocaleString()}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Release details */}
                  <div className='space-y-4'>
                    {(() => {
                      const { description, changelog } = parseReleaseNotes(
                        latestRelease.body || ''
                      )
                      return (
                        <>
                          {description && (
                            <div className='text-gray-700 dark:text-gray-300'>
                              {description.split('\n').map((line, i) => (
                                <p key={i} className='mb-2'>
                                  {line}
                                </p>
                              ))}
                            </div>
                          )}

                          {changelog.length > 0 && (
                            <div>
                              <h3 className='text-lg font-semibold mb-2 text-gray-900 dark:text-white'>
                                What's New:
                              </h3>
                              <ul className='space-y-1 list-disc pl-5 text-gray-600 dark:text-gray-400'>
                                {changelog.map((item, i) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>

                  <div className='mt-6 pt-6 border-t border-gray-200 dark:border-gray-700'>
                    <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
                      <Button variant='outline' size='sm' asChild>
                        <Link
                          href={latestRelease.html_url}
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          <Github className='mr-2 h-4 w-4' />
                          View on GitHub
                        </Link>
                      </Button>
                      <div className='text-sm text-gray-500 dark:text-gray-400'>
                        Compatible with Android 7.0+ devices.
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className='text-gray-600 dark:text-gray-400'>
                  No releases available at this time.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* All releases section */}
        <div>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
              All Releases
            </h2>
            <Button
              variant='outline'
              size='sm'
              asChild
              className='text-gray-600 dark:text-gray-400'
            >
              <Link
                href='https://github.com/vernu/textbee/releases'
                target='_blank'
                rel='noopener noreferrer'
              >
                <ExternalLink className='mr-2 h-4 w-4' />
                View All on GitHub
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className='space-y-4'>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4'
                >
                  <Skeleton className='h-6 w-48 mb-4' />
                  <Skeleton className='h-4 w-full mb-2' />
                  <Skeleton className='h-4 w-3/4' />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
              <div className='text-red-500 dark:text-red-400'>{error}</div>
            </div>
          ) : releases.length === 0 ? (
            <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center'>
              <PackageOpen className='h-12 w-12 mx-auto text-gray-400 mb-4' />
              <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
                No Releases Found
              </h3>
              <p className='text-gray-600 dark:text-gray-400'>
                There are no releases available at this time.
              </p>
            </div>
          ) : (
            <Accordion type='single' collapsible className='space-y-4'>
              {releases.map((release) => (
                <AccordionItem
                  key={release.id}
                  value={release.id.toString()}
                  className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden'
                >
                  <AccordionTrigger className='px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'>
                    <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-left'>
                      <div className='flex items-center gap-2'>
                        <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                          {release.name || release.tag_name}
                        </h3>
                        {release.id === latestRelease?.id && (
                          <Badge className='bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'>
                            Latest
                          </Badge>
                        )}
                        {release.prerelease && (
                          <Badge
                            variant='outline'
                            className='bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
                          >
                            Beta
                          </Badge>
                        )}
                      </div>
                      <div className='text-sm text-gray-500 dark:text-gray-400'>
                        Released on {formatDate(release.published_at)}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className='px-6 pb-6'>
                    <div className='space-y-4'>
                      {/* Release notes */}
                      {(() => {
                        const { description, changelog } = parseReleaseNotes(
                          release.body || ''
                        )
                        return (
                          <>
                            {description && (
                              <div className='text-gray-700 dark:text-gray-300'>
                                {description.split('\n').map((line, i) => (
                                  <p key={i} className='mb-2'>
                                    {line}
                                  </p>
                                ))}
                              </div>
                            )}

                            {changelog.length > 0 && (
                              <div>
                                <h4 className='text-base font-medium mb-2 text-gray-900 dark:text-white'>
                                  Changes:
                                </h4>
                                <ul className='space-y-1 list-disc pl-5 text-gray-600 dark:text-gray-400'>
                                  {changelog.map((item, i) => (
                                    <li key={i}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </>
                        )
                      })()}

                      {/* Download assets */}
                      {release.assets.length > 0 && (
                        <div className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
                          <h4 className='text-base font-medium mb-3 text-gray-900 dark:text-white'>
                            Downloads:
                          </h4>
                          <div className='space-y-2'>
                            {release.assets.map((asset) => (
                              <div
                                key={asset.id}
                                className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-md'
                              >
                                <div className='flex items-center'>
                                  <FileDown className='h-4 w-4 text-gray-500 dark:text-gray-400 mr-2' />
                                  <span className='text-sm text-gray-700 dark:text-gray-300'>
                                    {asset.name}
                                  </span>
                                </div>
                                <div className='flex items-center gap-4'>
                                  <span className='text-xs text-gray-500 dark:text-gray-400'>
                                    {formatFileSize(asset.size)}
                                  </span>
                                  <span className='text-xs text-gray-500 dark:text-gray-400'>
                                    <Download className='inline h-3 w-3 mr-1' />
                                    {asset.download_count.toLocaleString()}
                                  </span>
                                  <Button
                                    size='sm'
                                    variant='outline'
                                    className='text-xs'
                                    asChild
                                  >
                                    <Link
                                      href={asset.browser_download_url}
                                      target='_blank'
                                      rel='noopener noreferrer'
                                    >
                                      <Download className='mr-1 h-3 w-3' />
                                      Download
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className='flex justify-end'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='text-gray-600 dark:text-gray-400'
                          asChild
                        >
                          <Link
                            href={release.html_url}
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                            <Github className='mr-2 h-4 w-4' />
                            View Release
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>

        {/* Requirements section */}
        <div className='mt-16 bg-gray-50 dark:bg-gray-900 rounded-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700'>
          <div className='flex items-start'>
            <Info className='h-5 w-5 text-brand-600 dark:text-brand-400 mt-0.5 mr-3 flex-shrink-0' />
            <div>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                System Requirements
              </h3>
              <ul className='space-y-2 text-gray-600 dark:text-gray-400'>
                <li className='flex items-start'>
                  <Check className='h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0' />
                  <span>Android 7.0 (Nougat) or higher</span>
                </li>
                <li className='flex items-start'>
                  <Check className='h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0' />
                  <span>SMS capability on the Android device</span>
                </li>
                <li className='flex items-start'>
                  <Check className='h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0' />
                  <span>Internet connection for API communication</span>
                </li>
                <li className='flex items-start'>
                  <Check className='h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0' />
                  <span>
                    Battery optimization disabled for background operation
                    (recommended)
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
