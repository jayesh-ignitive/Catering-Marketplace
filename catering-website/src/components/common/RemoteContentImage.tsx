import Image from "next/image";

type RemoteContentImageProps = {
  src: string;
  alt: string;
  className?: string;
  /** Parent must be `position: relative` with a defined size when `fill` is true. */
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  width?: number;
  height?: number;
};

function canUseNextImageOptimizer(src: string): boolean {
  return /^https?:\/\//i.test(src.trim());
}

/**
 * Uses Next.js image optimization (WebP/AVIF, resized) for http(s) URLs.
 * Falls back to native `<img>` for `data:` URLs and other non-remote sources.
 */
export function RemoteContentImage({
  src,
  alt,
  className,
  fill = false,
  sizes,
  priority = false,
  width = 800,
  height = 600,
}: RemoteContentImageProps) {
  const trimmed = src.trim();
  if (!trimmed) return null;

  if (!canUseNextImageOptimizer(trimmed)) {
    return <img src={trimmed} alt={alt} className={className} />;
  }

  if (fill) {
    return (
      <Image
        src={trimmed}
        alt={alt}
        fill
        className={className}
        sizes={sizes ?? "(max-width: 768px) 100vw, 50vw"}
        priority={priority}
      />
    );
  }

  return (
    <Image
      src={trimmed}
      alt={alt}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
      priority={priority}
    />
  );
}
