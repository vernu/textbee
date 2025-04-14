import { MetadataRoute } from 'next'
import { Routes } from '@/config/routes'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL

  if (!baseUrl?.includes('textbee.dev')) {
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 1,
      },
    ]
  }

  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}#pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}${Routes.useCases}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}${Routes.quickstart}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },

    {
      url: `${baseUrl}${Routes.login}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}${Routes.register}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}${Routes.dashboard}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}${Routes.contribute}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}${Routes.privacyPolicy}`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}${Routes.termsOfService}`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}${Routes.refundPolicy}`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },

    // {
    //   url: `${baseUrl}/docs`,
    //   lastModified: new Date(),
    //   changeFrequency: 'weekly' as const,
    //   priority: 0.9,
    // },
    // {
    //   url: `${baseUrl}/blog`,
    //   lastModified: new Date(),
    //   changeFrequency: 'weekly' as const,
    //   priority: 0.7,
    // },
  ]

  return routes
}
