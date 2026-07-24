# Forge — Detailed Project Plan

> **Enterprise Sales Force Automation (SFA) & Field Operations Management Platform**
> Gamified field-meeting logging, approval workflows, and business intelligence.

**Document owner:** Project Management
**Status:** Planning / Pre-development
**Stack:** React (Amplify) · Node.js + Express on Lambda · API Gateway · DynamoDB · S3 · Cognito

---

## 1. Executive Summary

The platform replaces the question *"What task did the employee complete?"* with *"How many business meetings did the employee conduct today?"*

Field executives log their client meetings — with a **photo and details** — directly from the field. **Managers review and approve** each submission. An automated **points engine** converts approved meetings into a gamified **leaderboard**, and all activity rolls up into **manager** and **admin business-intelligence dashboards**.

The trust model is **human review**: the uploaded photo and meeting details are the evidence a manager uses to approve or reject. There is no automated photo/GPS fraud detection — the manager is the verifier. This keeps the product simple and the frontend lightweight (standard gallery upload, no special camera stack).

The three parts that make or break this build are the **points/leaderboard engine**, the **approval workflow**, and **analytics on DynamoDB**. Those get deliberate design below; everything else is standard execution.

---

## 2. What Changed From the Original Idea (PM Analysis)

| Original framing | New framing | Implication |
|---|---|---|
| Task Management System | Sales Force Automation + Field Ops | Core entity is a "meeting," not a "task" |
| Queue-limited submissions | Unlimited submissions | Throughput/scale matters; dashboards must aggregate, not scan |
| Completion-focused | Business-activity focused | Points engine + approval pipeline are the spine |
| Simple roles | 3-tier hierarchy (Admin → Manager → User) | RBAC + data-scoping enforced on every request |
| CRUD app | BI platform | Analytics/aggregation is a first-class subsystem |

**Bottom line:** This is a **logging + approval + gamification + analytics** system. The photo is documentary evidence for a human approver, not a security control. The hard parts are the points/leaderboard engine and doing analytics correctly on DynamoDB — design those before building UI.

---

## 3. Critical Insights & Risks (Read This First)

These decisions change the architecture, not just the code.

### 3.1 DynamoDB is not MongoDB — "collections" thinking will fail
- The overview lists collections (Users, Meetings, Leaderboards, PointsHistory…). In DynamoDB you **do not design tables around entities — you design around access patterns.**
- Naive per-entity tables + `Scan` for dashboards will be **slow and expensive** at scale.
- **Recommendation:** A **single-table design** (or a few purpose-built tables) driven by the access-pattern catalog in §5, plus a **separate read/analytics path** (§8).

### 3.2 Analytics dashboards cannot run on raw DynamoDB
- The admin dashboard (20+ charts, filters by date/region/manager/user/type/status) is effectively an **OLAP workload**. DynamoDB is OLTP. You cannot `GROUP BY region, month` efficiently.
- **Recommendation:** A **CQRS-style split** — DynamoDB for writes/transactions, and **pre-computed aggregates** (via DynamoDB Streams → Lambda) for dashboards. For heavy ad-hoc analytics later, stream to **S3 + Athena** or **OpenSearch**. *(See §8.)*

### 3.3 Points must be awarded exactly once (idempotency)
- Double-approval, retries, or race conditions **cannot** double-award points. This requires **conditional writes / transactions** and an idempotency guard per meeting.

### 3.4 Leaderboard ranking is a known-hard pattern on DynamoDB
- "Rank me and show the gap to the next person" over thousands of users is not a native DynamoDB query.
- **Recommendation:** Maintain a **running points total per user** (atomic counter), rank via a **GSI sorted by points**, and recompute exact ranks on a schedule / on-approval. Redis (ElastiCache) sorted sets are the "real-time" upgrade path if needed later.

### 3.5 Photo upload should bypass Lambda
- Photos must go **browser → S3 directly via presigned URLs**, not through Lambda (6MB payload limit, cost, latency). The API only issues the presigned URL and later stores the S3 key.

