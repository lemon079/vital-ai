## Description

Complete implementation of Phase 0: Foundations for the Lab Report AI Assistant (VitalSense AI).

- **Phase**: Phase 0: Foundations
- **Related Requirements**: FOUNDATION-01, FOUNDATION-02, FOUNDATION-03
- **Source of Truth Reference**: [lab_report_ai_system_design.md](file:///d:/Work/Next/vital-ai/lab_report_ai_system_design.md)

---

## Type of Change

Please mark the relevant options:

- [x] 🚀 **Feature** (New feature / agent addition)
- [ ] 🐛 **Bug Fix** (Non-breaking change fixing an issue)
- [x] 🛠️ **Refactor** (Code refactoring or performance optimization)
- [x] 🧪 **Testing** (Adding or updating Jest unit / integration tests)
- [x] ⚙️ **CI/CD / Chore** (GitHub Actions, build config, dependencies)
- [x] 📝 **Documentation** (Updating planning files, design docs, or README)

---

## Key Technical Changes

- **Database Data Model (`schema.prisma`)**: Replaced schema with entities specified in `lab_report_ai_system_design.md` §8 (`User`, `Report`, `Conversation`, `Message`, and stubs for Phase 1-8 models: `CanonicalTest`, `TestAlias`, `UnitConversion`, `ReferenceRange`, `LabResultValue`, `ResponseGuardrailLog`, `FollowUpSession`, `FollowUpQuestion`, `PatientReportedFact`, `ClinicalSummary`). Executed `prisma db push` and generated client.
- **User Demographics (`FOUNDATION-01`)**: Updated `actions.ts` & `users.ts` to manage user demographic fields (`date_of_birth`, `sex`, `pregnancy_status`, `consent_health_data_at`) directly on `User`.
- **Report Upload & DB Persistence (`FOUNDATION-02`)**: Added `reports.ts` service and updated `/api/upload` endpoint to create a `Report` row (`status = "uploaded"`) upon file saving and return `reportId`.
- **Async Job Queue Skeleton (`FOUNDATION-03`)**: Built in-process job queue in `job-queue.ts` (`queued` → `processing` → `extracted`) and added `/api/reports/status` endpoint to track report processing status.
- **Codebase Compatibility & Testing**: Refactored `chat.ts`, `app/api/chat/route.ts`, and agent tools to consume new models. Modularized test suites in `tests/00-foundations/` (`auth.test.ts`, `reports-upload.test.ts`, `job-queue.test.ts`).

---

## Verification & Testing

### Automated Verification
- [x] Ran `npm test` (All Jest unit tests passing)
- [x] Ran `npm run lint` (ESLint 0 errors)
- [x] Verified Prisma schema generation (`npx prisma generate`)

### Test Output Summary
```text
> vital-ai@0.1.0 test
> tsc --noEmit && jest

PASS tests/00-foundations/job-queue.test.ts
PASS tests/00-foundations/reports-upload.test.ts
PASS tests/00-foundations/auth.test.ts

Test Suites: 3 passed, 3 total
Tests:       7 passed, 7 total
Snapshots:   0 total
Time:        3.084 s
Ran all test suites.
```

---

## Safety & Compliance Checklist

- [x] **Non-Diagnostic Policy**: Ensures the system does not issue formal diagnoses or prescriptions.
- [x] **Deterministic Flagging**: Lab comparison logic remains 100% code-driven (no LLM guessing ranges).
- [x] **Output Guardrail**: Verified output guardrail scanner covers new assistant message paths.
- [x] **Data Safety**: No secrets, credentials, or PII exposed in code or commits.
