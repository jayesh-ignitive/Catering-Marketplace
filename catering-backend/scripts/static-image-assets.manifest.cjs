/**
 * All hardcoded Unsplash sources → R2 keys under images/home/* and images/static/*.
 * Used by scripts/upload-static-assets.cjs (and upload-home-assets.cjs).
 *
 * @typedef {{ id: string, key: string, source: string, contentType: string, usedIn: string }} StaticImageAsset
 */

/** @type {StaticImageAsset[]} */
const STATIC_IMAGE_ASSETS = [
  // —— Home (catering-website/src/lib/home-assets.ts) ——
  {
    id: "home-hero-fallback",
    key: "images/home/hero-fallback.jpg",
    source:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1400&q=80",
    contentType: "image/jpeg",
    usedIn: "Home hero fallback",
  },
  {
    id: "home-stats-bg",
    key: "images/home/stats-bg.jpg",
    source:
      "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=960&q=80",
    contentType: "image/jpeg",
    usedIn: "Home trust/stats section",
  },
  {
    id: "home-testimonial",
    key: "images/home/testimonial.jpg",
    source:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80",
    contentType: "image/jpeg",
    usedIn: "Home testimonial card",
  },
  {
    id: "home-blog-preview",
    key: "images/home/blog-preview.jpg",
    source:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=256&q=80",
    contentType: "image/jpeg",
    usedIn: "Home blog teaser thumbnails",
  },

  // —— Auth / onboarding shells ——
  {
    id: "auth-panel-bg",
    key: "images/static/auth-panel-bg.jpg",
    source:
      "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80",
    contentType: "image/jpeg",
    usedIn: "PartnerOnboardingAuthShell, BusinessOnboardingShell (panel)",
  },
  {
    id: "auth-avatar-1",
    key: "images/static/auth-avatar-1.jpg",
    source:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    contentType: "image/jpeg",
    usedIn: "Auth/onboarding decorative avatars",
  },
  {
    id: "auth-avatar-2",
    key: "images/static/auth-avatar-2.jpg",
    source:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
    contentType: "image/jpeg",
    usedIn: "Auth/onboarding decorative avatars",
  },
  {
    id: "auth-avatar-3",
    key: "images/static/auth-avatar-3.jpg",
    source:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    contentType: "image/jpeg",
    usedIn: "Auth/onboarding decorative avatars",
  },

  // —— Blog fallbacks ——
  {
    id: "blog-fallback-md",
    key: "images/static/blog-fallback-md.jpg",
    source:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    contentType: "image/jpeg",
    usedIn: "BlogPageContent listing cards",
  },
  {
    id: "blog-fallback-lg",
    key: "images/static/blog-fallback-lg.jpg",
    source:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1600&q=85",
    contentType: "image/jpeg",
    usedIn: "BlogArticleContent hero",
  },
];

module.exports = { STATIC_IMAGE_ASSETS };
