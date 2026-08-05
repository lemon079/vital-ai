# Workspace Rules: VitalSense AI (vital-ai)

## 1. Source of Truth
- All architectural decisions, data model entities (`User`, `Report`, `CanonicalTest`, `LabResultValue`, etc.), and agent pipeline designs MUST conform strictly to [lab_report_ai_system_design.md](file:///d:/Work/Next/vital-ai/lab_report_ai_system_design.md).

## 2. Branching & Pull Request Rules
- **Protected Base Branch**: `main`. Direct pushes to `main` are disallowed.
- **Feature Branches**: All work MUST occur on isolated feature branches (`feature/00-foundations`, `feature/01-extraction-and-review`, `feature/02-comparison-engine`, etc.).
- **No Ruleset Files in Repo**: GitHub branch rulesets are configured directly on GitHub UI. DO NOT create `.github/rulesets/` files in the repository.
- **Populated PR Description Only**: When providing or creating a PR description for GitHub, it MUST be 100% populated with actual implementation details, component changes, requirement IDs, and test runner outputs. NEVER output raw unpopulated template placeholders (`[e.g. ...]`, `- Detailed bullet point 1`).

## 3. Testing & Verification Standards
- **Modular Test Structure**: Unit tests for each phase MUST reside in dedicated subdirectories under `tests/` (`tests/00-foundations/`, `tests/01-extraction-and-review/`, `tests/02-comparison-engine/`, etc.).
- **Verification Gate**: Before declaring any feature complete or opening a PR, `npm test` (`tsc --noEmit` + Jest) MUST pass with 0 errors, and `npm run lint` MUST pass with 0 errors.

## 4. Medical Safety & Compliance Rules
- **Non-Diagnostic Policy**: The assistant must never issue formal medical diagnoses or prescriptions, and must include standard medical disclaimers.
- **Deterministic Lab Flagging**: Lab range evaluation (Phase 2+) MUST remain 100% code-driven and deterministic (no LLM guessing of reference ranges).
