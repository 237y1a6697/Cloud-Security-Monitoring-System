# SentinelCore-SecureOps Frontend Client

The frontend client of SentinelCore-SecureOps is a responsive Single Page Application (SPA) built using **React** and compiled via **Vite**.

---

## 🎨 Core Design & Technology stack

1. **React & Vite**: Fast development ecosystem, components model composition, and quick bundle compilation.
2. **React Router DOM**: Declarative URL routing mapping dashboard screens while protecting authenticated paths.
3. **Authentication Context (`AuthContext`)**: Global React state provider tracking credentials, current user roles, and access privilege details.
4. **Responsive Vanilla CSS Layouts**: Structured dark themes, flex layouts, grids, visual scorecard components, and interactive animations. No heavy Tailwind dependencies.
5. **Interactive AI SecOps drawer**: Integrated sidebar that passes chat prompts to the backend AI module.
6. **Executive Dashboard Modules**:
   - **Asset Management**: Telemetry metrics tables for CPU, disk, memory, network interfaces.
   - **Incident Response**: Ticket tracker details with technician assignments, status filters, and SLA calculations.
   - **Vulnerabilities CVE Log**: Overview of network vulnerabilities, remediation, and patch triggers.
   - **Compliance Readiness**: Framework indicators tracking progress details for SOC2, ISO27001, and PCI DSS.
   - **Audit Logger**: Detailed, paginated table displaying operator operations logged by the server's aspect actions.
   - **Reports Scheduler**: Admin console to manage PDF templates and email delivery parameters.

---

## 🚀 Running Locally

### Prerequisites
- Node.js installed (v18+ recommended).

### Steps
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the client app at `http://localhost:5173`.
5. Update `VITE_API_URL` config in your local `.env` if connecting to a custom backend host (API requests are automatically proxied to target backend port `8081` in dev).

---

## 🏗️ Production Compilation

Generate optimized static assets inside `/dist` for CDN hostings like Vercel:
```bash
npm run build
```
