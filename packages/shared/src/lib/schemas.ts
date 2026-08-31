import { z } from "zod";
import type { Application, Company, Contact, Goals, NetworkingEvent } from "./types";

/**
 * Zod schemas mirroring types.ts, used to validate data read back from
 * localStorage. Storage is same-origin-writable and survives app updates, so
 * nothing read from it is trusted to match the current types.
 */

const applicationStatusSchema = z.enum([
  "todo",
  "applied",
  "interviewing",
  "offer_extended",
  "offer_accepted",
  "offer_declined",
  "rejected_no_interview",
  "rejected_after_interview",
  "ghosted",
  "withdrawn",
]);

const statusHistoryEntrySchema = z.object({
  status: applicationStatusSchema,
  at: z.string(),
});

const interviewTypeSchema = z.enum([
  "Recruiter Screen",
  "Technical Screen",
  "Technical Interview",
  "Behavioral",
  "Hiring Manager",
  "Panel",
  "Other",
]);

const interviewStyleSchema = z.enum(["LeetCode", "Whiteboarding", "Mixture", "Other"]);

const interviewSchema = z.object({
  id: z.number(),
  type: interviewTypeSchema,
  date: z.string(),
  style: interviewStyleSchema.optional(),
  categories: z.array(z.string()).optional(),
  questionsAsked: z.string().optional(),
  notes: z.string(),
});

const followUpSchema = z.object({
  id: z.number(),
  date: z.string(),
  contactId: z.number(),
  notes: z.string(),
});

const feedbackSchema = z.object({
  text: z.string(),
  date: z.string(),
});

const workArrangementSchema = z.enum(["onsite", "remote", "hybrid"]);

const resumeTypeSchema = z.enum(["untailored", "tailored"]);

export const applicationSchema: z.ZodType<Application> = z.object({
  id: z.number(),
  companyId: z.number(),
  role: z.string(),
  dateApplied: z.string(),
  link: z.string(),
  jobDescription: z.string(),
  referral: z.boolean(),
  referredByContactId: z.number().optional(),
  resumeType: resumeTypeSchema,
  resumeText: z.string().optional(),
  coverLetterSubmitted: z.boolean(),
  coverLetterText: z.string().optional(),
  notes: z.string(),
  status: applicationStatusSchema,
  logo: z.string(),
  statusHistory: z.array(statusHistoryEntrySchema),
  interviews: z.array(interviewSchema),
  followUps: z.array(followUpSchema),
  feedback: feedbackSchema.optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  workArrangement: workArrangementSchema.optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

const companyStatusSchema = z.enum(["researching", "watching", "applied", "not_pursuing"]);

export const companySchema: z.ZodType<Company> = z.object({
  id: z.number(),
  name: z.string(),
  isTarget: z.boolean(),
  status: companyStatusSchema,
  industry: z.string().optional(),
  website: z.string().optional(),
  locations: z.array(z.object({ city: z.string(), state: z.string() })),
  notes: z.string(),
});

export const contactSchema: z.ZodType<Contact> = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  linkedInUrl: z.string().optional(),
  website: z.string().optional(),
  companyId: z.number().optional(),
  role: z.string().optional(),
  relationshipTier: z.enum(["core", "extended", "dormant"]).optional(),
  notes: z.string(),
});

export const networkingEventSchema: z.ZodType<NetworkingEvent> = z.object({
  id: z.number(),
  contactIds: z.array(z.number()),
  type: z.string(),
  date: z.string(),
  applicationId: z.number().optional(),
  notes: z.string(),
});

export const goalsSchema: z.ZodType<Goals> = z.object({
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  applicationsPerWeekTarget: z.number().optional(),
  targetOfferDate: z.string().optional(),
});

export const interviewCategorySchema = z.string();

// Warn once per storage key so per-render sanitization doesn't flood the console.
const warnedKeys = new Set<string>();

function warnOnce(key: string, message: string) {
  if (warnedKeys.has(key)) return;
  warnedKeys.add(key);
  console.warn(`localStorage "${key}": ${message}`);
}

/**
 * Builds a sanitizer for an array collection: keeps records that match the
 * schema, drops ones that don't, and falls back to `fallback` wholesale when
 * the stored value isn't an array at all.
 */
export function salvageArray<T>(itemSchema: z.ZodType<T>, fallback: T[]) {
  return (key: string, parsed: unknown): T[] => {
    if (!Array.isArray(parsed)) {
      warnOnce(key, "stored value is not an array; restoring initial data");
      return fallback;
    }
    const valid: T[] = [];
    let dropped = 0;
    for (const item of parsed) {
      const result = itemSchema.safeParse(item);
      if (result.success) valid.push(result.data);
      else dropped++;
    }
    if (dropped > 0) warnOnce(key, `dropped ${dropped} record(s) that failed validation`);
    return valid;
  };
}

/** Builds a sanitizer for a single-object value: schema match or `fallback`. */
export function salvageObject<T>(schema: z.ZodType<T>, fallback: T) {
  return (key: string, parsed: unknown): T => {
    const result = schema.safeParse(parsed);
    if (result.success) return result.data;
    warnOnce(key, "stored value failed validation; restoring initial data");
    return fallback;
  };
}
