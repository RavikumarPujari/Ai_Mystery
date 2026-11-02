import {
  PublicCaseData,
  PrivateSolutionData,
  MysteryDifficulty,
} from "../../../types/mystery.types.js";

export interface ValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ConsistencyValidator {
  /**
   * Deterministically validates structural and logical consistency of a generated mystery.
   * Based on Section 6.4 & 6.5 of spec.md.
   */
  validateMystery(
    publicCase: PublicCaseData,
    solution: Omit<PrivateSolutionData, "mysteryId">,
    expectedDifficulty?: MysteryDifficulty,
    expectedSuspectCount?: number
  ): ValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Culprit existence and membership (FR-012)
    if (!solution.culpritSuspectId) {
      errors.push("Missing culpritSuspectId in solution.");
    } else {
      const culpritInSuspects = publicCase.suspects.some(
        (s) => s.id === solution.culpritSuspectId
      );
      if (!culpritInSuspects) {
        errors.push(
          `Culprit '${solution.culpritSuspectId}' does not exist in public suspects list.`
        );
      }
    }

    // 2. Suspect Count Validation (FR-009, FR-010)
    if (!publicCase.suspects || publicCase.suspects.length < 3) {
      errors.push(
        `Case must contain at least 3 suspects (found ${publicCase.suspects?.length || 0}).`
      );
    }
    if (expectedSuspectCount && publicCase.suspects.length !== expectedSuspectCount) {
      warnings.push(
        `Configured suspect count was ${expectedSuspectCount}, but generated ${publicCase.suspects.length}.`
      );
    }

    // 3. Unique Suspect IDs (FR-011)
    const suspectIds = new Set<string>();
    for (const suspect of publicCase.suspects || []) {
      if (!suspect.id) {
        errors.push("A suspect is missing an ID.");
      } else if (suspectIds.has(suspect.id)) {
        errors.push(`Duplicate suspect ID detected: '${suspect.id}'.`);
      } else {
        suspectIds.add(suspect.id);
      }

      if (!suspect.name || suspect.name.trim().length === 0) {
        errors.push(`Suspect '${suspect.id}' is missing a name.`);
      }
      if (!suspect.initialStatement || suspect.initialStatement.trim().length === 0) {
        errors.push(`Suspect '${suspect.id}' is missing an initial statement.`);
      }
    }

    // 4. Evidence Integrity and Unique IDs (FR-015, FR-016)
    if (!publicCase.evidence || publicCase.evidence.length < 2) {
      errors.push(
        `Case must contain at least 2 evidence items (found ${publicCase.evidence?.length || 0}).`
      );
    }

    const evidenceIds = new Set<string>();
    for (const item of publicCase.evidence || []) {
      if (!item.id) {
        errors.push("An evidence item is missing an ID.");
      } else if (evidenceIds.has(item.id)) {
        errors.push(`Duplicate evidence ID detected: '${item.id}'.`);
      } else {
        evidenceIds.add(item.id);
      }

      if (!item.title || !item.content) {
        errors.push(`Evidence '${item.id}' is missing a title or content.`);
      }

      // 5. Evidence references valid suspects (FR-019)
      if (item.relatedSuspectIds) {
        for (const relId of item.relatedSuspectIds) {
          if (!suspectIds.has(relId)) {
            errors.push(
              `Evidence '${item.id}' references unknown suspect '${relId}'.`
            );
          }
        }
      }
    }

    // 6. Sufficient Proof: At least two independent pieces of evidence point to culprit (Section 6.4)
    if (solution.decisiveEvidenceIds && solution.decisiveEvidenceIds.length > 0) {
      for (const decId of solution.decisiveEvidenceIds) {
        if (!evidenceIds.has(decId)) {
          errors.push(
            `Decisive evidence ID '${decId}' does not exist in generated evidence.`
          );
        }
      }

      if (solution.decisiveEvidenceIds.length < 2) {
        warnings.push(
          `Section 6.4 recommends at least 2 independent decisive clues (found ${solution.decisiveEvidenceIds.length}).`
        );
      }
    } else {
      errors.push("Solution does not declare any decisiveEvidenceIds.");
    }

    // 7. Authoritative Timeline and Lies Consistency (FR-014, FR-020)
    if (!solution.authoritativeTimeline || solution.authoritativeTimeline.length === 0) {
      errors.push("Authoritative solution timeline is empty.");
    } else {
      for (const tEvent of solution.authoritativeTimeline) {
        if (!tEvent.time || !tEvent.trueEvent) {
          errors.push(`Timeline event '${tEvent.id}' is missing time or event description.`);
        }
      }
    }

    // 8. Public Timeline Validation
    if (!publicCase.timeline || publicCase.timeline.length === 0) {
      warnings.push("Public investigation timeline is empty.");
    } else {
      for (const pEvent of publicCase.timeline) {
        for (const sId of pEvent.relatedSuspectIds || []) {
          if (!suspectIds.has(sId)) {
            errors.push(
              `Public timeline event '${pEvent.id}' references unknown suspect '${sId}'.`
            );
          }
        }
      }
    }

    // 9. Red Herrings Explanation (Section 6.4)
    if (!solution.redHerringExplanations || solution.redHerringExplanations.length === 0) {
      warnings.push("No red herring explanations provided in solution.");
    }

    // 10. Motive and Explanation Presence
    if (!solution.motive || solution.motive.trim().length === 0) {
      errors.push("Solution is missing a motive.");
    }
    if (!solution.explanation || solution.explanation.trim().length === 0) {
      errors.push("Solution is missing an explanation.");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

export const consistencyValidator = new ConsistencyValidator();

