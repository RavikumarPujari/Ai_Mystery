import { describe, it, expect } from "vitest";
import { consistencyValidator } from "../src/services/mystery/validation/consistencyValidator.js";
import { generateProceduralMystery } from "../src/services/mystery/generation/proceduralGenerator.js";

describe("Consistency Validator Engine (Section 6.5 & Section 14.5)", () => {
  it("approves valid mystery bundle synthesized by procedural generator", () => {
    const bundle = generateProceduralMystery(
      "A prototype quantum chip was stolen from the cleanroom overnight.",
      "theft",
      "medium",
      4
    );

    const report = consistencyValidator.validateMystery(
      bundle.publicCase,
      bundle.privateSolution,
      "medium",
      4
    );

    expect(report.isValid).toBe(true);
    expect(report.errors).toHaveLength(0);
  });

  it("fails validation when culpritSuspectId does not exist in suspects list (FR-012)", () => {
    const bundle = generateProceduralMystery(
      "A valuable painting was stolen from the private gallery.",
      "museum",
      "easy",
      3
    );

    // Corrupt the culprit ID
    bundle.privateSolution.culpritSuspectId = "ghost_culprit_999";

    const report = consistencyValidator.validateMystery(
      bundle.publicCase,
      bundle.privateSolution
    );

    expect(report.isValid).toBe(false);
    expect(report.errors).toContain(
      "Culprit 'ghost_culprit_999' does not exist in public suspects list."
    );
  });

  it("fails validation when suspect count is fewer than 3 (FR-009)", () => {
    const bundle = generateProceduralMystery("Scenario", "theft", "easy", 3);
    bundle.publicCase.suspects = bundle.publicCase.suspects.slice(0, 2);

    const report = consistencyValidator.validateMystery(
      bundle.publicCase,
      bundle.privateSolution
    );

    expect(report.isValid).toBe(false);
    expect(report.errors.some((e) => e.includes("at least 3 suspects"))).toBe(true);
  });

  it("fails validation when duplicate suspect IDs are detected (FR-011)", () => {
    const bundle = generateProceduralMystery("Scenario", "theft", "easy", 3);
    bundle.publicCase.suspects[1].id = bundle.publicCase.suspects[0].id;

    const report = consistencyValidator.validateMystery(
      bundle.publicCase,
      bundle.privateSolution
    );

    expect(report.isValid).toBe(false);
    expect(report.errors.some((e) => e.includes("Duplicate suspect ID"))).toBe(true);
  });

  it("fails validation when decisive clues point to non-existent evidence IDs", () => {
    const bundle = generateProceduralMystery("Scenario", "theft", "easy", 3);
    bundle.privateSolution.decisiveEvidenceIds = ["non_existent_evidence_999"];

    const report = consistencyValidator.validateMystery(
      bundle.publicCase,
      bundle.privateSolution
    );

    expect(report.isValid).toBe(false);
    expect(report.errors.some((e) => e.includes("non_existent_evidence_999"))).toBe(true);
  });

  it("fails validation when evidence references an unknown suspect ID (FR-019)", () => {
    const bundle = generateProceduralMystery("Scenario", "theft", "easy", 3);
    bundle.publicCase.evidence[0].relatedSuspectIds = ["unknown_phantom_suspect"];

    const report = consistencyValidator.validateMystery(
      bundle.publicCase,
      bundle.privateSolution
    );

    expect(report.isValid).toBe(false);
    expect(
      report.errors.some((e) => e.includes("unknown suspect 'unknown_phantom_suspect'"))
    ).toBe(true);
  });
});

