import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://estrategic-adv.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Bloqueia o Google de tentar indexar páginas do dashboard (são protegidas por login)
        disallow: '/dashboard/',
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
