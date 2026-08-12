# API Endpoint & Integration Reference

All backend service API endpoints are mapped to path coordinates beginning with `/api`. Authenticated endpoints check user authorization headers via Spring Security.

## 📡 REST Endpoint Directory

### Authentication & Users Module

| Endpoint | Method | Required Authority | Description |
| :--- | :--- | :--- | :--- |
| `/api/users/register` | `POST` | Public | Enrolls a new system user profile. |
| `/api/users` | `GET` | `USER_MANAGE` | Retrieves system user metadata. |
| `/api/users/{id}/role` | `PUT` | `ROLE_ASSIGN` | Changes a user's operational role. |
| `/api/users/{id}/disable` | `PUT` | `USER_MANAGE` | Enables or disables an active user registry. |
| `/api/users/{id}/reset-password` | `PUT` | `USER_MANAGE` | Performs an administrative password reset. |
| `/api/users/profile` | `PUT` | Authenticated | Updates current user's profile metadata. |

### Asset Management Module

| Endpoint | Method | Required Authority | Description |
| :--- | :--- | :--- | :--- |
| `/api/assets` | `GET` | `ASSET_VIEW` | Fetches active asset registry list. |
| `/api/assets/{id}` | `GET` | `ASSET_VIEW` | Fetches target asset details. |
| `/api/assets` | `POST` | `ASSET_CREATE` | Registers a new asset host configuration. |
| `/api/assets/{id}` | `PUT` | `ASSET_EDIT` | Edits asset configuration parameters. |
| `/api/assets/{id}` | `DELETE` | `ASSET_DELETE` | Retires a network asset from the platform. |

### Incident Response Module

| Endpoint | Method | Required Authority | Description |
| :--- | :--- | :--- | :--- |
| `/api/incidents` | `GET` | `INCIDENT_VIEW` | Fetches the list of active security incident tickets. |
| `/api/incidents/{id}` | `GET` | `INCIDENT_VIEW` | Fetches detailed incident ticket info. |
| `/api/incidents` | `POST` | `INCIDENT_CREATE` | Escalates/registers a new security incident. |
| `/api/incidents/{id}/status` | `PUT` | `INCIDENT_MANAGE` | Updates incident status (Open, Investigating). |
| `/api/incidents/{id}/resolve` | `PUT` | `INCIDENT_RESOLVE` | Marks an incident as resolved with diagnostic notes. |
| `/api/incidents/{id}` | `DELETE` | `INCIDENT_DELETE` | Deletes an incident ticket from logs. |

### Vulnerability & Compliance Module

| Endpoint | Method | Required Authority | Description |
| :--- | :--- | :--- | :--- |
| `/api/vulnerabilities` | `GET` | `VULN_MANAGE` | Retrieves active CVE logs and remediation plans. |
| `/api/vulnerabilities` | `POST` | `VULN_MANAGE` | Audits or registers a new CVE finding. |
| `/api/compliance` | `GET` | `COMPLIANCE_VIEW` | Evaluates framework compliance scores (SOC2, etc.). |

### Executive Dashboard Metrics

| Endpoint | Method | Required Authority | Description |
| :--- | :--- | :--- | :--- |
| `/api/dashboard/stats` | `GET` | Authenticated | Aggregates scorecards metrics (incident counters, assets count). |
| `/api/dashboard/incidents/status`| `GET` | Authenticated | Aggregates status counts (open/investigating/etc.).|
| `/api/dashboard/incidents/severity`| `GET` | Authenticated | Aggregates severity counts (critical/high/etc.). |
| `/api/dashboard/incidents/trend` | `GET` | Authenticated | Fetches incident trends tracking points. |
| `/api/dashboard/incidents/recent`| `GET` | Authenticated | Fetches recent incident logs. |
| `/api/dashboard/alerts/recent` | `GET` | Authenticated | Fetches recent real-time system alerts. |
| `/api/dashboard/audit-logs/recent`| `GET` | Authenticated | Fetches recent audit trails. |
| `/api/dashboard/user` | `GET` | Authenticated | Returns current session user DTO. |

### AI Assistant Module

| Endpoint | Method | Required Authority | Description |
| :--- | :--- | :--- | :--- |
| `/api/ai/chat` | `POST` | Public | Relays questions to the offline Grok SecOps Assistant. |
| `/api/ai/health` | `GET` | Authenticated | Diagnoses xAI/Grok external API integration health status. |

---

## 🛠️ Integrations Setup

### 1. Brevo Transactional Email Service
Email reports and security notifications are sent through the Brevo REST API utilizing `RestTemplate`.
- **Backend Class**: `EmailService`
- **Endpoints Intersected**:
  - `POST /api/reports/send-email`: Dispatches compiled reports to administrative contacts.
  - `POST /api/alerts/send-email`: Issues automated alerts on high-threat triggers.
- **Variables Required**:
  - `BREVO_API_KEY`: API authentication key.
  - `BREVO_SENDER_EMAIL`: Address from which system correspondence is dispatched.
  - `BREVO_SENDER_NAME`: Custom alias prefixing sent emails.

### 2. xAI Grok SecOps Assistant
Provides interactive chatbot support to search incident context and help answer operator requests.
- **Backend Class**: `GrokService`
- **Security Check**: Employs authenticated API calls through JSON parsing logic.
- **Model Target**: `grok-4.5`
- **Variables Required**:
  - `XAI_API_KEY`: API credential key.
