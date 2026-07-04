import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ImageSource } from "@/lib/image-utils";

const FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><rect width='80' height='80' fill='%23eef0f3'/><path d='M14 60l18-22 14 16 8-10 12 16H14z' fill='%23c7ccd3'/><circle cx='26' cy='28' r='6' fill='%23c7ccd3'/></svg>",
  );

type Props = {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  hoverScale?: boolean;
  eager?: boolean;
  fit?: "cover" | "contain";
  sizes?: string;
  srcSet?: string;
  /** Modern-format <source> entries (AVIF / WebP). When provided, the
   *  image is wrapped in a <picture> so the browser picks the best
   *  supported format and falls back to the JPEG `src`. */
  sources?: ImageSource[];
};

/** <img> with a shimmer skeleton while loading and a graceful SVG fallback on error. */
export function SmartImage({
  src,
  alt,
  className,
  wrapperClassName,
  hoverScale = false,
  eager = false,
  fit = "cover",
  sizes,
  srcSet,
  sources,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const imgEl = (
    <img
      src={errored ? FALLBACK : src}
      srcSet={errored ? undefined : srcSet}
      sizes={sizes}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      decoding="async"
      draggable={false}
      onLoad={() => setLoaded(true)}
      onError={() => {
        setErrored(true);
        setLoaded(true);
      }}
      className={cn(
        "h-full w-full transition-opacity duration-500",
        fit === "contain" ? "object-contain" : "object-cover",
        loaded ? "opacity-100" : "opacity-0",
        hoverScale && "transition-transform duration-700 ease-out group-hover:scale-[1.07]",
        className,
      )}
    />
  );

  return (
    <div className={cn("overflow-hidden bg-secondary", wrapperClassName?.includes("absolute") ? "" : "relative", wrapperClassName)}>
      {!loaded && (
        <div
          aria-hidden="true"
          className="smart-shimmer absolute inset-0"
        />
      )}
      {sources && sources.length > 0 && !errored ? (
        <picture className="block h-full w-full">
          {sources.map((s) => (
            <source key={s.type} type={s.type} srcSet={s.srcSet} sizes={sizes} />
          ))}
          {imgEl}
        </picture>
      ) : (
        imgEl
      )}
    </div>
  );
}