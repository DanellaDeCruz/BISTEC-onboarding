ADR 0002: Hosting Platform
Status

Accepted (date: 2026-07-01)

## Context
Team size is approximately 10 engineers.
Business prefers rapid delivery.
Availability target is 99.9%.
Future growth is expected but not immediate.

## Decision

We will host GreenChit as a modular monolith on Azure App Service.

## Consequences

Easier:

Faster deployment
Simpler operations
Lower cost

Harder:

Independent scaling is limited
Service boundaries are less explicit

Different: 

Future microservice extraction may require refactoring

Alternatives Considered:
- Azure Container Apps
Rejected due to higher operational complexity for the current team size.

- AKS
Rejected because platform overhead is unjustified.