# Lab Report AI Assistant — VitalSense AI

## What This Is

An AI-powered clinical lab report assistant and patient-facing health platform. It parses unstructured PDF laboratory reports into deterministic structured data, compares extracted values against grounded demographic reference ranges without LLM guessing, conducts indirect non-diagnostic follow-up conversations, scans all outgoing assistant messages through a strict regulatory guardrail, and synthesizes downloadable clinical summaries for doctor consultations.

Source of Truth Document: [lab_report_ai_system_design.md](file:///d:/Work/Next/vital-ai/lab_report_ai_system_design.md)

## Core Value

Empowering patients with warm, accessible, deterministic, and clinically grounded explanations of their lab reports while maintaining strict regulatory safety: zero direct diagnoses, zero direct prescriptions, 100% evidence traceability, and deterministic reference range comparisons.

## Product Summary & Workflow

1. User authenticates & provides health consent / demographic profile (DOB, sex, pregnancy status).
2. User uploads a PDF lab report.
3. While the report processes asynchronously in the background, user can chat normally with an always-on QnA Agent.
4. Extraction Agent extracts structured lab data with confidence scores; low-confidence items trigger human-in-the-loop review.
5. Deterministic Comparison Engine checks values against report-printed ranges or internal demographic `ReferenceRange` DB tables.
6. If a critical flag is detected, an unacknowledged safety override immediately forces an urgent care prompt.
7. Once analysis completes, system injects indirect, non-diagnostic follow-up questions for abnormal values.
8. System extracts structured facts (`PatientReportedFact`) and generates a downloadable Clinical Summary PDF for doctor visits.
9. Longitudinal trend engine allows tracking historical lab trends across multiple reports.

## Core Architecture

| Component | Type | Responsibility |
|---|---|---|
| Orchestrator / Router | Code + small classifier | Decides which agent handles each incoming message; tracks report/session state; enforces critical-flag override |
| Extraction Agent | LLM | Turns unstructured PDF content into structured test/value/unit data, with confidence scores |
| Comparison Engine | Deterministic Code | Normalizes units, resolves correct reference ranges by demographic specificity, assigns flags (`normal`, `high`, `low`, `critical_high`, `critical_low`) |
| Follow-up Agent | LLM, guardrailed | Asks indirect, non-diagnostic questions about abnormal values |
| QnA Agent | LLM, guardrailed | Always available; handles general conversation, status questions, off-topic queries |
| Summary Agent | LLM, template-grounded | Drafts the clinical summary from structured data + follow-up answers |
| Guardrail Scanner | Classifier + rules | Scans every Follow-up/QnA response before sending to user for diagnostic/prescriptive violations |

## Data Model Entities

- `User`: Demographic profile (DOB, sex, pregnancy status) & consent timestamps.
- `Report`: File URI, processing status (`uploaded` \| `processing` \| `extracted` \| `pending_review` \| `analyzed` \| `failed`), source lab, critical flags.
- `CanonicalTest`: LOINC-mapped standard test identity & default units.
- `TestAlias`: Synonym mappings to canonical LOINC test codes.
- `UnitConversion`: Test-specific unit conversion factors.
- `ReferenceRange`: Demographically constrained ranges (`sex`, `age_min/max`, `pregnancy_trimester`) with `specificity_rank`.
- `LabResultValue`: Extracted & normalized value, raw text, confidence score, review status, flag, and flag basis.
- `Conversation`: User chat thread & per-message `agent_type`.
- `FollowUpSession`: Session state (`not_started` \| `in_progress` \| `paused` \| `complete` \| `skipped`).
- `FollowUpQuestion`: Individual generated question text, user answer, and status.
- `PatientReportedFact`: Structured extracted patient-reported facts tied to test codes.
- `ResponseGuardrailLog`: Safety compliance audit log for scanned responses.
- `ClinicalSummary`: Synthesized summary content, PDF URI, and model version.

## Constraints

- **Deterministic Flagging**: LLMs MUST NOT judge if a numeric lab value is high/low. Flagging is pure code based on exact reference range tables.
- **Strict Safety Guardrail**: Scanner runs on ALL generated responses before display. Zero diagnosis, zero prescription.
- **100% Traceability**: Every claim in the clinical summary must map directly to DB rows (`LabResultValue`, `PatientReportedFact`).
- **Human-in-the-Loop**: Low-confidence extracted values must be confirmed/corrected by user before feeding downstream agents.

## Evolution

This document is aligned with [lab_report_ai_system_design.md](file:///d:/Work/Next/vital-ai/lab_report_ai_system_design.md).
