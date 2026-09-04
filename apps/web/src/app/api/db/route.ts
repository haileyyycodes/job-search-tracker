import { NextResponse } from "next/server";
import type { ApplicationStatus, Feedback } from "@/lib/types";
import {
  RestrictedDeleteError,
  type DataSource,
  type DsApplication,
  type DsCompany,
  type DsContact,
  type DsElevatorPitchVersion,
  type DsGoals,
  type DsInterviewPrepQuestion,
  type DsNetworkingEvent,
  type DsUserProfile,
  type NewApplication,
  type NewCompany,
  type NewContact,
  type NewElevatorPitchVersion,
  type NewFollowUp,
  type NewInterview,
  type NewInterviewPrepQuestion,
  type NewNetworkingEvent,
} from "@/lib/dataSource/types";
import { getDataSource } from "../../../server/sqlite/db";

/**
 * One handler per DataSource method, namespaced e.g. "applications:list" —
 * mirrors the old Electron IPC channel names 1:1 so HttpDataSource (the
 * client side of this boundary, in packages/shared) barely differs from the
 * ElectronDataSource it replaced. Object.keys(CHANNELS) doubles as this
 * endpoint's allow-list: an unrecognized channel in the request body is
 * rejected below, never passed through to `ds` as an arbitrary method call.
 */
export const CHANNELS: Record<string, (ds: DataSource, args: unknown[]) => Promise<unknown>> = {
  "applications:list": (ds) => ds.getApplications(),
  "applications:create": (ds, [app]) => ds.createApplication(app as NewApplication),
  "applications:edit": (ds, [app]) => ds.editApplication(app as DsApplication),
  "applications:updateStatus": (ds, [id, status, at]) =>
    ds.updateApplicationStatus(id as number, status as ApplicationStatus, at as string),
  "applications:delete": (ds, [id]) => ds.deleteApplication(id as number),
  "applications:saveFeedback": (ds, [appId, feedback]) => ds.saveFeedback(appId as number, feedback as Feedback),

  "interviews:log": (ds, [appId, interview]) => ds.logInterview(appId as number, interview as NewInterview),
  "interviews:edit": (ds, [appId, interviewId, updates]) =>
    ds.editInterview(appId as number, interviewId as number, updates as NewInterview),
  "interviews:delete": (ds, [appId, interviewId]) => ds.deleteInterview(appId as number, interviewId as number),

  "followUps:log": (ds, [appId, followUp]) => ds.logFollowUp(appId as number, followUp as NewFollowUp),
  "followUps:delete": (ds, [appId, followUpId]) => ds.deleteFollowUp(appId as number, followUpId as number),

  "companies:list": (ds) => ds.getCompanies(),
  "companies:create": (ds, [company]) => ds.createCompany(company as NewCompany),
  "companies:edit": (ds, [company]) => ds.editCompany(company as DsCompany),
  "companies:delete": (ds, [id]) => ds.deleteCompany(id as number),
  "companies:toggleTarget": (ds, [id]) => ds.toggleTarget(id as number),

  "contacts:list": (ds) => ds.getContacts(),
  "contacts:create": (ds, [contact]) => ds.createContact(contact as NewContact),
  "contacts:edit": (ds, [contact]) => ds.editContact(contact as DsContact),
  "contacts:delete": (ds, [id]) => ds.deleteContact(id as number),

  "networkingEvents:list": (ds) => ds.getNetworkingEvents(),
  "networkingEvents:add": (ds, [event]) => ds.addNetworkingEvent(event as NewNetworkingEvent),
  "networkingEvents:edit": (ds, [event]) => ds.editNetworkingEvent(event as DsNetworkingEvent),
  "networkingEvents:delete": (ds, [id]) => ds.deleteNetworkingEvent(id as number),

  "goals:get": (ds) => ds.getGoals(),
  "goals:update": (ds, [goals]) => ds.updateGoals(goals as DsGoals),

  "userProfile:get": (ds) => ds.getUserProfile(),
  "userProfile:update": (ds, [profile]) => ds.updateUserProfile(profile as DsUserProfile),

  "interviewCategories:list": (ds) => ds.getInterviewCategories(),
  "interviewCategories:add": (ds, [category]) => ds.addInterviewCategory(category as string),

  "interviewPrep:list": (ds) => ds.getInterviewPrepQuestions(),
  "interviewPrep:add": (ds, [question]) => ds.addInterviewPrepQuestion(question as NewInterviewPrepQuestion),
  "interviewPrep:edit": (ds, [question]) => ds.editInterviewPrepQuestion(question as DsInterviewPrepQuestion),
  "interviewPrep:delete": (ds, [id]) => ds.deleteInterviewPrepQuestion(id as number),

  "elevatorPitch:list": (ds) => ds.getElevatorPitchVersions(),
  "elevatorPitch:add": (ds, [version]) => ds.addElevatorPitchVersion(version as NewElevatorPitchVersion),
  "elevatorPitch:edit": (ds, [version]) => ds.editElevatorPitchVersion(version as DsElevatorPitchVersion),
  "elevatorPitch:delete": (ds, [id]) => ds.deleteElevatorPitchVersion(id as number),
};

/** Marker prefix HttpDataSource (packages/shared) looks for to reconstruct RestrictedDeleteError
 * on the client side — a plain fetch response loses the thrown error's type otherwise. */
const RESTRICTED_DELETE_PREFIX = "RESTRICTED_DELETE:";

export async function POST(request: Request) {
  const { channel, args } = (await request.json()) as { channel: string; args: unknown[] };

  const handler = CHANNELS[channel];
  if (!handler) return NextResponse.json({ error: `Unknown channel: ${channel}` }, { status: 400 });

  try {
    const result = await handler(getDataSource(), args ?? []);
    return NextResponse.json({ result });
  } catch (err) {
    if (err instanceof RestrictedDeleteError) {
      return NextResponse.json({ error: `${RESTRICTED_DELETE_PREFIX}${err.message}` }, { status: 409 });
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
