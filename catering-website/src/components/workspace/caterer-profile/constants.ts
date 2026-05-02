/** Near-square corners like static `onboarding.html` form controls (minimal rounding). */
export const fieldRadius = "rounded-sm";

/** Reference: neutral borders (#E5E7EB), labels #374151, placeholders #9CA3AF */
export const fieldBase = `block w-full ${fieldRadius} border border-[#E5E7EB] bg-white px-4 py-3.5 text-sm text-[#111827] outline-none ring-0 ring-offset-0 transition-colors placeholder:text-[#9CA3AF] focus:border-brand-red focus:outline-none focus:ring-0`;

export const inputClassName = fieldBase;

export const textareaClassName = `${fieldBase} min-h-[6rem] resize-y`;

export const multiSelectClassName = `${fieldBase} min-h-[250px] cursor-pointer py-2`;

/** Must match backend `WORKSPACE_ABOUT_MIN_LEN` */
export const ABOUT_MIN_LEN = 15;

/** Matches backend gallery `ArrayMaxSize`. */
export const WORKSPACE_GALLERY_MAX = 20;

/** Matches `POST /api/upload/image` multer limit */
export const MAX_GALLERY_UPLOAD_BYTES = 5 * 1024 * 1024;
