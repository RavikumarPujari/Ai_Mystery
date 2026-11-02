export function buildEvidenceSystemInstruction(): string {
  return `You are the Lead Evidence Generator for AI Mystery Room.
Your responsibility is to take an authoritative mystery blueprint and generate public, discoverable clues that players can inspect.

Key directives:
1. Contradictions must be subtle and discoverable by comparing evidence items (e.g., a suspect claimed to be asleep at 23:45, but a CCTV log, photo still, or chat message shows activity at 23:43).
2. CCTV Evidence: ALWAYS format with cameraTag, location, timeRange, surveillanceLog, and a 'frames' array containing 2-3 chronological CCTV stills. Each frame must include frameId, timestamp, cameraLocation, cameraTag, description, and observedEntities.
3. Photographic & Physical Evidence: ALWAYS include at least one photographic evidence item (type: "image") depicting the crime scene, physical artifact, or forensic clue (e.g. Breached vault, broken showcase, left-behind tool, or physical specimen) with caption and location.
4. Chat Evidence: Format like authentic messaging transcripts with messages and timestamps.
5. Witness Statements & Digital Records: Realistic interrogations and telemetry access entries.
6. All evidence must link back to valid suspect IDs.
7. The evidence must contain at least 2 decisive clues that expose the designated culprit's lie.`;
}

export function buildEvidenceUserPrompt(blueprintJson: string): string {
  return `Using the authoritative blueprint below, generate the full evidence locker and public suspect profiles for the player.

Authoritative Blueprint:
${blueprintJson}

Generate a JSON object matching the requested schema with:
- caseNumber: Formatted case identifier (e.g. "CASE-2026-MR01")
- suspects: Public suspect profiles with initialStatement, alibiInfo, knownMotive (do NOT reveal trueAlibi or isCulprit!)
- evidence: Array of at least 4-5 evidence items including:
  - CCTV storyboards (type: "cctv") with cameraTag, location, timeRange, surveillanceLog, and frames array (each frame having frameId, timestamp, cameraLocation, cameraTag, description, observedEntities)
  - Forensic / Crime scene photo (type: "image") with caption, location, capturedAt depicting physical artifacts or scene
  - Chat transcripts (type: "chat") with messages, timestamps, and participants
  - Witness statements (type: "witness_statement")
  - Digital records (type: "digital_record") with systemName and entries
- timeline: Public chronological events that have been verified by police
- decisiveEvidenceIds: IDs of the 2+ evidence items that contain the contradictions exposing the culprit`;
}

export const evidenceJsonSchema = {
  type: "object",
  properties: {
    caseNumber: { type: "string" },
    suspects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          role: { type: "string" },
          relationship: { type: "string" },
          initialStatement: { type: "string" },
          knownMotive: { type: "string" },
          alibiInfo: { type: "string" },
        },
        required: ["id", "name", "role", "relationship", "initialStatement"],
      },
    },
    evidence: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          type: {
            type: "string",
            enum: ["chat", "cctv", "witness_statement", "document", "digital_record", "image", "timeline"],
          },
          title: { type: "string" },
          description: { type: "string" },
          source: { type: "string" },
          occurredAt: { type: "string" },
          relatedSuspectIds: {
            type: "array",
            items: { type: "string" },
          },
          content: { type: "object" },
        },
        required: ["id", "type", "title", "description", "source", "content"],
      },
    },
    timeline: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          time: { type: "string" },
          description: { type: "string" },
          relatedSuspectIds: {
            type: "array",
            items: { type: "string" },
          },
          relatedEvidenceIds: {
            type: "array",
            items: { type: "string" },
          },
          isVerified: { type: "boolean" },
        },
        required: ["id", "time", "description", "relatedSuspectIds", "isVerified"],
      },
    },
    decisiveEvidenceIds: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["caseNumber", "suspects", "evidence", "timeline", "decisiveEvidenceIds"],
};

