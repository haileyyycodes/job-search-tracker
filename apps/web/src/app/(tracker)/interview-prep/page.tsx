"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopBar } from "@/components/tracker/TopBar";
import { InterviewPrepView } from "@/components/tracker/InterviewPrepView";
import { InterviewPrepCategoryView } from "@/components/tracker/InterviewPrepCategoryView";
import { useTrackerData } from "@/lib/useTrackerData";

export default function InterviewPrepPage() {
  return (
    <Suspense fallback={null}>
      <InterviewPrepPageContent />
    </Suspense>
  );
}

function InterviewPrepPageContent() {
  const data = useTrackerData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get("category");

  if (category) {
    return (
      <InterviewPrepCategoryView
        categorySlug={category}
        questions={data.interviewPrepQuestions.filter((q) => q.category === category)}
        onBack={() => router.push("/interview-prep")}
        onAddQuestion={data.addInterviewPrepQuestion}
        onEditQuestion={data.editInterviewPrepQuestion}
        onDeleteQuestion={data.deleteInterviewPrepQuestion}
      />
    );
  }

  return (
    <>
      <TopBar title="Interview Prep" subtitle="Store commonly asked questions and pre-write your answers." />
      <InterviewPrepView
        questions={data.interviewPrepQuestions}
        onSelectCategory={(slug) => router.push(`/interview-prep?category=${slug}`)}
      />
    </>
  );
}
