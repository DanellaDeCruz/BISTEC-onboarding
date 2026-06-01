ADR 0004: Receipt Storage and Virus Scanning
Status

Accepted (date: 2026-07-01)

Context
Receipts may contain malware.
Files up to 10 MB supported.
Security team requires scanning.
Decision

We will store receipts in Azure Blob Storage using SAS URLs and perform malware scanning before marking uploads as available.

Consequences
Easier
Scalable storage
Reduced API bandwidth
Better upload performance
Harder
Upload workflow becomes asynchronous
Additional operational monitoring required
Different
Receipt processing status becomes part of claim lifecycle
Alternatives Considered
Store Files in Azure SQL

Rejected due to storage cost and performance concerns.

Store Files on App Service Disk

Rejected because local storage is not durable.