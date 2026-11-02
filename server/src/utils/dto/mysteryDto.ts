import { IMystery } from "../../models/Mystery.model.js";
import { IMysterySolution } from "../../models/MysterySolution.model.js";
import { IInvestigation } from "../../models/Investigation.model.js";
import {
  PublicCaseData,
  PublicEvidence,
  PublicSuspect,
  PublicTimelineEvent,
  InvestigationResultPayload,
} from "../../types/mystery.types.js";

export interface PublicMysteryDto {
  id: string;
  caseNumber: string;
  title: string;
  originalScenario: string;
  genre: string;
  difficulty: string;
  status: string;
  summary: string;
  location: string;
  incidentTime: string;
  suspects: PublicSuspect[];
  evidence: PublicEvidence[];
  timeline: PublicTimelineEvent[];
  createdAt: string;
}

export function toPublicMysteryDto(mystery: IMystery): PublicMysteryDto {
  const pc = mystery.publicCase;

  // Strict allowlist mapping - ensures ZERO solution leaks
  return {
    id: mystery._id.toString(),
    caseNumber: pc.caseNumber,
    title: pc.title || mystery.title,
    originalScenario: mystery.originalScenario,
    genre: pc.genre || mystery.genre,
    difficulty: pc.difficulty || mystery.difficulty,
    status: mystery.status,
    summary: pc.summary,
    location: pc.location,
    incidentTime: pc.incidentTime,
    suspects: pc.suspects.map((s) => ({
      id: s.id,
      name: s.name,
      role: s.role,
      relationship: s.relationship,
      initialStatement: s.initialStatement,
      knownMotive: s.knownMotive,
      alibiInfo: s.alibiInfo,
      avatarUrl: s.avatarUrl,
    })),
    evidence: pc.evidence.map((e) => ({
      id: e.id,
      type: e.type,
      title: e.title,
      description: e.description,
      source: e.source,
      occurredAt: e.occurredAt,
      relatedSuspectIds: e.relatedSuspectIds || [],
      relatedEventIds: e.relatedEventIds || [],
      content: e.content,
      mediaAssetIds: e.mediaAssetIds || [],
    })),
    timeline: pc.timeline.map((t) => ({
      id: t.id,
      time: t.time,
      description: t.description,
      relatedSuspectIds: t.relatedSuspectIds || [],
      relatedEvidenceIds: t.relatedEvidenceIds || [],
      isVerified: t.isVerified,
    })),
    createdAt: mystery.createdAt.toISOString(),
  };
}

export function toPublicEvidenceDto(
  mystery: IMystery,
  evidenceId: string
): PublicEvidence | null {
  const item = mystery.publicCase.evidence.find((e) => e.id === evidenceId);
  if (!item) return null;

  return {
    id: item.id,
    type: item.type,
    title: item.title,
    description: item.description,
    source: item.source,
    occurredAt: item.occurredAt,
    relatedSuspectIds: item.relatedSuspectIds || [],
    relatedEventIds: item.relatedEventIds || [],
    content: item.content,
    mediaAssetIds: item.mediaAssetIds || [],
  };
}

export function toInvestigationResultDto(
  investigation: IInvestigation,
  solution: IMysterySolution,
  culpritSuspect: PublicSuspect
): InvestigationResultPayload {
  return {
    investigationId: investigation._id.toString(),
    mysteryId: investigation.mysteryId.toString(),
    status: "completed",
    isCorrect: !!investigation.isCorrect,
    submittedSuspectId: investigation.submittedSuspectId || "",
    actualCulpritId: solution.culpritSuspectId,
    actualCulpritName: culpritSuspect.name,
    motive: solution.motive,
    explanation: solution.explanation,
    decisiveEvidenceIds: solution.decisiveEvidenceIds || [],
    redHerringExplanations: solution.redHerringExplanations || [],
    authoritativeTimeline: solution.authoritativeTimeline || [],
    completedAt: investigation.completedAt
      ? investigation.completedAt.toISOString()
      : new Date().toISOString(),
  };
}