### 3.6 Field connectivity — optional offline capture
- Field executives sometimes work in low-signal areas. Losing a submission to a dropped request is frustrating.
- **Recommendation (V1.5+):** Local draft queue (IndexedDB) + background sync. Flag for MVP scope decision.

---

## 4. System Architecture (AWS Serverless)

### 4.1 High-level flow

```
                          ┌────────────────────────────┐
                          │         React SPA          │
                          │  (AWS Amplify Hosting/CDN)  │
                          └──────────────┬─────────────┘
                                         │ HTTPS + JWT (Cognito)
                    ┌────────────────────┼─────────────────────┐
                    │                    │                     │
              ┌─────▼─────┐        ┌─────▼──────┐       ┌───────▼────────┐
              │  Cognito  │        │    API     │       │   S3 (direct    │
              │ User Pools│        │  Gateway   │       │ presigned PUT   │
              │ + Groups  │        │ (REST/HTTP)│       │  photo upload)  │
              └───────────┘        └─────┬──────┘       └───────┬────────┘
                                         │                      │ ObjectCreated
                              ┌──────────▼──────────┐    ┌──────▼───────┐
                              │   Lambda (Express    │    │   Lambda     │
                              │  via serverless-http)│    │ (thumbnail / │
                              │  Auth · Meetings ·   │    │  resize —    │
                              │  Approvals · Points  │    │  optional)   │
                              └──────────┬───────────┘    └──────────────┘
                                         │
                       ┌─────────────────┼──────────────────┐
                       │                 │                  │
                ┌──────▼──────┐   ┌───────▼───────┐   ┌──────▼──────┐
                │  DynamoDB   │   │  DynamoDB      │   │  DynamoDB   │
                │  (core /    │──▶│  Streams →     │──▶│  Aggregates │
                │ single-tbl) │   │  Lambda        │   │  / Leaderbd │
                └─────────────┘   └───────┬────────┘   └─────────────┘
                                          │ (analytics path)
                                   ┌──────▼───────┐
                                   │ S3 + Athena / │
                                   │  OpenSearch   │  ← reporting & ad-hoc BI
                                   └──────────────┘
```

### 4.2 Component responsibilities

| Layer | Service | Responsibility |
|---|---|---|
| Frontend | React SPA on **Amplify** | Role-based UI, photo upload, meeting forms, dashboards, leaderboard |
| Auth | **Cognito User Pools + Groups** | Login, JWT issuance, RBAC groups (`Admin`, `Manager`, `User`) |
| Edge | **API Gateway** | Routing, JWT authorizer, throttling, CORS |
| Compute | **Lambda** running Express (`serverless-http`) | Business logic, validation, points engine, approvals |
| Photo storage | **S3** | Direct browser→S3 via **presigned URLs** (never through Lambda) |
| Image processing | **Lambda** (S3 trigger, optional) | Thumbnail/resize for fast dashboard & gallery loading |
| Core data | **DynamoDB** | Single-table OLTP for users, meetings, approvals, points |
| Aggregation | **DynamoDB Streams + Lambda** | Maintain leaderboards & dashboard counters in real time |
| Analytics/reports | **S3 + Athena** (or OpenSearch) | Heavy queries, PDF/Excel report generation |
| Notifications | **SNS / SES** + WebSocket API (later) | Approval/rejection alerts, rank changes, manager queues |

### 4.3 Key architectural decisions (with rationale)
- **Express-on-Lambda via `serverless-http`** — develop/test a normal Express app locally, deploy the same code to Lambda. Familiar, low-risk. *(Split into small single-purpose Lambdas later if cost/perf demands.)*
- **Presigned S3 uploads** — Lambda has a 6MB payload limit and photos shouldn't flow through compute. Browser requests a presigned URL, uploads **directly** to S3, then submits the meeting referencing the S3 key.
- **Cognito Groups for RBAC** — `Admin`/`Manager`/`User` become JWT claims; API Gateway + Lambda enforce data scope on every call. No custom auth to maintain.
- **CQRS split** — writes go to DynamoDB; dashboard reads come from pre-aggregated tables. Never scan the transaction table for a chart.

