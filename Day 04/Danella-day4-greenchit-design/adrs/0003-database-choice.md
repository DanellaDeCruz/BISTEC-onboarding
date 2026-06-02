ADR 0003: Database Choice
Status

Accepted (date: 2026-07-01)

## Context
Strong relational data model.
Claims require transactions.
Team already has SQL expertise.
Reporting and exports are required.

## Decision

We will use Azure SQL Database.

## Consequences
Easier:

ACID transactions
Reporting queries
Referential integrity

Harder:

Horizontal scaling is more limited than Cosmos DB

Different:
Schema migrations become part of release process

Alternatives Considered:
- Cosmos DB
Rejected because claim data is highly relational and transactional.

- PostgreSQL
Rejected because Azure SQL aligns better with existing team skills.