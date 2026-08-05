# Lab Report AI Assistant — System Design

## 1. Product summary

1. User authenticates.
2. User uploads a PDF lab report.
3. While the report is being processed in the background, the user can chat normally with an always-on QnA agent.
4. Once analysis completes, the system asks indirect, non-diagnostic follow-up questions about any abnormal values.
5. The AI never diagnoses or prescribes.
6. The AI generates a downloadable clinical summary PDF for the user to bring to their doctor.
7. Abnormal values are compared against reference ranges from a grounded source — prioritizing the range printed on the report itself, falling back to a curated reference database.

---

## 2. Agent architecture

Comparing a lab value against a normal range is a deterministic lookup problem, not a retrieval-augmented generation problem — an LLM should not be asked to judge "is 145 mg/dL glucose high," since that invites hallucinated ranges in a domain where that failure mode is unacceptable. The LLM's job is language (extraction from messy layouts, conversation, summarization); the comparison itself should be plain code.

| Component | Type | Responsibility |
|---|---|---|
| Orchestrator / Router | Code + small classifier | Decides which agent handles each incoming message; tracks report/session state; enforces the critical-flag override |
| Extraction agent | LLM | Turns unstructured PDF content into structured test/value/unit data, with a confidence score per field |
| Comparison engine | Deterministic code | Normalizes units, resolves the correct reference range, assigns flags (normal / high / low / critical) |
| Follow-up agent | LLM, guardrailed | Asks indirect, non-diagnostic questions about abnormal values |
| QnA agent | LLM, guardrailed | Always available; handles general conversation, status questions, off-topic questions |
| Summary agent | LLM, template-grounded | Drafts the clinical summary from structured data + follow-up answers |
| Guardrail scanner | Classifier + rules | Scans every Follow-up/QnA response before it reaches the user for diagnostic or prescriptive language |

### High-level flow

```
PDF uploaded → background job begins
   → Extraction agent (LLM structures raw text)
   → Comparison engine (deterministic, checks against reference DB)
        → Critical flag  → urgent care prompt (fixed template, bypasses follow-up)
        → Abnormal/normal flag → routine path
              → Follow-up agent (asks indirect questions)
              → Summary agent (drafts clinical summary)
              → Clinical summary PDF
```

The QnA agent runs in parallel to this entire pipeline, not just after analysis finishes.

---

## 3. Routing logic

Two layers: a hard deterministic safety gate, then a cheap intent classifier for genuine ambiguity.

**Deterministic checks first, always:**
- Is there an unacknowledged critical flag on the user's active report? If yes → fixed urgent-care response, overrides everything else, no model judgment involved.
- What is `Report.status`? (plain field lookup — no LLM needed for status questions.)

**Ambiguous cases → a small, cheap classification call** (not the main conversational model) producing a structured intent: `followup_answer | general_question | action_request | status_check`. Needed because messages like "I've been really tired lately" could be answering a pending follow-up question or could be an unrelated remark.

| Report state | Message intent | Route |
|---|---|---|
| No report uploaded | anything | QnA agent |
| Processing | "is it ready?" | Direct template from job status — no LLM guessing at ETA |
| Processing | anything else | QnA agent (aware a report is mid-processing) |
| Analyzed, follow-up not started | — | Orchestrator proactively injects the follow-up agent's opening question |
| Follow-up in progress | answering pending question | Follow-up agent |
| Follow-up in progress | off-topic / new question | QnA agent, aware follow-up is paused; hands back after |
| Follow-up in progress | "skip" / "just summarize" | Orchestrator marks skipped, triggers Summary agent early |
| Follow-up complete | anything | QnA agent; "regenerate," "download again" handled as direct actions |
| Critical flag unacknowledged | anything | Fixed safety response, overrides all rows above |

The "agent speaks first" row requires a push mechanism (websocket/SSE, or at minimum poll-on-reopen) so a completed background job can inject a new assistant turn into an idle conversation.

---

## 4. Reference range strategy

Two grounded sources, used in priority order:

1. **The range printed on the report itself**, from the issuing lab, for their specific assay — generally the most trustworthy, since assay methods differ meaningfully between labs.
2. **A curated internal `ReferenceRange` table**, used as a fallback when the report doesn't print a range — and also run as a sanity check even when a report *does* print one. A wildly out-of-line printed range is more likely an extraction error on the range text than a genuinely unusual assay, and should route into the same human-in-the-loop review as low-confidence values.

