# BookSwap — SLI/SLO Map

# 1. NFR Inventory

| # | NFR (from Day 2 / Day 3) | User-visible behaviour |
|---|---------------------------|------------------------|
| 1 | Catalogue search under 800 ms | Members receive fast search results |
| 2 | Listing creation 99.9% successful | Members can reliably create listings |
| 3 | System handles 10× traffic spike | Listings continue working during traffic surge |
| 4 | Search works even with cold cache | Members still receive useful results |
| 5 | JWT required on protected endpoints | Only authenticated users can access data |
| 6 | Tokens expire within 1 hour | Sessions are limited for security |
| 7 | Loan history privacy | Members cannot see other users’ data |
| 8 | Outage detection within 3 minutes | Operations team alerted quickly |
| 9 | Operations health visibility within 5 minutes | Team can rapidly confirm system health |
| 10 | Audit logging for auth and loans | Security and operational events are traceable |


# 2. SLI / SLO Table

| # | SLI Definition | Measurement Source | SLO Target | Window | Error Budget |
|---|----------------|-------------------|------------|--------|--------------|
| 1 | Percentage of `/books` requests completed under 800 ms | Azure Application Insights | 99% under 800 ms | Rolling 28 days | 1% |
| 2 | Successful listing creation requests | App Insights + API logs | 99.9% success | Rolling 30 days | 0.1% |
| 3 | API availability for listing endpoints | Azure Monitor uptime checks | 99.95% availability | Rolling 30 days | 0.05% |
| 4 | Queue delivery success for notifications | Azure Service Bus metrics | 99% successful queue delivery | Rolling 30 days | 1% |
| 5 | Authentication validation success | Azure Monitor logs | 100% protected endpoints require JWT | Continuous | 0% |
| 6 | Detection time for listings outage | Azure Monitor alert rules | Alert within 3 minutes | Per incident | 3 minutes |
| 7 | Search success rate during cache outage | App Insights traces | 95% successful searches | Rolling 30 days | 5% |
| 8 | Time for operations team to confirm health | Dashboards + App Insights | Under 5 minutes | Per incident | 5 minutes |
| 9 | Audit log completeness for auth failures and loans | Azure Monitor Logs | 100% logged with request ID and member ID | Continuous|0% |

# 3. Error budget policy
- What the team stops doing when the budget is exhausted

If the search latency SLO or listing availability SLO is exhausted, the team pauses all non-critical feature development and focuses only on reliability improvements, bug fixes, and scaling work.

- Who owns the decision

Product managers and the engineering lead jointly decide when development freeze periods begin and end.
During an exhausted error budget period, deployment frequency may be reduced to minimize operational risk.

# 4. Out of Budget Right Now

- One sentence: which SLO would you bet you cannot meet today and why
The SLO most likely to fail today is the “99% of catalogue searches under 800 ms during a 10× traffic spike” target because the current design does not yet include load testing results or database scaling validation under sustained spike traffic.