---

## 5. Data Model — DynamoDB (Access-Pattern-Driven)

> **Principle:** design the queries first, then the keys.

### 5.1 Access patterns to support
1. Get user by ID; list users by manager; list users by region.
2. Create meeting; get meeting by ID.
3. List a user's meetings by date range.
4. List a manager's **pending** approvals (the review queue).
5. List meetings by region / status / type for dashboards (via aggregates).
6. Get a user's points total + rank (weekly / monthly / all-time).
7. Get top-N leaderboard (global, by manager, by region).
8. Points history / audit trail for a user.
9. System settings (points rules) read on every approval.

### 5.2 Single-table key design (illustrative)

| Entity | PK | SK | Key GSIs |
|---|---|---|---|
| User | `USER#<userId>` | `PROFILE` | GSI1: `MANAGER#<mgrId>` / `USER#<userId>` (team lookup) |
| Meeting | `USER#<userId>` | `MEETING#<ts>#<meetingId>` | GSI1: `MGR#<mgrId>#STATUS#PENDING` / `<ts>` (review queue); GSI2: `REGION#<r>#<yyyymm>` (region rollups) |
| Approval event | `MEETING#<meetingId>` | `APPROVAL#<ts>` | — |
| Points ledger | `USER#<userId>` | `POINTS#<ts>#<meetingId>` | append-only, immutable |
| Leaderboard total | `LB#<scope>` (e.g. `LB#ALLTIME`, `LB#2026-W29`) | `USER#<userId>` w/ `points` attr | GSI: sorted by points for top-N |
| System settings | `CONFIG` | `POINTS_RULES` | single item, versioned |
| Audit log | `AUDIT#<yyyymmdd>` | `<ts>#<actor>` | append-only |

**Notes**
- **Points ledger is append-only and immutable** — every award/deduction is a line item referencing the meeting and the *rule version* that produced it. Source of truth + audit trail; the "total" items are derived.
- **Leaderboard totals** are updated atomically by the Streams aggregator, never computed on read.
- Photos live in **S3**; DynamoDB stores only the S3 key + basic metadata (uploaded-at, size, optional caption).

### 5.3 Meeting record — canonical fields

```jsonc
{
  "meetingId": "uuid",
  "type": "ONE_TO_ONE | GROUP",
  "employeeId": "…", "managerId": "…", "region": "…",   // region from user profile
  "customer": { "name": "…", "phone": "…", "address": "…" },        // one-to-one
  "group":    { "name": "…", "attendees": 20, "attendeeList": [] }, // group
  "photo": {
    "s3Key": "photos/2026/07/uuid.jpg",
    "thumbKey": "thumbs/2026/07/uuid.jpg",
    "uploadedAt": "ISO", "sizeBytes": 0, "caption": "…"
  },
  "location": { "lat": 0.0, "lng": 0.0 },   // REQUIRED — captured from the device at upload time, burned into the photo watermark
  "business": { "purpose": "…", "interestLevel": "HIGH|MED|LOW",
                "followUpRequired": true, "priority": "…", "outcome": "…", "remarks": "…" },
  "status": "PENDING | APPROVED | REJECTED | MODIFICATION_REQUESTED",
  "review": { "reviewerId": "…", "reviewedAt": "ISO", "reason": "…", "qualityScore": "1-5, optional" },
  "points":  { "awarded": 0, "ruleVersion": "v3", "breakdown": [] },
  "createdAt": "ISO", "submissionId": "…"
}
```

> **Location is required.** As of Phase 1, the photo upload flow captures the device's real GPS position at submission time and burns a timestamp + lat/lng watermark into the image client-side before it uploads (see §6.2). This is not a live-camera lock — the existing gallery/file picker is kept — but `location` is now a mandatory field, not optional metadata.

