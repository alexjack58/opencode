type MagicBytes = {
  readonly offset: number
  readonly bytes: readonly number[]
}

type MimeSignature = {
  readonly mime: string
  readonly magic: readonly MagicBytes[]
}

// Ordered list of file signatures used to sniff attachment MIME types. Every
// `magic` entry for a signature must match at its offset for the signature to apply.
const SIGNATURES: readonly MimeSignature[] = [
  { mime: "image/png", magic: [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }] },
  { mime: "image/jpeg", magic: [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }] },
  { mime: "image/gif", magic: [{ offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }] },
  { mime: "image/bmp", magic: [{ offset: 0, bytes: [0x42, 0x4d] }] },
  { mime: "application/pdf", magic: [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] }] },
  {
    mime: "image/webp",
    magic: [
      { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
      { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
    ],
  },
]

const matchesMagic = (bytes: Uint8Array, magic: MagicBytes) =>
  magic.bytes.every((value, index) => bytes[magic.offset + index] === value)

const matchesSignature = (bytes: Uint8Array, signature: MimeSignature) =>
  signature.magic.every((magic) => matchesMagic(bytes, magic))

export function isPdfAttachment(mime: string) {
  return mime === "application/pdf"
}

export function isMedia(mime: string) {
  return mime.startsWith("image/") || isPdfAttachment(mime)
}

export function isImageAttachment(mime: string) {
  return mime.startsWith("image/") && mime !== "image/svg+xml" && mime !== "image/vnd.fastbidsheet"
}

export function sniffAttachmentMime(bytes: Uint8Array, fallback: string) {
  return SIGNATURES.find((signature) => matchesSignature(bytes, signature))?.mime ?? fallback
}
