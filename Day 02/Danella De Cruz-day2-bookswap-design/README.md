# BookSwap Container Diagram

1. Members interact with the system using the React Native mobile application.
2. The mobile application communicates with the Node.js Express API service over HTTPS/JSON.
3. The API service stores transactional data in Azure SQL and retrieves frequently accessed catalogue data from Azure Cache for Redis.
4. Book photos are uploaded to Azure Blob Storage, while authentication is handled through Microsoft Entra External ID.
5. Notifications and weekly digest emails are processed asynchronously through Azure Service Bus and Azure Communication Services Email.