---

## 6. Core Modules & How They Work

### 6.1 Authentication & RBAC
- Cognito login → JWT with `cognito:groups` claim.
- API Gateway **JWT authorizer** validates every request.
- Lambda middleware enforces **data scoping**:
  - `User` → only own records.
  - `Manager` → only records where `managerId = self` (their team).
  - `Admin` → everything.
- **Every** query is scoped by identity server-side. Never trust a client-supplied `managerId`/`userId`.

### 6.2 Meeting Submission (the heart)
Flow:
1. User picks type (1:1 or Group) and fills the form.
2. User **selects/uploads a photo** (the gallery/file picker is kept — this is intentionally not a locked-down live camera capture).
3. The app captures the device's current GPS position and burns a timestamp + lat/lng watermark bar into the bottom of the image client-side (canvas), before anything is uploaded.
4. App requests a **presigned S3 URL** → uploads the watermarked photo directly to S3.
5. *(Optional)* `ObjectCreated` triggers a Lambda to generate a **thumbnail** for fast dashboard/gallery loading.
6. App submits the meeting (referencing the S3 key + form details + the captured GPS location, now required) to the API.
7. Server validates required fields (including `location`), writes the meeting as `PENDING`.

*Still no live camera lock and no automated fraud detection — the photo carries a visible GPS/timestamp watermark as documentary evidence, and the manager remains the verifier.*

### 6.3 Approval Workflow (the trust layer)
- Manager review queue = GSI query on `MGR#<id>#STATUS#PENDING`, sorted **oldest-first** with derived aging metadata (`ageHours`, `slaBreached` against the admin-configurable `approvalSlaHours`) so overdue reviews surface first.
- Manager sees the **photo + all details** and decides.
- Actions: **Approve** (optionally with a 1–5 **quality score**) / **Reject (reason required)** / **Request Modification**.
- On **Approve** → **Points Engine** runs inside a **DynamoDB transaction**:
  - write approval event, append points ledger line(s), increment leaderboard totals, flip status — **all-or-nothing, idempotent** (guarded by meeting status condition).
- On **Reject** → status flips, reason stored, 0 points, user notified.

> With automated verification removed, the **manager's judgment on the photo is the verification.** The workflow must make that review fast and clear (big photo, all fields, one-tap approve/reject) — now with aging/SLA visibility so pending reviews don't sit forever.

### 6.4 Points Engine (configurable rules)
- Rules live in `CONFIG / POINTS_RULES`, **versioned**, editable by Admin — **never hardcoded**.
- Evaluated at approval time; result + rule version stamped onto the meeting and ledger.
- Example rule set:

| Rule | Effect |
|---|---|
| One-to-One meeting | +10 |
| Group meeting | +25 |
| Premium client | +20 |
| Early submission | +5 |
| Late submission | −5 |
| Rejected | 0 |
| Duplicate customer *(optional business rule)* | 0 |

- **Auditability:** each award stores its rule version, so changing rules later never rewrites history.

### 6.5 Leaderboard
- Totals maintained by the Streams aggregator (weekly/monthly/all-time scopes).
- Top-N via GSI sorted by points.
- "Your rank + gap to next" computed against the scoped leaderboard.
- **Badges** (Top Performer, Fast Starter, 100 Meetings Club, Best Consistency) awarded by a scheduled evaluator Lambda.

### 6.6 Dashboards (Manager & Admin)
- **Never** built from live scans. Read from **pre-aggregated counters** maintained by Streams (meetings today, approval rate, type distribution, points distribution, per-user comparison, region rollups).
- Filters (date/manager/user/region/type/status) map to aggregate partitions; heavy/ad-hoc filters route to the **Athena/OpenSearch** analytics path.

