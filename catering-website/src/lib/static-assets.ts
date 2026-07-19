import { resolveCateringImageDisplayUrl } from "@/lib/catering-api";

/**
 * R2 keys for static imagery (formerly images.unsplash.com).
 * Upload: `npm run upload:static-assets` in catering-backend.
 */
export const STATIC_IMAGE_KEYS = {
  home: {
    hero: "images/home/hero-fallback.jpg",
    stats: "images/home/stats-bg.jpg",
    testimonial: "images/home/testimonial.jpg",
    blogPreview: "images/home/blog-preview.jpg",
  },
  auth: {
    panelBg: "images/static/auth-panel-bg.jpg",
    avatar1: "images/static/auth-avatar-1.jpg",
    avatar2: "images/static/auth-avatar-2.jpg",
    avatar3: "images/static/auth-avatar-3.jpg",
  },
  blog: {
    fallbackMd: "images/static/blog-fallback-md.jpg",
    fallbackLg: "images/static/blog-fallback-lg.jpg",
  },
} as const;

function cdn(key: string): string {
  return resolveCateringImageDisplayUrl(key);
}

export const HOME_IMAGE_KEYS = {
  hero: STATIC_IMAGE_KEYS.home.hero,
  stats: STATIC_IMAGE_KEYS.home.stats,
  testimonial: STATIC_IMAGE_KEYS.home.testimonial,
  blog: STATIC_IMAGE_KEYS.home.blogPreview,
} as const;

export const HOME_FALLBACK_HERO_SRC = cdn(HOME_IMAGE_KEYS.hero);

export const HOME_IMAGES = {
  hero: cdn(HOME_IMAGE_KEYS.hero),
  stats: cdn(HOME_IMAGE_KEYS.stats),
  testimonial: cdn(HOME_IMAGE_KEYS.testimonial),
  blog: cdn(HOME_IMAGE_KEYS.blog),
} as const;

export const AUTH_IMAGES = {
  panelBg: cdn(STATIC_IMAGE_KEYS.auth.panelBg),
  avatar1: cdn(STATIC_IMAGE_KEYS.auth.avatar1),
  avatar2: cdn(STATIC_IMAGE_KEYS.auth.avatar2),
  avatar3: cdn(STATIC_IMAGE_KEYS.auth.avatar3),
} as const;

export const BLOG_IMAGES = {
  fallbackMd: cdn(STATIC_IMAGE_KEYS.blog.fallbackMd),
  fallbackLg: cdn(STATIC_IMAGE_KEYS.blog.fallbackLg),
} as const;
