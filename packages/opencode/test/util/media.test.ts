import { describe, expect, test } from "bun:test"
import { isImageAttachment, isMedia, isPdfAttachment, sniffAttachmentMime } from "../../src/util/media"

const FALLBACK = "application/octet-stream"

const bytes = (...values: number[]) => new Uint8Array(values)

// Builds a RIFF container header: "RIFF" + 4 size bytes + 4-byte form type.
const riff = (form: string) => bytes(0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, ...Buffer.from(form, "ascii"))

describe("util.media", () => {
  describe("sniffAttachmentMime", () => {
    test("detects png", () => {
      expect(sniffAttachmentMime(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00), FALLBACK)).toBe("image/png")
    })

    test("detects jpeg", () => {
      expect(sniffAttachmentMime(bytes(0xff, 0xd8, 0xff, 0xe0), FALLBACK)).toBe("image/jpeg")
    })

    test("detects gif", () => {
      expect(sniffAttachmentMime(Buffer.from("GIF89a"), FALLBACK)).toBe("image/gif")
      expect(sniffAttachmentMime(Buffer.from("GIF87a"), FALLBACK)).toBe("image/gif")
    })

    test("detects bmp", () => {
      expect(sniffAttachmentMime(Buffer.from("BM\x00\x00"), FALLBACK)).toBe("image/bmp")
    })

    test("detects pdf", () => {
      expect(sniffAttachmentMime(Buffer.from("%PDF-1.7\n"), FALLBACK)).toBe("application/pdf")
    })

    test("detects webp only when both RIFF and WEBP markers are present", () => {
      expect(sniffAttachmentMime(riff("WEBP"), FALLBACK)).toBe("image/webp")
      expect(sniffAttachmentMime(riff("WAVE"), FALLBACK)).toBe(FALLBACK)
      // RIFF header without enough bytes to reach the form type
      expect(sniffAttachmentMime(bytes(0x52, 0x49, 0x46, 0x46), FALLBACK)).toBe(FALLBACK)
    })

    test("returns fallback for empty input", () => {
      expect(sniffAttachmentMime(bytes(), FALLBACK)).toBe(FALLBACK)
    })

    test("returns fallback for truncated signatures", () => {
      expect(sniffAttachmentMime(bytes(0x89, 0x50, 0x4e), FALLBACK)).toBe(FALLBACK)
      expect(sniffAttachmentMime(bytes(0xff, 0xd8), FALLBACK)).toBe(FALLBACK)
      expect(sniffAttachmentMime(Buffer.from("%PDF"), FALLBACK)).toBe(FALLBACK)
    })

    test("returns fallback for unknown content", () => {
      expect(sniffAttachmentMime(Buffer.from("hello world"), "text/plain")).toBe("text/plain")
    })

    test("ignores trailing bytes after a signature", () => {
      const png = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...Array.from({ length: 64 }, () => 0xab))
      expect(sniffAttachmentMime(png, FALLBACK)).toBe("image/png")
    })
  })

  describe("mime predicates", () => {
    test("isPdfAttachment", () => {
      expect(isPdfAttachment("application/pdf")).toBe(true)
      expect(isPdfAttachment("image/png")).toBe(false)
    })

    test("isMedia", () => {
      expect(isMedia("image/png")).toBe(true)
      expect(isMedia("application/pdf")).toBe(true)
      expect(isMedia("text/plain")).toBe(false)
    })

    test("isImageAttachment excludes svg and fastbidsheet", () => {
      expect(isImageAttachment("image/png")).toBe(true)
      expect(isImageAttachment("image/svg+xml")).toBe(false)
      expect(isImageAttachment("image/vnd.fastbidsheet")).toBe(false)
      expect(isImageAttachment("application/pdf")).toBe(false)
    })
  })
})