Sourcing notes:
- Use LOINC as the backbone for test *identity* — it's an open, standard coding system, safer than inventing your own taxonomy.
- Be cautious about scraping and redistributing range data from sites like Mayo Clinic or WebMD — that's a copyright/ToS question independent of whether the data is medically accurate, and worth a real legal review before relying on it.
- Ranges are families of ranges, not single numbers — they vary by sex, age band, and pregnancy status (e.g. hemoglobin by sex, TSH by pregnancy trimester, many pediatric ranges by age).
- Unit conversion is a separate concern — the same test appears in different units across labs, and must be normalized before comparison.

**Design for the "family of ranges" problem:**
- Fixed columns (`sex`, `age_min`/`age_max`, `pregnancy_trimester`), nullable — null means "no constraint on this dimension." A generic fallback row (all null) can coexist with a specific one (e.g. `sex=female, age_min=18, age_max=45`).
- A `specificity_rank` column, computed as the count of non-null constraints on a row. Lookup: find all matching rows for the patient's demographics, then take the highest `specificity_rank` — deterministic, no ambiguity about which row wins.
- Avoided a fully generic EAV (attribute/value) table deliberately — more flexible for hypothetical future dimensions, but makes every lookup and specificity resolution harder to reason about for a flexibility that may never be needed. Add a column later if a real need shows up.

---

## 5. Memory — two distinct systems

"Memory" here covers two things with very different reliability requirements — worth not conflating them:

**Clinical longitudinal store** — not really an LLM memory system at all. It's `LabResultValue` rows queried by `user_id + test_code + sample_collected_date`. No embeddings, no recall — plain SQL, since trend comparisons need exact precision.

**Conversational / patient-reported context** — what the user tells the follow-up agent about symptoms, lifestyle, medications. Avoid vector-embedding memory for this, even though it's tempting — for a document a doctor will read, "the AI recalled something close to what the patient said" isn't good enough. Extract these into structured `PatientReportedFact` rows via a structured-output LLM call, and pull them by exact join when building the summary. Reserve embedding-based memory, if used at all, for low-stakes things like detecting a repeat question — never for facts that end up in the clinical summary.

---

## 6. Safety-critical additions

**Critical-value tier, separate from "abnormal."** Real labs distinguish "abnormal" from "critical/panic" values (e.g. severely high potassium, dangerously low hemoglobin) that would trigger an immediate call to a physician in a hospital setting. Source `critical_low`/`critical_high` as their own curated fields, populated only where a credible, established clinical threshold exists — leave null rather than guessing for tests without a well-agreed critical tier. The router's override reads this field directly, and the response is a fixed, reviewed template ("seek immediate medical attention"), not freely generated text — this is the one path where zero variance is the goal.

**Human-in-the-loop confirmation on extraction.** The extraction agent outputs a per-field confidence score. Anything below a threshold gets `review_status = pending_review` and is shown to the user as "here's what we read — please confirm" before it feeds into comparison or follow-up generation; everything else auto-accepts, keeping the review UI light. Keep both the original extraction and the user's correction, if any, for audit and for the extraction eval loop.

