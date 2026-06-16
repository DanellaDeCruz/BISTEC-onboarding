# Ticket Triage Tool — PRD

## 1. Persona
### Primary User: PMO Coordinator

**Role:** Project Management Office (PMO) Coordinator

**Context:**
PMO reviews incoming operational, support, and product tickets submitted by internal teams. He is responsible for identifying urgent issues, assigning priorities and routing tickets to the appropriate owner.

**Pain Point:**
The current process relies on spreadsheets and ad hoc communication. Ticket priorities are inconsistent, ownership is unclear and urgent issues can be overlooked during busy periods.

## 2. Problem Statement

The PMO currently manages incoming tickets using manually maintained spreadsheets. As ticket volume increases, PMO staff spend excessive time reviewing, categorizing and assigning work.

Measured issues include:

* Ticket review sessions take approximately 20 minutes per day.
* Critical tickets are mixed with low-priority requests.
* Ownership information is often missing or outdated.
* There is no consistent method of grouping tickets by urgency.

A lightweight ticket triage dashboard is required to centralize ticket review, standardize prioritization and improve assignment visibility.

## 3. Goals & Non-Goals

### Goals

1. Allow PMO staff to view all open tickets from a centralized dashboard.
2. Allow PMO staff to assign ticket priority levels (P0, P1, P2).
3. Allow PMO staff to assign ticket ownership.
4. Display ticket counts grouped by priority.
5. Reduce average ticket triage time from 20 minutes to less than 5 minutes per review session.

### Non-Goals

The initial release will NOT include:

* Authentication or user management
* Ticket creation workflows
* Ticket comments or collaboration features
* Email notifications
* Multi-user concurrency controls
* Integration with external ticketing platforms

## 4. Functional Requirements

### FR-1: View Open Tickets

PMO staff shall be able to view all open tickets loaded from a seed dataset.

#### Acceptance Criteria

**Given** open tickets exist in the system

**When** a PMO staff member opens the dashboard

**Then** all open tickets are displayed

### FR-2: Update Ticket Priority

PMO staff shall be able to assign a priority level to a ticket.

Allowed priorities:

* P0 (Critical)
* P1 (High)
* P2 (Normal)

#### Acceptance Criteria

**Given** a ticket exists

**When** a PMO staff member updates the priority

**Then** the ticket priority is saved successfully

### FR-3: Assign Ticket Owner

PMO staff shall be able to assign an owner to a ticket.

#### Acceptance Criteria

**Given** a ticket exists

**When** a PMO staff member selects an owner

**Then** the owner is saved and displayed on the dashboard

### FR-4: Group Tickets by Priority

The dashboard shall group tickets by priority level.

#### Acceptance Criteria

**Given** tickets exist with different priorities

**When** the dashboard loads

**Then** tickets are displayed within P0, P1, and P2 sections

### FR-5: Expose Ticket API

The system shall expose REST endpoints for ticket retrieval and updates.

Endpoints:

* GET /tickets
* PATCH /tickets/:id

#### Acceptance Criteria

**Given** valid requests are submitted

**When** the API is called

**Then** valid JSON responses are returned

**And** PATCH requests are validated before persistence

## 5. Non-Functional Requirements

### Performance

* Initial dashboard render must complete within 1.5 seconds on localhost.
* API response p95 latency must remain below 150ms using seed data.
* Dashboard data retrieval should complete in fewer than 500ms under normal conditions.

### Reliability

* CI pipeline success rate target: 100% on main branch.
* Build process must complete successfully before merge.

### Maintainability

* TypeScript strict mode enabled.
* Zero usage of `any` types throughout the codebase.
* All commits must follow Conventional Commits format.

### Delivery

* GitHub Actions pipeline duration must remain below 3 minutes.
* Linting, type checking, testing and build validation are mandatory.

### Observability

* API validation failures must return structured error responses.
* Build and test failures must be visible through GitHub Actions logs.



# Architecture Decision Records
## ADR-001: Framework Choice — Next.js 15

### Status

Accepted

### Context

The Ticket Triage Tool requires:

* Server-rendered dashboard pages
* API endpoints
* TypeScript support
* Rapid scaffolding through Claude Code
* Minimal infrastructure complexity

Several framework options were evaluated.

### Options Considered

#### Option A — Next.js 15

Pros:

* Integrated frontend and API routing
* App Router architecture
* Strong TypeScript support
* Well-supported by AI code generation tools
* Simple deployment model

Cons:

* Framework conventions must be followed

#### Option B — React + Express

Pros:

* Clear frontend/backend separation
* Flexible architecture

Cons:

* More setup and configuration
* Additional deployment complexity
* Increased boilerplate

#### Option C — Remix

Pros:

* Excellent data-loading model
* Modern routing

Cons:

* Smaller ecosystem
* Less organizational familiarity

### Decision

Use Next.js 15 App Router.

### Consequences

Positive:

* Faster implementation
* Reduced boilerplate
* Single deployment artifact
* Simplified routing model

Negative:

* Tighter coupling to framework conventions
* Less flexibility than separate frontend/backend architecture

## ADR-002: Data Layer Choice — Prisma + SQLite

### Status

Accepted

### Context

The application requires:

* Persistent ticket storage
* Simple local development
* Fast scaffold generation
* Strong type safety

### Options Considered

#### Option A — Prisma + SQLite

Pros:

* Zero infrastructure requirements
* Type-safe database access
* Fast local setup
* Excellent TypeScript integration

Cons:

* SQLite not suitable for high-concurrency production workloads

#### Option B — PostgreSQL

Pros:

* Production-grade scalability
* Advanced querying capabilities

Cons:

* Requires database provisioning
* Additional setup complexity

#### Option C — Raw SQLite Driver

Pros:

* Minimal dependencies
* Lightweight runtime

Cons:

* Manual query management
* Reduced type safety
* Higher maintenance burden

### Decision

Use Prisma ORM with SQLite.

### Consequences

Positive:

* Rapid developer onboarding
* Type-safe data access
* Simple local execution
* Easy migration management

Negative:

* Limited scalability compared to PostgreSQL
* Future migration may be required for enterprise workloads

