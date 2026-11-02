export function buildVisualSystemInstruction(): string {
  return `You are the Lead Visual Director and Forensic Sketch Artist for AI Mystery Room.
Your task is to analyze the generated crime scenario, suspects, and physical clues, and produce a cohesive, character-consistent visual identity dossier for image synthesis.

Strict visual rules:
1. Every suspect must have a DISTINCT visual identity (age range, hairstyle and hair color, distinctive clothing, accessories, facial features) appropriate to their role and the scenario.
2. For each suspect, craft a detailed, high-accuracy portrait prompt: "Cinematic forensic portrait photograph of [Name], [Age]-year-old [Gender], with [hairStyleAndColor], wearing [clothing], [facialFeatures], neutral expression, dramatic detective lighting, 35mm lens, high resolution".
3. Maintain character consistency: The clothing, hairstyle, hair color, and accessories assigned to a suspect must match anywhere they appear (e.g. In an avatar and a CCTV still).
4. For CCTV stills, explicitly inject the observed suspect's physical traits into the scene prompt: "Security surveillance CCTV still camera view of [location], showing [Suspect Name] wearing [their distinctive clothing], [description], timestamp [time], grainy night-vision monochrome, surveillance watermark".
5. For physical evidence and crime scene photographs (type "image"), depict the actual scene or clue described in the scenario (e.g., shattered vault with empty velvet necklace stand; torn fabric near window sill; chemical flask on lab bench) with forensic documentary lighting.
6. All image prompts must be safe, professional, artistic, and cinematic.`;
}

export function buildVisualUserPrompt(
  scenario: string,
  genre: string,
  title: string,
  location: string,
  incidentTime: string,
  suspectsJson: string,
  evidenceJson: string
): string {
  return `Analyze this criminal investigation dossier and create detailed, unique visual prompts for every suspect and visual evidence item.

CASE INFORMATION:
Title: ${title}
Genre: ${genre}
Location: ${location}
Incident Time: ${incidentTime}
Original Scenario:
${scenario}

SUSPECTS:
${suspectsJson}

EVIDENCE ITEMS:
${evidenceJson}

Produce a structured JSON visual specification matching the schema:
- suspectProfiles: One unique visual specification per suspect with detailed portrait prompt and SVG design tokens.
- evidenceVisuals: Visual specifications for any CCTV frames or photographic evidence items in the evidence list.`;
}

export const visualJsonSchema = {
  type: "object",
  properties: {
    visualAtmosphere: { type: "string" },
    suspectProfiles: {
      type: "array",
      items: {
        type: "object",
        properties: {
          suspectId: { type: "string" },
          name: { type: "string" },
          visualIdentity: {
            type: "object",
            properties: {
              age: { type: "number" },
              gender: { type: "string" },
              ethnicity: { type: "string" },
              hairStyleAndColor: { type: "string" },
              facialFeatures: { type: "string" },
              clothing: { type: "string" },
              accessories: { type: "string" },
            },
            required: ["age", "gender", "hairStyleAndColor", "clothing"],
          },
          portraitPrompt: { type: "string" },
          svgDesign: {
            type: "object",
            properties: {
              clothingColor: { type: "string" },
              hairColor: { type: "string" },
              accentColor: { type: "string" },
            },
            required: ["clothingColor", "hairColor"],
          },
        },
        required: ["suspectId", "name", "visualIdentity", "portraitPrompt"],
      },
    },
    evidenceVisuals: {
      type: "array",
      items: {
        type: "object",
        properties: {
          evidenceId: { type: "string" },
          evidenceType: { type: "string", enum: ["cctv", "image"] },
          targetSubject: { type: "string" },
          scenePrompt: { type: "string" },
          svgDesign: {
            type: "object",
            properties: {
              badgeLabel: { type: "string" },
              iconType: { type: "string" },
              primaryColor: { type: "string" },
            },
            required: ["badgeLabel", "iconType"],
          },
        },
        required: ["evidenceId", "evidenceType", "scenePrompt"],
      },
    },
  },
  required: ["visualAtmosphere", "suspectProfiles"],
};

