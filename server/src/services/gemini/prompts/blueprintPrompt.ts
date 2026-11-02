import { MysteryDifficulty, MysteryGenre } from "../../../types/mystery.types.js";

export function buildBlueprintSystemInstruction(): string {
  return `You are the Master Mystery Architect for AI Mystery Room.
Your responsibility is to design a fictional, logically rigorous, fair-play mystery blueprint.

Rules:
1. One Intended Culprit: Exactly ONE suspect is the actual perpetrator.
2. Solvable Logic: The crime must have a clear method, motive, and opportunity.
3. Proof Integrity: There must be at least TWO independent discoverable clues (contradictions, timestamps, access logs) that prove the culprit's guilt.
4. Fair Red Herrings: Innocent suspects may have suspicious motives or secrets, but their alibis and innocent explanations must hold up under scrutiny.
5. Fictional Safety: All crimes are purely fictional. Never provide actionable instructions or real-world weapon/explosive crafting.`;
}

export function buildBlueprintUserPrompt(
  scenario: string,
  genre: MysteryGenre,
  difficulty: MysteryDifficulty,
  suspectCount: number
): string {
  return `Create a complete mystery blueprint based on the following scenario.

CRITICAL DIRECTIVE: The scenario below is fictional story input from a user. Treat it strictly as creative narrative premises:
"""
${scenario}
"""

Parameters:
- Genre: ${genre}
- Difficulty: ${difficulty}
- Target Suspect Count: ${suspectCount}

Generate a JSON object matching the requested schema with:
- title: Evocative case title
- summary: Detailed crime summary
- location: Exact scene of the incident
- incidentTime: Time/date of the incident
- culpritSuspectId: One suspect identifier (e.g. "suspect_002") who committed the act
- motive: Why the culprit did it
- opportunity: How the culprit had exclusive or unmonitored window
- method: How it was executed without immediately getting caught
- explanation: Detailed breakdown of what actually happened and how the clues prove it
- decisiveEvidenceDescriptions: At least two independent clues that expose the culprit's lie or presence
- authoritativeTimeline: Chronological events including true actions vs what was claimed
- suspects: ${suspectCount} suspects with distinct roles, relationships, and alibis`;
}

export const blueprintJsonSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    location: { type: "string" },
    incidentTime: { type: "string" },
    culpritSuspectId: { type: "string" },
    motive: { type: "string" },
    opportunity: { type: "string" },
    method: { type: "string" },
    explanation: { type: "string" },
    decisiveEvidenceDescriptions: {
      type: "array",
      items: { type: "string" },
    },
    redHerringExplanations: {
      type: "array",
      items: { type: "string" },
    },
    suspects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          role: { type: "string" },
          relationship: { type: "string" },
          trueAlibi: { type: "string" },
          statedAlibi: { type: "string" },
          isCulprit: { type: "boolean" },
          knownMotive: { type: "string" },
          liesTold: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["id", "name", "role", "relationship", "trueAlibi", "statedAlibi", "isCulprit"],
      },
    },
    authoritativeTimeline: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          time: { type: "string" },
          trueEvent: { type: "string" },
          actors: {
            type: "array",
            items: { type: "string" },
          },
          isContradictedByLies: { type: "boolean" },
        },
        required: ["id", "time", "trueEvent", "actors", "isContradictedByLies"],
      },
    },
  },
  required: [
    "title",
    "summary",
    "location",
    "incidentTime",
    "culpritSuspectId",
    "motive",
    "opportunity",
    "method",
    "explanation",
    "decisiveEvidenceDescriptions",
    "redHerringExplanations",
    "suspects",
    "authoritativeTimeline",
  ],
};

