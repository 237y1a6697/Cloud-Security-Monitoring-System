# 🛡️ SentinelCore-SecureOps

### Enterprise Security Operations & Threat Management Platform

SentinelCore-SecureOps is a unified Security Operations Center (SOC) platform designed to centralize and automate organizational security workflows. The platform provides real-time visibility into infrastructure health, incident response, vulnerability patching, compliance alignments, and audit logging. Supported by an integrated AI security assistant and automated email reporting, it serves as a lightweight command hub connecting critical telemetry data with actionable response operations governed by a strict Role-Based Access Control (RBAC) architecture.

[![Java 17](https://img.shields.io/badge/Java-17-orange.svg?style=flat-square&logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.7-brightgreen.svg?style=flat-square&logo=spring-boot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-blue.svg?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-blueviolet.svg?style=flat-square&logo=vite)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg?style=flat-square&logo=docker)](https://www.docker.com/)

**Quick Links:**
* [Documentation Directory](./docs)
* [API Reference](./docs/api/api_reference.md)
* [Backend Documentation](./backend/README.md)
* [Frontend Documentation](./frontend/README.md)

---

## 2. Project Overview

Modern security monitoring requires orchestrating diverse domains: host inventories, incident response cycles, vulnerability databases, and regulatory compliance scopes. Traditionally, security teams have had to navigate independent, isolated tools to obtain a holistic view of the organization's threat posture, significantly increasing operational overhead and slowing incident remediation times.

SentinelCore-SecureOps solves this fragmentation by consolidating essential SecOps disciplines into a centralized operational interface. It replaces disparate spreadsheets and basic CRUD tools with a dedicated, authorization-driven platform where analysts, engineers, and auditors can collaborate on incidents, enforce policy standards, and maintain strict, auditable trails of sensitive operations.

---

## 3. Core Capabilities

| Module | Capability |
| :--- | :--- |
| **Executive Dashboard** | Centralized security posture overview with real-time metrics and incident trends. |
| **Asset Management** | Track, manage, and inventory organizational infrastructure assets. |
| **Incident Response** | Create, assign, manage, and resolve security incident tickets. |
| **Vulnerability Management** | Monitor CVEs, vulnerability severity, and remediation statuses. |
| **Compliance** | Monitor operational visibility into compliance frameworks (SOC 2, ISO 27001). |
| **Audit Logging** | Centralized audit trail for tracking security-sensitive operations. |
| **Reports** | Generate executive summaries and security status reports. |
| **Automated Delivery** | Dispatch reports automatically via transactional email delivery. |
| **AI Assistant** | Security-focused natural-language assistance leveraging Google Gemini. |
| **RBAC** | Fine-grained, 9-role permission-based authorization model. |
| **Authentication** | Secure, session-based authentication backed by Spring Security layer. |

---

## 4. ⭐ Security Architecture

### Authentication
User authentication is managed comprehensively by **Spring Security 6**.
- **Credentials & Hashing:** Utilizes traditional Username/Password form login protected by industry-standard `BCrypt` password hashing.
- **Sessions:** Relies on stateful, authenticated runtime sessions generating secure `JSESSIONID` cookies.
- **Security Posture:** Cookies are strictly managed utilizing `HttpOnly`, `Secure`, and cross-site configuring via `SameSite=None` attributes.
- **Failures:** Invalid credentials yield standard `401 Unauthorized` HTTP responses in JSON formats, bypassing default HTML redirect behaviors typical in legacy applications.

### Authorization (RBAC)
The application enforces strict **Role-Based Access Control (RBAC)** across the platform. While authentication determines _who_ the user is, authorization dictates exactly _what_ that user is allowed to do.

The platform defines **20 distinct permissions** mapped across **9 hierarchical operation roles**.

### Roles
The following roles define operational thresholds within the platform:
* `ROLE_SUPER_ADMIN` - Complete system override and administration access.
* `ROLE_ADMIN` - Broad administrative rights targeting organizational administration.
* `ROLE_SOC_MANAGER` - Incident oversight and reporting access without raw infrastructure deletion.
* `ROLE_SECURITY_ANALYST` - Specialized role for triaging incidents and viewing infrastructure endpoints.
* `ROLE_INCIDENT_RESPONDER` - Targeted incident resolution rights.
* `ROLE_INFRA_ENGINEER` - Asset oversight targeting host systems operations.
* `ROLE_DEVSECOPS` - Hybrid engineering role capable of asset modification and vulnerability administration.
* `ROLE_AUDITOR` - Strictly read-only role evaluating incidents, assets, and the audit trail.
* `ROLE_VIEWER` - Bottom-level read-only access (assigned by default to OAUTH2 signups).

### Permissions
Permissions orchestrate precisely restricted endpoints and frontend components:
* `USER_MANAGE`, `ROLE_ASSIGN`
* `ASSET_CREATE`, `ASSET_EDIT`, `ASSET_DELETE`, `ASSET_VIEW`
* `INCIDENT_VIEW`, `INCIDENT_CREATE`, `INCIDENT_MANAGE`, `INCIDENT_RESOLVE`, `INCIDENT_DELETE`
* `SERVER_RESTART`, `CLUSTER_SCALE`, `CLOUD_MODIFY`
* `VULN_MANAGE`, `COMPLIANCE_VIEW`, `REPORT_EXPORT`, `AUDIT_VIEW`
* `INTEGRATION_CONFIG`, `SETTINGS_ACCESS`

---

## 5. 🔐 Security Controls

* **Spring Security 6 Pipelines:** Core security interception dictating endpoint exposure and API filtering.
* **Authentication Context Mapping:** Validating current executing principles against the SQL database.
* **Granular Role Checks:** Extensive endpoint-level authority evaluations using `@PreAuthorize`.
* **CSRF Mitigation:** Cookie-based CSRF tokens (`XSRF-TOKEN`) via `CookieCsrfTokenRepository.withHttpOnlyFalse()` with exclusion configurations explicitly covering the stateless API boundaries.
* **CORS Configurations:** Allowed origins mapping protecting against cross-origin data exposure while enabling secure credential integrations.
* **AOP Auditing:** Guaranteed centralized logging intercepting modifying actions without cluttering core business service logic (detailed below).

---

## 6. 📝 Audit Logging & AOP

The repository leverages **Aspect-Oriented Programming (AOP)** to track security-sensitive modifications, providing a centralized audit trail isolated from standard business logic.

### `@Auditable`
Security-sensitive controller endpoints are decorated with a custom `@Auditable(action = "EXPECTED_ACTION")` annotation. 

### `AuditAspect`
The `AuditAspect` class natively intercepts requests bearing the `@Auditable` annotation. Utilizing Spring's Security Context, the aspect retrieves and writes the following payload synchronously into the `audit_logs` database table:
* The **Authenticated User** performing the action.
* The explicit **Roles/Authorities** assigned to that user.
* Request **IP Address**.
* Submitter **User-Agent** (Truncated defensively to 250 characters preserving DB allocations).
* Standard **Action Name** (e.g. `ASSET_CREATE`).
* Execution **Result Status** (`SUCCESS` vs `FAILED: exception message`).

This separates the audit concerns fundamentally from core logic processing while ensuring a non-reputable tracker of operational inputs.

---

## 7. 📊 Executive Security Dashboard

The executive dashboard is the primary ingress interface offering top-level security metric consolidations visually mapped from database aggregates:
* Live asset counts representing registered infrastructure.
* Dynamic incident aggregation counters sorted by status and active severities.
* Security operations trend mappings showcasing past alert/incident velocities.
* Centralized panes broadcasting localized recent alerts and system activity.

---

## 8. 🖥️ Asset Management

Asset management consolidates data sets associated with the organization’s network endpoints, servers, and firewall architectures.
* End-to-end CRUD (Create, Read, Update, Delete) implementations interacting with the `Asset` database models.
* Tracks host classifications alongside generic status and operational location fields.
* Restricted effectively via `ASSET_*` tiered RBAC permissions preventing unauthorized infrastructure mutability. 

---

## 9. 🚨 Incident Response

Incidents are orchestrated through customized lifecycle tickets.
* Users holding `INCIDENT_CREATE` authority can originate threat tickets declaring specifics like severity and system targets.
* Operational roles monitor ticket states (Open, Investigating).
* Authoritative roles holding `INCIDENT_RESOLVE` map solution architectures directly concluding ticket workflows matching SLA timers and resolution validations.

---

## 10. 🐛 Vulnerability Management

Provides operations tracking tied to active Common Vulnerabilities and Exposures (CVE). 
* Dashboards highlighting base criticality, calculated severities, and targets affected.
* Granular documentation surrounding designated remediation playbooks (e.g., 'Deploy patches', 'Verify firewall mappings').
* Functionality explicitly protected verifying `VULN_MANAGE` directives.

---

## 11. 📋 Compliance Monitoring

Provides operational visibility into compliance posture against three integrated, hardcoded frameworks:
* ISO/IEC 27001
* SOC 2 (Trust Services Criteria)
* PCI DSS V4.0

The interface outputs percentage-based scorecards corresponding to successful mapped operations controls versus required framework standards.

---

## 12. 📑 Security Reporting

Automated reporting implementations extract backend statistical snapshots delivering PDF documents utilizing PDF generation integrations:
* Configurable email recipients for organizational targeting.
* Integrates directly with the `ScheduledReportController` targeting executive incident reviews and asset status aggregates.
* Protected inherently by the `REPORT_EXPORT` security parameter.

---

## 13. 📧 Automated Report Delivery

SentinelCore actively interfaces with the **Brevo API** delivering email notifications to users securely. 
* Triggered directly by the backend REST `EmailController` logic.
* Configured using `RestTemplate` dispatches interacting natively with Brevo backend API configurations.
* Handles transactional emails attached directly to high-threat threshold variables originating inside the platform operations interface.

---

## 14. 🤖 AI Security Assistant

An interactive AI-Assistant embedded inside the frontend interface connects analysts via Natural Language interfaces.
* Integrated specifically with the **Google Gemini API** (`grok-1.5-pro` model base mapping).
* Functions as a context-aware fallback. Rule-based parsers intercept static known-flow inquiries (e.g. "Create an asset") preventing unnecessary LLM token utilization, while Google Gemini translates and responds to arbitrary cyber threats or query methodologies securely.
* Built reliably utilizing unified backend `GeminiService` communication configurations ensuring standard frontend CORS boundaries remain opaque to internal system API keys.

---

## 15. 🏗️ System Architecture

```mermaid
flowchart TB
    User((User))
    F[React + Vite Frontend]
    API[REST API Layer]
    S[Spring Security Context]
    Auth[RBAC / Authentication]
    C[Spring Boot Controllers]
    AOP[AuditAspect Logging]
    Svc[Business Layer Services]
    Repo[Spring Data JPA Repositories]
    DB[(PostgreSQL)]

    Gemini((Google Gemini API))
    Brevo((Brevo Email API))
    
    User -->|HTTPS Request| F
    F -->|Axios JSON Calls| API
    API --> S
    S --> Auth
    Auth -.->|401/403 Denied| User
    Auth --> C
    
    C -.->|@Auditable Trigger| AOP
    AOP -.->|Saves Audit Log| Repo
    
    C --> Svc
    Svc --> Repo
    Repo --> DB
    
    Svc -->|HTTP REST| Gemini
    Svc -->|HTTP REST| Brevo
```

---

## 16. 🔄 Authentication & Request Flow

```mermaid
sequenceDiagram
    participant U as React User
    participant S as Spring Security
    participant M as Authentication Manager
    participant DB as PostgreSQL
    participant API as Secured API Endpoint

    U->>S: POST /login (Username/Password)
    S->>M: Authenticate AuthenticationToken
    M->>DB: Fetch UserDetailsService credentials
    DB-->>M: BCrypt Password validation
    alt Success
        M-->>S: Authentication Granted 
        S-->>U: 200 OK + JSESSIONID Cookie
    else Failure
        M-->>S: Throw AuthenticationException
        S-->>U: 401 Unauthorized
    end
    
    U->>API: GET /api/incidents (Cookie Attached)
    API->>S: Validates Session & Authority checks
    S-->>API: Authorizes Request
    API-->>U: 200 OK + JSON Response
```

---

## 17. 🛂 RBAC Authorization Flow

```mermaid
flowchart TD
    Req[Incoming HTTP Authenticated Request] --> Context[Spring Security Context]
    Context --> Privileges{Check GrantedAuthorities}
    
    Privileges -->|Has @PreAuthorize Role/Permission| Allowed[Target Controller Method]
    Privileges -->|Lacks Role/Permission| Denied[403 Forbidden]
    
    Allowed --> Serv[Execute Service Logic]
    Serv --> DB[(Database)]
```

---

## 18. 📁 Project Structure

```text
SentinelCore-SecureOps/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/prashanth/dashboard/
│   │   │   │   ├── aop/             # Aspect-Oriented audit logging logic
│   │   │   │   ├── controller/      # REST API endpoints
│   │   │   │   ├── dto/             # Data Transfer Objects
│   │   │   │   ├── model/           # JPA Entities (Asset, Role, Incident, etc.)
│   │   │   │   ├── repository/      # Spring Data JPA Repository bindings
│   │   │   │   ├── security/        # Spring Security config, user details & CORS
│   │   │   │   └── service/         # Business logic layer (Gemini, Email, etc.)
│   │   │   └── resources/
│   │   │       ├── application.properties
│   │   │       └── static/
│   │   └── test/
│   ├── pom.xml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable React layout items and UX modals
│   │   ├── context/     # Globally scoped context bindings (AI State, Auth State)
│   │   ├── pages/       # Fully rendered Dashboard SPA views
│   │   ├── services/    # Axios implementations isolating backend calls
│   │   └── styles/      # Vanilla modular CSS
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── docs/
│   ├── api/
│   ├── architecture/
│   ├── deployment/
│   └── security/
├── docker-compose.yml   # Multi-container orchestration instructions
├── render.yaml          # External platform continuous deployment configurations
└── README.md
```

---

## 19. 🧩 Technology Stack

| Category | Technology |
| :------- | :--------- |
| **Backend** | Java 17, Spring Boot 3, Spring Data JPA, Hibernate, Maven |
| **Frontend** | React 19, Vite, Axios |
| **Database** | PostgreSQL 15 |
| **Security** | Spring Security 6, BCrypt, RBAC, Core CORS Configurations, State-managed Cookies |
| **Infrastructure** | Docker, Docker Compose, Render Cloud Runtime |
| **Integrations** | Brevo API (Transactional Emails), Google Gemini API (AI Ops) |

---

## 20. 🔌 REST API Overview

Below represents a highly condensed summary of module endpoints. For exhaustive specifications, reference the full [API Reference Documentation](docs/api/api_reference.md).

| Module | Example Endpoint | Purpose |
| :--- | :--- | :--- |
| **Authentication** | `POST /login` | Validates session initiation mappings. |
| **Users** | `GET /api/users` | Lists active internal system operations staff. |
| **Dashboard** | `GET /api/dashboard/stats` | Aggregates high-value system metrics (Incidents, Assets). |
| **Assets** | `POST /api/assets` | Provisions new managed servers and endpoints. |
| **Incidents** | `PUT /api/incidents/{id}/status` | Updates incident status queues programmatically. |
| **Vulnerabilities** | `GET /api/vulnerabilities` | Identifies all evaluated active system CVE datasets. |
| **Compliance** | `GET /api/compliance` | Queries matrix compliance frameworks comparisons. |
| **Audit** | `GET /api/audit-logs/recent` | Validates standard system operations inputs internally. |
| **Integrations** | `POST /api/alerts/send-email` | Dispatches priority email escalations using Brevo. |
| **AI** | `POST /api/ai/chat` | Leverages Gemini / Rule integrations for data context assistance. |

---

## 21. 🐳 Docker & Deployment

The application features full container orchestration methodologies utilizing explicit `Dockerfile` parameters located in `/backend` combined with an orchestration strategy maintained via `docker-compose.yml`.
* **Local Run:** Composes standard `postgres:15` images synchronously initialized alongside the Maven-built `backend` backend server.
* **Production Build:** Platform explicitly mapped for Render deployment schemas (`render.yaml`) establishing managed PostgreSQL components alongside the stateless Java operations layer, establishing strict internal connectivity references preventing unbounded public exposure variables.

---

## 22. ⚙️ Environment Variables

Important system variables managed via `.env` parameter mappings or strictly encrypted platform variables. *(Note: Actual credential combinations are managed separately).*

```env
# Relational Database References
DB_URL=
DB_USERNAME=
DB_PASSWORD=

# Session / Backend Host URLs
FRONTEND_URL=
PORT=

# 3rd Party Integrations
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=

GEMINI_API_KEY=
```

---

## 23. 🚀 Running Locally

### Prerequisites
* Java 17+
* Node.js / NPM
* PostgreSQL (Running natively or via Docker)
* Maven Wrapper

### Backend Startup
```bash
cd backend
./mvnw clean install
./mvnw spring-boot:run
```

### Frontend Startup
```bash
cd frontend
npm install
npm run dev
```

### Docker Orchestration (Alternatively)
To run sequentially via docker variables skipping local manual executions:
```bash
docker-compose up --build
```
> *(Requires `docker` daemon running successfully)*

---

## 24. 🧪 Testing & Validation

Validation environments established verifying logical code mappings explicitly.
* Evaluates standardized JUnit testing environments tracking standard Controller validation formats.
* Tests explicitly mock outbound dependencies mapping utilizing standard Mockito injections isolating AI endpoints ensuring test speeds and avoiding unpredictable API expenditures explicitly.

---

## 25. 🔒 Security Design Summary

| Security Layer | Implementation |
| :--- | :--- |
| **Authentication** | Spring Security 6 Form Login Parameters |
| **Password Protection** | Cryptographic BCrypt Encoding |
| **Session Security** | JSESSIONID via `Secure` + `SameSite=None` attributes |
| **Authorization** | Strict Role-Based Access Control (RBAC) Architecture |
| **Permissions** | Granular assigned authority mappings (`@PreAuthorize`) |
| **API Protection** | Standardized Filter Chain Exceptions |
| **Audit Mechanism** | Unified Interceptor annotations mapping Aspect Logging (AOP) |
| **Database** | PostgreSQL Encapsulation Architecture |
| **Secret Management** | Secure abstracted Application Environment Variables |
| **Integration** | Secure abstracted internal Google Gemini + Brevo integrations |

---

## 26. 📚 Documentation Directory

Exhaustive references concerning explicit SentinelCore architecture mappings and implementation data formats are localized in the primary deployment documents:
* [Architecture Overview](./docs/architecture/architecture_overview.md)
* [API Reference Listing](./docs/api/api_reference.md)
* [Security & RBAC Configurations](./docs/security/security_rbac.md)
* [Comprehensive Deployment Guide](./docs/deployment/deployment_guide.md)

---

## 27. 🎯 Project Engineering Highlights

SentinelCore-SecureOps communicates enterprise-oriented architectural designs highlighting advanced software practices:
* **Full-stack Monorepo Architecture** isolating generic module definitions logically.
* **Enterprise-style RBAC** implementing extremely granular component access via 9 primary authoritative roles utilizing precise `@PreAuthorize("hasAuthority()")` checks globally.
* **Centralized Extraneous AOP Auditing** ensuring that high-value threat data manipulation flows log silently guaranteeing system trust accountability natively.
* **Native Natural-Language Copilots** linking explicit programmatic Google Gemini logic handling reducing standard analyst fatigue parameters dynamically.
* **Centralized Data Aggregations** leveraging Java Stream APIs managing standardized dynamic dashboarding outputs securely effectively.

---

## 28. 👨‍💻 Engineering Architecture Principles

Implementation highlights stringent programmatic discipline standards established globally:
* **Explicit Separation of Concerns** distributing logic cleanly utilizing Controller -> Service -> Repository definitions strictly.
* **Single-Responsibility Endpoints** ensuring REST structures adhere properly exposing intuitive state configurations predictably.
* **Component Prop Drilling Management** utilizing React Context wrappers preserving authentication statuses preventing extraneous API call flows client-side.
* **Decoupled API Logic** mapping frontend `axios` wrappers ensuring consistent headers propagation intuitively isolating parameter definitions uniformly.

---

## 29. 📸 Screenshots

> Screenshots will be added soon once the production design is finalized.