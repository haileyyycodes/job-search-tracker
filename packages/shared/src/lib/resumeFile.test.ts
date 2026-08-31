import { describe, expect, it } from "vitest";
import {
  MAX_RESUME_BYTES,
  assertValidResumeBytes,
  base64ToBytes,
  bytesToBase64,
  detectResumeSignature,
  formatFileSize,
  sanitizeResumeName,
} from "./resumeFile";

const bytes = (...nums: number[]) => new Uint8Array(nums);
const PDF = bytes(0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34); // %PDF-1.4
const DOCX = bytes(0x50, 0x4b, 0x03, 0x04, 0x14, 0x00); // PK..
const DOC = bytes(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1); // OLE2

describe("detectResumeSignature", () => {
  it("recognizes PDF, DOCX, and legacy DOC by magic bytes", () => {
    expect(detectResumeSignature(PDF)).toBe("pdf");
    expect(detectResumeSignature(DOCX)).toBe("docx");
    expect(detectResumeSignature(DOC)).toBe("doc");
  });

  it("returns null for anything else (e.g. HTML masquerading as .pdf)", () => {
    expect(detectResumeSignature(new TextEncoder().encode("<html></html>"))).toBeNull();
    expect(detectResumeSignature(bytes())).toBeNull();
  });
});

describe("assertValidResumeBytes", () => {
  it("accepts a valid signature and returns its kind", () => {
    expect(assertValidResumeBytes(PDF)).toBe("pdf");
  });

  it("rejects empty, oversized, and unrecognized content", () => {
    expect(() => assertValidResumeBytes(bytes())).toThrow(/empty/i);
    expect(() => assertValidResumeBytes(new Uint8Array(MAX_RESUME_BYTES + 1).fill(0x25))).toThrow(/too large/i);
    expect(() => assertValidResumeBytes(new TextEncoder().encode("nope"))).toThrow(/valid PDF or Word/i);
  });
});

describe("sanitizeResumeName", () => {
  it("strips path segments and control chars and forces the detected extension", () => {
    expect(sanitizeResumeName("../../etc/passwd", "pdf")).toBe("passwd.pdf");
    expect(sanitizeResumeName("resume.pdf.exe", "pdf")).toBe("resume pdf.pdf");
    expect(sanitizeResumeName("C:\\Users\\me\\CV.docx", "docx")).toBe("CV.docx");
  });

  it("keeps internal spaces and unicode but re-appends the right extension", () => {
    expect(sanitizeResumeName("my resume.DOCX", "docx")).toBe("my resume.docx");
  });

  it("falls back to 'resume' when nothing usable is left", () => {
    expect(sanitizeResumeName("   ", "pdf")).toBe("resume.pdf");
    expect(sanitizeResumeName("....", "doc")).toBe("resume.doc");
  });

  it("caps very long names", () => {
    const out = sanitizeResumeName("a".repeat(500), "pdf");
    expect(out.length).toBeLessThanOrEqual(104);
    expect(out.endsWith(".pdf")).toBe(true);
  });
});

describe("formatFileSize", () => {
  it("scales bytes / KB / MB", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(1_500_000)).toBe("1.4 MB");
  });
});

describe("base64 round-trip", () => {
  it("survives a large binary payload unchanged", () => {
    const original = new Uint8Array(200_000);
    for (let i = 0; i < original.length; i++) original[i] = (i * 37) % 256;
    expect(base64ToBytes(bytesToBase64(original))).toEqual(original);
  });
});
