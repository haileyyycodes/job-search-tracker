/**
 * Fixed set of interview-prep categories. Not user-manageable (yet) — adding
 * a new one is a code change here (plus, optionally, seed questions in
 * dataSource/seed.ts). Question storage itself is fully dynamic per category.
 */
export interface InterviewPrepCategoryMeta {
  slug: string;
  label: string;
  description: string;
}

export const INTERVIEW_PREP_CATEGORIES: InterviewPrepCategoryMeta[] = [
  {
    slug: "behavioral",
    label: "Behavioral",
    description: "Ownership, collaboration, conflict, and leadership stories.",
  },
  {
    slug: "recruiter_screening",
    label: "Recruiter Screening",
    description: "Early-stage logistics, motivation, and fit questions.",
  },
];

export function interviewPrepCategory(slug: string): InterviewPrepCategoryMeta | undefined {
  return INTERVIEW_PREP_CATEGORIES.find((c) => c.slug === slug);
}
