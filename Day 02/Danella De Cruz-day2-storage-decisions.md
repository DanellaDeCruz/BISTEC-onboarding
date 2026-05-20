# BookSwap — Storage and Cache Decisions

## 1. Data inventory
| Data type | Example record | Volume estimate (1y) | Read/write ratio |
|-----------|----------------|----------------------|------------------|
| Book listing | one row per book | ~50,000 across all buildings | read-heavy |
| Book searching | search by title, author, ISBN or condition | 5,000 | write
|Borrow requests|Contains borrorwRequestId, bookId, memberId and status|~50,000| write
|Request handling|Contains RequestID and status|~50,000| write
|Loan tracking|Contains loanId, memberId, dueDate and status|~50,000|write

## 2. Storage selection
| Data type | Chosen store | Why this store | Why not the alternatives |
|-----------|--------------|----------------|--------------------------|
| Book listing | Azure SQL | Relational with FK to member | Document DB unnecessary, relational joins useful |
| Book photo | Azure Blob Storage | Binary, big | Database BLOBs would bloat backups |
| Book searching |Cache | Checks cache with key-value pair and returns the cached value | Faster than relational/document DB
| Book listing creation|Azure Communication Services Email|Queued so that user does not have to wait| Queue buffers async work
| Request handling|Microsoft Entra External ID|Event stream| Users can read the same stream at their own pace


## 3. Cache plan
- What is hot enough to cache?
User session tokens, most popular books

- Cache-aside pattern in pseudocode
1. read request for a specific book comes in
2. If book found return the cached value
3. Else read from the relational database
4. Store it in cache
5. On write update the database and then delete the cached entry

- TTL choice and invalidation strategy
Book search resulys cached for 60 seconds and on write Database is updated and the cached entry is deleted

## 4. Queue plan
- Which work goes on a queue and why
Book Listing creation: email service
So that the user does not have to wait for an email when listing a book

- What happens if the consumer is down for 30 minutes
The message request is moved to DLQ and It retries after 30 minutes without the producer knowing until service has been delivered succesfully.