**Regulatory guardrail as a technical backstop, not just a prompt.** "No diagnosis, no prescriptions, only questions plus a summary for the doctor" is the boundary that keeps this out of medical-device territory in a lot of jurisdictions (frameworks like the FDA's Software-as-a-Medical-Device, or equivalents elsewhere). A lightweight scanner — pattern-based plus a cheap classifier — runs on every Follow-up/QnA response before it reaches the user, checking for diagnostic phrasing ("this means you have...") or prescriptive phrasing ("take X mg of Y"). On a hit: regenerate with a corrective instruction, or fall back to a safe templated response. Log every check for the audit trail. This is architecture, not legal advice — a real legal review is still needed before launch.

---

## 7. Evals & observability

- **Extraction accuracy** — real report samples across varied labs/layouts, measured against hand-labeled ground truth for test/value/unit.
- **Flagging correctness** — since comparison is deterministic code, this is unit testing, not an eval. Known value/demographic/test combinations should produce the correct flag 100% of the time.
- **Safety red-team set** — adversarial prompts ("what disease do I have," "should I take metformin") run against the Follow-up and QnA agents, checking the guardrail catches every slip.
- **Summary factual-consistency** — every claim in a generated clinical summary must trace back to an actual `LabResultValue` or `PatientReportedFact` row, with nothing invented. Worth the most investment, since hallucination here has real downstream consequences.
- **Standard observability** — structured tracing per agent call (agent name, input, output, latency, token cost, model version); rate limiting on uploads and chat; timeouts and retries with circuit breakers around OCR/LLM calls.

---

## 8. Data model

```
User
 - user_id (PK), auth_provider_id
 - date_of_birth, sex, pregnancy_status
 - consent_health_data_at, created_at

Report
 - report_id (PK), user_id (FK)
 - file_uri
 - status   # uploaded | processing | extracted | pending_review | analyzed | failed
 - sample_collected_date, uploaded_at, source_lab_name
 - has_critical_flag (bool), critical_ack_at (nullable)

CanonicalTest
 - test_code (PK, ideally LOINC-mapped), display_name, default_unit

TestAlias
 - alias_text (PK), test_code (FK)          # "Hb", "HGB", "Hemoglobin" -> one canonical code

UnitConversion
 - test_code (FK), from_unit, to_unit, multiply_factor

ReferenceRange
 - range_id (PK), test_code (FK)
 - sex, age_min, age_max, pregnancy_trimester     # null = no constraint on that dimension
 - low, high, critical_low, critical_high
 - unit, specificity_rank                          # count of non-null constraints
 - source_citation, effective_from, effective_to

LabResultValue
 - result_id (PK), report_id (FK), user_id (FK), test_code (FK)
 - extracted_value_raw, confidence_score
 - review_status    # auto_accepted | pending_review | user_confirmed | user_corrected
 - value, unit, report_stated_range_low/high
 - flag              # normal | high | low | critical_high | critical_low
 - flag_basis         # 'report_printed_range' | 'internal_reference_db'

Conversation
 - conversation_id (PK), user_id (FK), report_id (FK, nullable)
 - messages (agent_type per message), created_at

FollowUpSession
 - session_id (PK), report_id (FK), user_id (FK)
 - state    # not_started | in_progress | paused | complete | skipped
 - created_at, updated_at

FollowUpQuestion
 - question_id (PK), session_id (FK), related_test_code (FK, nullable)
 - question_text, answer_text
 - status    # pending | answered | skipped
 - asked_at, answered_at

PatientReportedFact
 - fact_id (PK), user_id (FK), related_test_code (FK, nullable)
 - fact_text, source_conversation_id, created_at

ResponseGuardrailLog
 - log_id (PK), conversation_id (FK), agent_type
 - flagged (bool), flag_reason, final_response_sent, created_at

ClinicalSummary
 - summary_id (PK), report_id (FK)
 - content, pdf_uri, generated_at, model_version
```

---

## 9. Implementation plan — phased, independently testable

| Phase | Builds | How to test it in isolation |
|---|---|---|
| 0 — Foundations | Auth, upload endpoint, file storage, base schema, job queue skeleton | Sign up, log in, upload a PDF, confirm a `Report` row lands with `status=uploaded`. No AI involved yet. |
| 1 — Extraction + review | Extraction agent, confidence scoring, human-in-the-loop review UI | Feed a batch of varied real-world report PDFs; measure precision/recall against hand-labeled ground truth; confirm low-confidence items trigger review. |
| 2 — Comparison engine | `CanonicalTest`/`TestAlias`, seeded `ReferenceRange` data, `UnitConversion`, deterministic flagging with specificity resolution | Pure unit tests — known value/demographic/test combos, assert exact flag output. Should be 100% deterministic and 100% passing; no eval needed. |
| 3 — QnA agent + router skeleton | Always-on QnA agent, orchestrator with status-aware routing, critical-flag override wired to phase 2's output, output guardrail scanner | Chat pre-upload, mid-processing, post-analysis; confirm status questions answer from real job state; run the safety red-team set against the guardrail. |
| 4 — Follow-up agent | `FollowUpSession`/`FollowUpQuestion`, question generation, proactive agent-initiated turn, interruption handling via the intent classifier | Simulate different flag scenarios, verify indirect non-diagnostic phrasing; test going off-topic mid-session and resuming; test the "skip" path; run the red-team set against this agent specifically. |
| 5 — Summary agent + PDF | Summary generation from `LabResultValue` + `PatientReportedFact` + follow-up answers, PDF export | Factual-consistency eval — every claim traces to an actual DB row, zero invented values. Confirm disclaimer is always present. |
| 6 — Longitudinal trends | Cross-report comparison by `user_id + test_code`, trend surfacing in QnA and summary | Seed a test user with two historical reports; verify trend statements are accurate and correctly caveated. |
| 7 — Observability & hardening | Structured tracing, recurring automated evals as a regression gate, rate limiting, timeouts/retries/circuit breakers | Chaos-test an OCR/LLM timeout and confirm graceful degradation; confirm rate limits actually enforce. |
| 8 — Legal/regulatory pass | Consent flows, retention/deletion, jurisdiction-specific review, final red-team pass | Not an engineering test — a launch gate; should block ship until cleared. |

Phase 2 is worth calling out: it's a fully testable "given a value and a patient, is this flagged correctly" service with no LLM in the loop at all — a good place to get very high confidence before layering the conversational pieces on top.
