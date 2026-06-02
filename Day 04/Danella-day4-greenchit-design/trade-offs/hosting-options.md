# GreenChit — Trade-offs and Design Review

## Setup
- Two architectural options under review
1. Azure App Service Monolith
2. Azure Container Apps Split Services

- Quality attributes weighted by team / business

| Quality Attribute            | Weight | Option A App Service | Option B Container Apps | Why                                           |
| ---------------------------- | ------ | -------------------- | ----------------------- | --------------------------------------------- |
| Time-to-first-deploy         | 5      | 5                    | 2                       | App Service requires fewer platform decisions |
| Cost (low spend)             | 5      | 5                    | 2                       | Fewer resources and operational components    |
| Operability (10-person team) | 4      | 4                    | 3                       | Easier troubleshooting                        |
| Independent Deployments      | 3      | 1                    | 5                       | Microservices excel here                      |
| Future Scaling               | 4      | 2                    | 5                       | Services can scale independently              |
| Auth Consistency             | 3      | 2                    | 3                       | Single deployment simplifies auth             |
| Availability                 | 4      | 4                    | 4                       | Both can meet SLA                             |
| Audit Compliance             | 5      | 5                    | 5                       | Independent of hosting choice                 |

| Option         | Score |
| -------------- | ----- |
| App Service    | 30    |
| Container Apps | 29    |

## Results Summary

| Metric                                   | Target | Achieved |
| ---------------------------------------- | ------ | -------- |
| Quality attributes scored                | 6      | 8        |
| Cells with written justification         | 12     | 16       |
| Decision-affecting attributes identified | 2-3    | 3        |


## Decision and rationale
- Which option won, and which one or two attributes drove the decision

Option A (Azure App Service Monolith) wins narrowly.

Primary drivers:

1. Time-to-first-deploy
2. Operational simplicity
3. Lower cost

The scalability advantages of Container Apps do not currently outweigh the business need for rapid delivery and straightforward operations.

## Design review feedback (received from another pair)
- 3 strengths
- 3 weaknesses or risks
- 2 actionable improvements

## Design review feedback (given to another pair)
- 3 strengths

- 3 weaknesses or risks

- 2 actionable improvements


