import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/feed', '/profile', '/notifications', '/chat', '/api/'],
    },
    sitemap: 'https://www.soplantila.my.id/sitemap.xml',
  };
}
