# SentinelCore-SecureOps Backend

The backend engine of the SentinelCore-SecureOps platform is built using **Spring Boot 3** and **Java 17**.

---

## 🛠️ Technology Stack & Architectures

1. **Spring Boot (v3.4.7) & Java 17**: Core runtime supporting RESTful controller services, dependency injection, and data management.
2. **PostgreSQL**: Hardened database storing users, role-permissions, asset profiles, CVE metrics, and audit logs.
3. **Hibernate & Spring Data JPA**: Object-Relational Mapping (ORM) to handle transactions, query constructs, and connection pooling via HikariCP.
4. **Spring Security 6 (RBAC)**: Protects endpoints by verifying active `JSESSIONID` sessions, user roles, and fine-grained permissions.
5. **Aspect-Oriented Audit System (Spring AOP)**: Passive logger capturing security operations via `@Auditable` aspects and dynamically truncating caller metadata.
6. **PDF Reports Exporter (OpenPDF)**: Automatically formats system scores, vulnerability indices, and logs into a PDF download layout.
7. **Brevo Email API Integration**: Sends operational summaries and threat notices to administrators using the Brevo HTTPS REST API.
8. **Grok AI Assistant**: Routes client queries through a secure Spring AI backend proxy to xAI Grok.
9. **Report Scheduling Thread**: Checks active cron tasks via `@Scheduled` and auto-sends reports.

---

## 🚀 Running Locally

### Prerequisites
- JDK 17 installed.
- PostgreSQL database running and configured local DB name `sentinelcore`.

### Steps
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Configure local environment variables or pass properties in `src/main/resources/application.properties`.
3. Launch the Spring Boot server using the Maven wrapper:
   ```bash
   ./mvnw spring-boot:run
   ```
   *For Windows, you can also use `mvnw.cmd`.*
4. The server runs on port **`8081`** by default.

---

## 🧪 Testing Backend Code

Execute the Maven test phases to confirm system logic:
```bash
./mvnw clean test
```