### 6.7 Reports (PDF / Excel / CSV)
- Generated **asynchronously**: request → Lambda job → build file → store in S3 → return a presigned download link (avoids API Gateway timeouts on large reports).

### 6.8 Notifications
- MVP: in-app + email (**SES**) for approval/rejection, points earned, rank change; manager pending-queue digest; admin low-activity/top-performer alerts.
- V2: real-time via **API Gateway WebSockets** and/or web push.

---

## 7. Trust Model & Data Integrity (Lightweight)

With no automated photo/GPS verification, trust and data quality come from a few simple, cheap controls:

| Control | Purpose |
|---|---|
| **Manager approval** | The primary verification — a human reviews photo + details before points are awarded. |
| **Required fields** | Enforce photo + mandatory details on submission; reject incomplete records server-side. |
| **Duplicate customer rule (optional)** | Same customer phone within N days scores 0 — a business rule, not fraud detection. Simple lookup, easy to add later. |
| **Idempotent points writes** | Prevent double-awarding on retries/double-clicks (transactional, status-guarded). |
| **Audit log** | Every approve/reject/edit recorded with actor + timestamp for accountability. |
| **RBAC scoping** | Users can't see or submit on behalf of others; managers only touch their team. |

This is deliberately minimal. If fraud ever becomes a real concern, the anti-fraud layer (image-hash reuse, GPS cross-check, velocity limits) can be added later without changing the data model.

---

## 8. Analytics & Reporting Architecture (CQRS)

- **Write side:** DynamoDB (OLTP), transactional, source of truth.
- **Aggregation:** DynamoDB Streams → Lambda maintains counters (daily meetings, approval rate, type split, region/manager/user rollups, points growth).
- **Read side (dashboards):** query aggregates directly — fast, cheap, no scans.
- **Heavy/ad-hoc BI & reports:** stream events to **S3 (partitioned by date/region)** → **Athena** for SQL analytics; or **OpenSearch** for rich filtering/geo/heatmaps. Reports generated from this path.

This separation is what lets the admin dashboard have 20+ charts without melting DynamoDB.

---

## 9. Delivery Roadmap (Phased)

> Ship the **submit → approve → points → leaderboard** loop first. Everything else amplifies it.

### Phase 0 — Foundations (Week 1–2)
- AWS accounts, IaC (SAM/CDK/Serverless Framework), CI/CD, environments (dev/stage/prod).
- Cognito user pool + 3 groups; API Gateway + Express-on-Lambda skeleton; base DynamoDB table; S3 bucket + presigned-URL endpoint.
- **Exit:** a logged-in user can hit an authenticated `/health` and get a presigned URL.

### Phase 1 — MVP: The Core Loop (Week 3–5)
- Meeting submission (1:1 + Group) with **gallery photo upload** + details.
- Manager review queue: approve / reject / request modification.
- Points engine (configurable rules) + append-only ledger.
- Basic leaderboard (all-time) + user dashboard with today's count.
- **Exit:** a full submit → review → points → leaderboard cycle works end-to-end. **This is the demoable product.**

### Phase 2 — Manager & Admin Intelligence (Week 6–9)
- Streams aggregation pipeline; manager dashboard (team KPIs + core charts).
- Admin dashboard (org KPIs, trends, manager/region/user rankings).
- Weekly/monthly leaderboard scopes + badges.
- Notifications (email + in-app).

### Phase 3 — BI, Reports & Hardening (Week 10–12)
- Athena/OpenSearch analytics path; full filter matrix; maps/heatmaps.
- PDF/Excel/CSV report generation.
- Audit logs, security review, load testing.

### Phase 4 — Field-Grade UX (V1.5 / V2)
- Optional offline draft capture + background sync (PWA/IndexedDB).
- Real-time notifications (WebSockets/push).
- Customer-acquisition funnel, advanced gamification, region maps.

---

