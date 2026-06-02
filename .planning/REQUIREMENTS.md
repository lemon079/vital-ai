# Requirements: VitalSense AI

**Defined:** 2026-06-02
**Core Value:** Empowering patients with warm, accessible, and clinically grounded explanations of their lab reports and health symptoms to prepare them for productive doctor consultations.

## v1 Requirements

### Core Agentic Flows (Clinical & Conversational)

- [ ] **FLOW-01**: User can chat about normal health concerns when no PDF is uploaded, receiving empathetic, educational health information.
- [ ] **FLOW-02**: User can upload a lab PDF, and the agent parses it, identifies all abnormal values, and formats them neatly in a markdown table.
- [ ] **FLOW-03**: The AI agent guides the conversation by asking focused, one-at-a-time follow-up questions to gather relevant symptom details.
- [ ] **FLOW-04**: Once sufficient symptom details are gathered, the agent synthesizes findings and generates a personalized clinical conclusion of "why it is happening."
- [ ] **FLOW-05**: Strict factual verification: The agent must never formulate diagnoses or conclusions without citing concrete, validated lab findings and conversational facts in the active session.
- [ ] **FLOW-06**: Active Medical Disclaimer: Every clinical conclusion must contain a prominent disclaimer noting the AI does not issue certified medical diagnoses.

### Frontend UI & State Management

- [ ] **UI-01**: The client dashboard must have a clean, unified state container handling active chats, message histories, upload statuses, and PDF canvas panels without race conditions.
- [ ] **UI-02**: Real-time loading feedback: Clear, beautiful micro-animations for active AI thinking, PDF loading, and message transmissions.
- [ ] **UI-03**: Interactive layout transitions: Smooth visual animations when transitioning between chat states, and opening/closing the split-screen PDF visualizer.
- [ ] **UI-04**: Modern Typographic Polish: Harmonic HSL tailored colors, responsive fluid structures, and high-fidelity typography (Inter/Outfit fonts).

### Verification & Testing

- [ ] **TEST-01**: Automated Unit Tests: Core logic like unit converters (`lib/agent/tools/lab-tools.ts`) and file processors (`lib/services/processing.ts`) verified by automated test suites.
- [ ] **TEST-02**: Agent Mock Testing: Isolated mock configurations to verify LangGraph router and node transitions under different query profiles.

## v2 Requirements

### Multimodal Vision OCR
- **VISION-01**: User can take a photo of a physical report using their mobile camera and have the vision model automatically analyze findings (currently deferred to favor PDF parsing).

### Real-Time Token Streaming
- **STREAM-01**: Message tokens stream dynamically to the dashboard as they generate, rather than loading in single blocks.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Prescribing Medications | Direct medical prescriptions represent high clinical risk and are legally excluded. |
| Diagnostic Certifications | The application serves solely as an educational tool; formal diagnoses are out of scope. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FLOW-01 | Phase 2 | Pending |
| FLOW-02 | Phase 2 | Pending |
| FLOW-03 | Phase 1 | Pending |
| FLOW-04 | Phase 1 | Pending |
| FLOW-05 | Phase 1 | Pending |
| FLOW-06 | Phase 1 | Pending |
| UI-01 | Phase 3 | Pending |
| UI-02 | Phase 4 | Pending |
| UI-03 | Phase 4 | Pending |
| UI-04 | Phase 4 | Pending |
| TEST-01 | Phase 5 | Pending |
| TEST-02 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-02*
*Last updated: 2026-06-02 after initial definition*
