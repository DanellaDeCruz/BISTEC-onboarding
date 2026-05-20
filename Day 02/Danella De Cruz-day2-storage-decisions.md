# BookSwap — Storage and Cache Decisions

## 1. Data inventory
| Data type | Example record | Volume estimate (1y) | Read/write ratio |
|-----------|----------------|----------------------|------------------|
| Book listing | one row per book | ~50,000 across all buildings | read-heavy |
| ...

## 2. Storage selection
| Data type | Chosen store | Why this store | Why not the alternatives |
|-----------|--------------|----------------|--------------------------|
| Book listing | Azure SQL | Relational with FK to member | Document DB unnecessary, relational joins useful |
| Book photo | Azure Blob Storage | Binary, big | Database BLOBs would bloat backups |
| ...

## 3. Cache plan
- What is hot enough to cache?
- Cache-aside pattern in pseudocode
- TTL choice and invalidation strategy

## 4. Queue plan
- Which work goes on a queue and why
- What happens if the consumer is down for 30 minutes