## 10. Team & Ownership (suggested)
- **Frontend (React):** meeting forms + photo upload, dashboards, leaderboard, role-based UI.
- **Backend (Node/Lambda):** API, points engine, approval transactions, aggregation.
- **Cloud/DevOps:** IaC, Cognito, API Gateway, S3, CI/CD, monitoring/cost.
- **PM/QA:** access-pattern sign-off, approval-flow UAT with real field users.

---

## 11. Non-Functional Requirements
- **Security:** JWT auth, RBAC + server-side scoping, encryption-at-rest (DynamoDB/S3), HTTPS everywhere, least-privilege IAM, audit logs, presigned-URL expiry.
- **Performance:** dashboards from aggregates (<1s); direct-to-S3 uploads; consider provisioned concurrency for hot Lambdas.
- **Scalability:** DynamoDB on-demand to start; access-pattern design prevents hot partitions.
- **Cost:** watch Lambda invocations, DynamoDB RCU/WCU, S3 storage/lifecycle (archive old photos to cheaper tiers).
- **Reliability:** idempotent points writes; DLQs on async Lambdas; retries with backoff.
- **Observability:** CloudWatch metrics/alarms, structured logs, X-Ray tracing on the critical path.

---

## 12. Key Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| DynamoDB modeled like MongoDB | Slow, costly, rework | Access-pattern-first single-table design; review before coding |
| Analytics on raw tables | Dashboards unusable at scale | CQRS + Streams aggregation + Athena/OpenSearch |
| Double-awarded points | Corrupt leaderboard, lost trust | Transactional, idempotent, status-guarded writes |
| Slow/overloaded manager review | Bottleneck; users wait for points | Fast review UI; pending-queue digests; SLA tracking |
| Scope creep (20+ charts up front) | Delays core loop | Ship Phase 1 loop first; charts are Phase 2+ |
| Field connectivity loss | Lost submissions | Optional offline draft queue (Phase 4) |
| Lambda cold starts on submit | Poor field UX | Provisioned concurrency on hot paths; lean bundles |

---

## 13. Success Metrics
- Meetings/day per active user.
- Approval turnaround time (submit → review).
- Approval vs. rejection rate.
- Active vs. inactive users; leaderboard engagement.
- Manager review SLA adherence.
- System: p95 API latency, upload success rate, dashboard load time, cost per 1k meetings.

---

## 14. Open Decisions (Need Your Input)

1. **Capture GPS at all?** Do you want optional best-effort location for the map/region charts, or is region purely derived from the user's assigned region? *(Recommendation: derive region from profile; GPS optional/nice-to-have.)*
2. **Offline capture in MVP or later?** Depends on how bad field connectivity is for your users. *(Recommendation: later.)*
3. **Real-time leaderboard (Redis) vs. near-real-time (DynamoDB + recompute)?** *(Recommendation: DynamoDB for MVP; Redis only if instant rank updates are demanded.)*
4. **Regions model** — fixed list, hierarchical (state→city), or free-form? Affects region analytics keys.
5. **Premium client / interest levels** — who sets them, and do they affect points automatically?
6. **Manager reassignment** — when a user moves managers, do historical meetings/points follow them? (Affects data model + reporting.)
7. **Data retention** — how long are meeting photos kept? (Cost + compliance; drives S3 lifecycle rules.)
8. **Single-table vs. multi-table DynamoDB** — recommend single-table; confirm the team is comfortable operating it.

---

## 15. Immediate Next Steps
1. Answer the Open Decisions in §14.
2. Lock the **access-pattern catalog** (§5.1) — no DynamoDB keys until this is signed off.
3. Choose IaC tool (SAM / CDK / Serverless Framework) and stand up Phase 0.
4. Build a **thin vertical slice** of the core loop (submit → approve → points → leaderboard) before broadening.
5. Define the approval-flow UX with a real field user + manager in the room.

---

*This plan is opinionated on the two hard problems — the points/leaderboard engine and analytics on DynamoDB — because those are where projects like this succeed or fail. With automated verification removed, the manager approval step is your trust layer; keep that review flow fast and clear.*
