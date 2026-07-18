import { z } from "zod";
import type { Application, Company, Contact, Goals, Task } from "./types";

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
  id: z.string(),
  type: interviewTypeSchema,
  date: z.string(),
  style: interviewStyleSchema.optional(),
  categories: z.array(z.string()).optional(),
  questionsAsked: z.string().optional(),
  notes: z.string(),
});

const followUpSchema = z.object({
  id: z.string(),
  date: z.string(),
  contactId: z.string(),
  notes: z.string(),
});

const feedbackSchema = z.object({
  text: z.string(),
  date: z.string(),
});

const workArrangementSchema = z.enum(["onsite", "remote", "hybrid"]);

export const applicationSchema: z.ZodType<Application> = z.object({
  id: z.string(),
  companyId: z.string(),
  role: z.string(),
  dateApplied: z.string(),
  link: z.string(),
  jobDescription: z.string(),
  referral: z.boolean(),
  referredByContactId: z.string().optional(),
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
  id: z.string(),
  name: z.string(),
  isTarget: z.boolean(),
  status: companyStatusSchema,
  industry: z.string().optional(),
  website: z.string().optional(),
  locations: z.array(z.object({ city: z.string(), state: z.string() })),
  notes: z.string(),
});

export const contactSchema: z.ZodType<Contact> = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  linkedInUrl: z.string().optional(),
  website: z.string().optional(),
  companyId: z.string().optional(),
  role: z.string().optional(),
  notes: z.string(),
});

export const networkingEventSchema = z.object({
  id: z.string(),
  contactIds: z.array(z.string()),
  type: z.string(),
  date: z.string(),
  applicationId: z.string().optional(),
  notes: z.string(),
});

const reminderRuleSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("manual") }),
  z.object({ type: z.literal("days_after_applied"), days: z.number() }),
]);

export const taskSchema: z.ZodType<Task> = z.object({
  id: z.string(),
  applicationId: z.string(),
  dueDate: z.string(),
  note: z.string(),
  status: z.enum(["active", "dismissed"]),
  reminderRule: reminderRuleSchema.optional(),
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
