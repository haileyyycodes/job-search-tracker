"use client";

import { useRouter } from "next/navigation";
import { ElevatorPitchView } from "@/components/tracker/ElevatorPitchView";
import { useTrackerData } from "@/lib/useTrackerData";

export default function ElevatorPitchPage() {
  const data = useTrackerData();
  const router = useRouter();

  return (
    <ElevatorPitchView
      versions={data.elevatorPitchVersions}
      interviewPrepQuestions={data.interviewPrepQuestions}
      onBack={() => router.push("/interview-prep")}
      onAddVersion={data.addElevatorPitchVersion}
      onEditVersion={data.editElevatorPitchVersion}
      onDeleteVersion={data.deleteElevatorPitchVersion}
    />
  );
}
