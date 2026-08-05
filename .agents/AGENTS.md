# Workspace Rules: VitalSense AI (vital-ai)

## 1. Source of Truth
- All architectural decisions, data model entities (`User`, `Report`, `CanonicalTest`, `LabResultValue`, etc.), and agent pipeline designs MUST conform strictly to [lab_report_ai_system_design.md](file:///d:/Work/Next/vital-ai/lab_report_ai_system_design.md).

## 2. Branching & Pull Request Rules
- **Protected Base Branch**: `main`. Direct pushes to `main` are disallowed.
- **Feature Branches**: All work MUST occur on isolated feature branches (`feature/00-foundations`, `feature/01-extraction-and-review`, etc.).
- **Populated PR Template**: When opening a Pull Request to `main`, the PR description MUST populate [.github/pull_request_template.md](file:///d:/Work/Next/vital-ai/.github/pull_request_template.md) with actual phase names, requirement IDs, bulleted technical changes, and test execution results. The raw unfilled template MUST NOT be submitted.

## 3. Testing & Verification Standards
- **Modular Test Structure**: Unit tests for each phase MUST reside in dedicated subdirectories under `tests/` (`tests/00-foundations/`, `tests/01-extraction-and-review/`, etc.).
- **Verification Gate**: Before declaring any feature complete or submitting a PR, `npm test` (`tsc --noEmit` + Jest) MUST pass with 0 errors, and `npm run lint` MUST pass with 0 errors.

## 4. Medical Safety & Compliance Rules
- **Non-Diagnostic Policy**: The assistant must never issue formal medical diagnoses or prescriptions, and must include standard medical disclaimers.
- **Deterministic Lab Flagging**: Lab range evaluation (Phase 2+) MUST remain 100% code-driven and deterministic (no LLM guessing of reference ranges).
