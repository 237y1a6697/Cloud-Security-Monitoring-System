# SentinelCore-SecureOps

## Enterprise Security Operations & Threat Management Platform

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.7-brightgreen.svg?style=flat-square&logo=spring-boot)](https://spring.io/projects/spring-boot)
[![Java 17](https://img.shields.io/badge/Java-17-orange.svg?style=flat-square&logo=openjdk)](https://openjdk.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-blueviolet.svg?style=flat-square&logo=vite)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg?style=flat-square&logo=docker)](https://www.docker.com/)
[![Render](https://img.shields.io/badge/Render-Deployed-purple.svg?style=flat-square&logo=render)](https://render.com/)
[![Brevo API](https://img.shields.io/badge/Brevo%20API-Transactional%20Mail-red.svg?style=flat-square)](https://www.brevo.com/)

SentinelCore-SecureOps is a unified Security Operations Center platform designed to help organizations monitor assets, manage security incidents, track vulnerabilities, assess compliance, generate reports, and interact with an AI-powered security assistant from a centralized dashboard.

---

## 🔍 Overview

Modern security monitoring requires orchestrating diverse domains: host inventories, incident response cycles, vulnerability databases, and regulatory compliance scopes. Traditionally, security analysts have had to navigate separate tools to obtain a holistic view of threat posture, slowing response times and increasing operational overhead.

SentinelCore-SecureOps addresses this complexity by consolidating key SecOps coordinates into a single, intuitive interface. It acts as a lightweight command hub connecting critical telemetry data with actionable response tools, allowing operators to:
* **Monitor Infrastructure Health**: Real-time visualization of machine stats (CPU, memory, disk, network) alongside active risk classifications.
* **Triage Incident Workflows**: Track tickets, assign engineers to alerts, calculate SLA details, and record resolution guides.
* **Track Vulnerability Posture**: Access a localized CVE database complete with automated remediation flags.
* **Assess Compliance Realignment**: Review operational readiness against industry frameworks (ISO/IEC 27001, SOC 2, and PCI DSS).
* **Audit Security Footprints**: Automatically track and log system operations using aspect-oriented activity pipelines.
* **Automate PDF Reports**: Package dashboard scorecards, audit histories, and vulnerability logs into PDF templates delivered via scheduled email streams.
* **Engage AI Copilots**: Chat directly with an offline xAI Grok interface loaded with operational queries context.

---

## 🛠️ Key Features

| Module | Description |
|---|---|
| **Executive Dashboard** | Real-time security overview |
| **Asset Management** | Manage servers, endpoints, and infrastructure |
| **Incident Response** | Track and resolve security incidents |
| **Vulnerability Management** | Monitor CVEs and remediation |
| **Compliance** | Monitor ISO 27001, SOC 2, and PCI DSS posture |
| **Audit Logging** | Track security-sensitive operations |
| **Reports** | Generate PDF security reports |
| **Automated Delivery** | Schedule reports for email delivery |
| **AI Assistant** | Natural-language security assistance |
| **RBAC** | Role and permission-based access control |

---

## 📐 System Architecture

The SentinelCore platform relies on a secure client-server model:

```mermaid
flowchart TB

    U[Security Users]

    F[React + Vite Frontend]

    B[Spring Boot Backend]

    S[Spring Security + RBAC]

    DB[(PostgreSQL Database)]

    AI[AI Assistant]

    R[Report Generation]

    E[Brevo Email API]

    U --> F
    F --> B
    B --> S
    B --> DB
    B --> AI
    B --> R
    R --> E
```

---

## 📂 Project Structure

```text
SentinelCore-SecureOps/
├── backend/            # Spring Boot 3 Java backend
├── frontend/           # React Single Page Application frontend
├── docs/               # Detailed architectural and API documents
│   ├── architecture/   # Structural flows and layer explanations
│   ├── api/            # REST backend endpoint specifications
│   ├── security/       # Spring Security filters and RBAC permissions
│   └── deployment/     # Local Docker and production cloud parameters
├── LICENSE             # MIT license details
├── README.md           # Master root readme documentation (this file)
├── docker-compose.yml  # Local developer container configurations
└── render.yaml         # Render deployment parameters
```

---

## ⚙️ Running Locally

Detailed instructions are available in the subfolders and the `docs/` directory:
- **Comprehensive Setup Guide**: Refer to [docs/deployment/deployment_guide.md](docs/deployment/deployment_guide.md).
- **Backend Setup**: Refer to [backend/README.md](backend/README.md).
- **Frontend Setup**: Refer to [frontend/README.md](frontend/README.md).