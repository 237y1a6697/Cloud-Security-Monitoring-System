# Security & Role-Based Access Control (RBAC)

SentinelCore-SecureOps enforces standard enterprise security mechanisms including role-based authorizations, API protection filters, entity isolation, and aspect-oriented activity tracking.

## 🔐 Authentication Scheme

Security constraints are managed via **Spring Security 6**.
- **Credentials Policy**: User passwords are encrypted using `BCryptPasswordEncoder` before storage.
- **Session Policies**: Relies on stateful session cookies (`JSESSIONID`) protected with standard security directives (`SameSite=None`, `Secure`, `HttpOnly`).
- **Access Decisions**: Validates matching privileges before executing request mappings. If cross-origin credentials are missing or invalid, endpoints automatically yield `401 Unauthorized` responses.

---

## 🎖️ Authorization Matrix (RBAC)

The system defines **nineteen distinct permissions** mapping across **nine operational profiles**.

### 1. Permissions List

| Scope | Authority | Description |
| :--- | :--- | :--- |
| **System Administration** | `USER_MANAGE` | Create, disable, or modify operator profile accounts. |
| | `ROLE_ASSIGN` | Change an operator's security profile. |
| **Logins & Analysis** | `AUDIT_VIEW` | Read administrative system audit history. |
| **Asset Monitoring** | `ASSET_VIEW` | View tracked devices, servers, or endpoints. |
| | `ASSET_CREATE` | Add new hosts to the network registry. |
| | `ASSET_EDIT` | Update active host telemetry bounds. |
| | `ASSET_DELETE` | Remove a device from local asset tracking. |
| **Incident Response** | `INCIDENT_VIEW` | Read incident tickets. |
| | `INCIDENT_CREATE`| Report a new incident. |
| | `INCIDENT_MANAGE`| Update ticket technician assignments and severity. |
| | `INCIDENT_RESOLVE`| Log resolution steps. |
| | `INCIDENT_DELETE`| Erase ticket records from active queues. |
| **Infrastructure** | `SERVER_RESTART`| Restart virtual server frameworks. |
| | `CLUSTER_SCALE` | Resize container scaling limits. |
| | `CLOUD_MODIFY`  | Adjust deployment settings. |
| | `VULN_MANAGE`   | Access active CVE listings and patches. |
| | `COMPLIANCE_VIEW`| Verify compliance scores. |
| **Reports & Config** | `REPORT_EXPORT` | Export metrics as PDF templates. |
| | `SETTINGS_ACCESS`| Adjust dashboard lookups. |
| | `INTEGRATION_CONFIG`| Edit email alerts settings. |

### 2. Standard Roles Setup

1. **`ROLE_SUPER_ADMIN`**: Exercises complete access rights over the suite (holds all 19 permissions).
2. **`ROLE_ADMIN`**: Manages infrastructure settings and system users (holds core admin and config scopes).
3. **`ROLE_SOC_MANAGER`**: Oversees queue response, incident audits, and report generation (holds `ASSET_VIEW`, `INCIDENT_*`, `REPORT_EXPORT`, `AUDIT_VIEW`).
4. **`ROLE_SECURITY_ANALYST`**: Runs threat analysis and edits CVE configurations (holds `ASSET_VIEW`, `INCIDENT_VIEW/CREATE/MANAGE`, `VULN_MANAGE`, `REPORT_EXPORT`).
5. **`ROLE_INCIDENT_RESPONDER`**: Triages incidents and marks tickets resolved (holds `ASSET_VIEW`, `INCIDENT_VIEW/MANAGE/RESOLVE`, `AUDIT_VIEW`).
6. **`ROLE_INFRA_ENGINEER`**: Adjusts hardware allocations and telemetries (holds `ASSET_VIEW/CREATE/EDIT/DELETE`, `INCIDENT_VIEW`, `SERVER_RESTART`, `CLUSTER_SCALE`, `CLOUD_MODIFY`, `REPORT_EXPORT`).
7. **`ROLE_DEVSECOPS`**: Integrates patch configurations and monitors system scores (holds `ASSET_VIEW/CREATE/EDIT`, `INCIDENT_VIEW/CREATE/MANAGE`, `VULN_MANAGE`, `SERVER_RESTART`, `CLUSTER_SCALE`, `REPORT_EXPORT`).
8. **`ROLE_AUDITOR`**: Audits policy compliance and reviews logs (holds `ASSET_VIEW`, `INCIDENT_VIEW`, `AUDIT_VIEW`, `COMPLIANCE_VIEW`, `REPORT_EXPORT`).
9. **`ROLE_VIEWER`**: Read-only access to standard metrics dashboards (holds `ASSET_VIEW`, `INCIDENT_VIEW`).

---

## 🔍 Aspect-Oriented Auditing (AOP)

Administrators require a tamper-proof record of security-sensitive operations. To achieve this without polluting service code, SentinelCore implements auditing via **Aspect-Oriented Programming (AOP)**.

- **Trigger Method**: Controllers that perform write operations (e.g., updating roles, editing assets, resolving incidents) are decorated with the `@Auditable` annotation.
- **Audit Aspect (`AuditAspect`)**: Intercepts these executions, collecting context details:
  - Caller identity (retrieved from `SecurityContextHolder`).
  - Remote caller IP Address.
  - User-Agent browser details.
  - Action arguments, class names, execution status, and outcomes.
- **Data Protection Control**: Browser User-Agents are dynamically parsed and truncated to a strict limits window before database write operations. This prevents PostgreSQL buffer failures when receiving oversized header strings.
