/**
 * Browser-side image processing for product uploads.
 *
 * - `processProductImage(file)` center-crops the source and produces two
 *   crop variants — 1:1 square (full / zoom view) and 4:5 portrait
 *   (listing card frame) — each encoded in up to three formats:
 *     • JPEG  (always; universal fallback + what we send to the backend)
 *     • WebP  (when the browser can encode it; ~25-35% smaller than JPEG)
 *     • AVIF  (when supported; ~50% smaller than JPEG at similar quality)
 * - Each result carries a SHA-256 content hash so callers can reject
 *   duplicate uploads.
 * - `dataUrlToFile` rehydrates the square JPEG variant into a File so it
 *   can be sent to the backend `imageFile` multipart slot unchanged.
 */

export type ImageVariant = {
  jpeg: string;          // dataURL, always present
  webp?: string;         // dataURL when encoder is available
  avif?: string;         // dataURL when encoder is available
};

export type ProcessedImage = {
  hash: string;
  full: ImageVariant;    // 1200x1200
  listing: ImageVariant; // 800x1000
  name: string;
  type: string;
};

const FULL_SIZE = 1200;
const LISTING_W = 800;
const LISTING_H = 1000;
const Q_JPEG = 0.9;
const Q_WEBP = 0.82;
const Q_AVIF = 0.6;

async function sha256(buf: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function loadBitmap(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/**
 * Encode a canvas in the requested MIME. Browsers that don't support
 * the format silently fall back to PNG — we detect that by comparing
 * the resulting blob type and return undefined so callers skip it.
 */
function encode(canvas: HTMLCanvasElement, type: string, quality: number): Promise<string | undefined> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob(
        async (blob) => {
          if (!blob || blob.type !== type) return resolve(undefined);
          try { resolve(await blobToDataUrl(blob)); }
          catch { resolve(undefined); }
        },
        type,
        quality,
      );
    } catch {
      resolve(undefined);
    }
  });
}

async function canvasToVariant(canvas: HTMLCanvasElement): Promise<ImageVariant> {
  const [jpegBlob, webp, avif] = await Promise.all([
    encode(canvas, "image/jpeg", Q_JPEG),
    encode(canvas, "image/webp", Q_WEBP),
    encode(canvas, "image/avif", Q_AVIF),
  ]);
  // JPEG is universally supported; toDataURL fallback covers the rare
  // case where toBlob is restricted (e.g. tainted canvas — not us).
  const jpeg = jpegBlob ?? canvas.toDataURL("image/jpeg", Q_JPEG);
  return { jpeg, webp, avif };
}

function cropToCanvas(img: HTMLImageElement, targetW: number, targetH: number): HTMLCanvasElement {
  const targetRatio = targetW / targetH;
  const srcRatio = img.width / img.height;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (srcRatio > targetRatio) {
    sw = img.height * targetRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / targetRatio;
    sy = (img.height - sh) / 2;
  }
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
  return canvas;
}

export async function processProductImage(file: File): Promise<ProcessedImage> {
  const buf = await file.arrayBuffer();
  const hash = await sha256(buf);
  const img = await loadBitmap(file);
  const fullCanvas = cropToCanvas(img, FULL_SIZE, FULL_SIZE);
  const listCanvas = cropToCanvas(img, LISTING_W, LISTING_H);
  const [full, listing] = await Promise.all([
    canvasToVariant(fullCanvas),
    canvasToVariant(listCanvas),
  ]);
  return { hash, full, listing, name: file.name, type: "image/jpeg" };
}

export function dataUrlToFile(dataUrl: string, filename: string): File {
  const [meta, b64] = dataUrl.split(",");
  const mime = /data:(.*?);base64/.exec(meta)?.[1] ?? "image/jpeg";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new File([arr], filename, { type: mime });
}

/** Source descriptor consumed by `SmartImage` to render a `<picture>`. */
export type ImageSource = { type: string; srcSet: string };

/**
 * Build the modern-format `<source>` list from a variant set.
 * AVIF is listed first (browsers pick the first supported one),
 * then WebP. Returns undefined when only JPEG is available.
 */
export function buildSources(v: { jpeg?: string; webp?: string; avif?: string } | undefined): ImageSource[] | undefined {
  if (!v) return undefined;
  const out: ImageSource[] = [];
  if (v.avif) out.push({ type: "image/avif", srcSet: v.avif });
  if (v.webp) out.push({ type: "image/webp", srcSet: v.webp });
  return out.length ? out : undefined;
}