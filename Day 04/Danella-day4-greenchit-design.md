# GreenChit — Architecture Design Pack

## 1. System Context (one-paragraph recap of Day 1-style context)
GreenChit is an internal reimbursement management system for BISTEC employees. Staff members submit reimbursement claims with receipt attachments, managers review and approve or reject them, and finance exports approved claims to payroll. The system integrates with Microsoft Entra ID for authentication, Azure Blob Storage for receipt storage, Microsoft Teams and email for notifications, and SharePoint for payroll CSV delivery. The solution must provide secure role-based access, tamper-evident audit logging, and high availability during business hours.

## 2. Containers (C4 Level 2) — embedded PNG + table of containers

| Container           | Technology              | Responsibility                 |
| ------------------- | ----------------------- | ------------------------------ |
| GreenChit Web App   | React SPA               | User interface                 |
| Microsoft Entra ID  | Azure AD                | Authentication and SSO         |
| GreenChit API       | ASP.NET Core Web API    | Business logic                 |
| Azure SQL           | Azure SQL Database      | Claims, users, audit data      |
| Azure Blob Storage  | Blob Storage + SAS URLs | Receipt storage                |
| Azure Service Bus   | Messaging               | Asynchronous notifications     |
| Notification Worker | .NET Worker Service     | Teams and email delivery       |
| Microsoft Teams     | Adaptive Cards          | Manager approval notifications |
| SharePoint          | SharePoint Online       | CSV handoff                    |
| Payroll Automation  | Existing System         | Payroll processing             |

## 3. Components (C4 Level 3) for the API service — embedded PNG + table of components

| Component                | Responsibility                            |
| ------------------------ | ----------------------------------------- |
| Authentication Component | JWT validation and role checks            |
| Claims Service           | Claim lifecycle management                |
| Receipt Service          | SAS URL generation and receipt metadata   |
| Audit Service            | Audit trail recording and hash validation |
| Notification Publisher   | Publish events to Service Bus             |
| CSV Export Service       | Produce payroll CSV exports               |
| Claims Controller        | API endpoints                             |

## 4. Reading order — how a reviewer should walk through the diagrams

1. Start with the Container Diagram.
2. Observe users interacting with the Web App.
3. Follow authentication through Microsoft Entra ID.
4. Follow business operations through the GreenChit API.
5. Review persistent storage in Azure SQL and Blob Storage.
6. Observe asynchronous notifications through Service Bus.
7. Follow payroll export into SharePoint.
8. Zoom into the API using the Component Diagram.
9. Review how Claims Service orchestrates receipts, audit, and notifications.