# Comprehensive Web Application Threat Model & Hardening Plan

## 1. System Overview & Architecture

### Application Profile

This threat model evaluates a multi-tenant Task Management Web Application. The system comprises:

* **Frontend Tier:** Single-page application built with React, served over HTTPS.

* **Backend Tier:** RESTful API built with Node.js and Express.

* **Data Tier:** Relational database managed with PostgreSQL.

* **External Integrations:** Auth0 for identity management and OAuth2 authentication, and AWS S3 for secure user document/file uploads.

### Trust Boundaries & Data Flow

1. **Public Internet to Reverse Proxy (DMZ):** Untrusted traffic from users crosses the outer perimeter to hit an Nginx reverse proxy and Web Application Firewall (WAF), which terminates SSL/TLS.

2. **Application Tier Boundary:** Requests pass from the reverse proxy into the internal backend API network container. Here, requests interact with Auth0 and AWS S3 over encrypted channels.

3. **Database Tier Boundary:** The backend API connects to the PostgreSQL database cluster via a strict internal network boundary, utilizing credentials stored securely in environment secrets managers.

---

## 2. Detailed STRIDE Risk Register

### Threat 1: Broken Object Level Authorization (BOLA)

* **STRIDE Category:** Elevation of Privilege
* **Risk Severity:** CRITICAL
* **Likelihood:** High | **Impact:** High
* **Detailed Description:** Because APIs often expose endpoint URLs containing resource identifiers (e.g., `/api/tasks/1042`), an authenticated user could manipulate this ID to access, modify, or delete records belonging to another tenant or user without proper session validation.

### Threat 2: SQL Injection (SQLi)

* **STRIDE Category:** Tampering / Injection
* **Risk Severity:** HIGH
* **Likelihood:** Medium | **Impact:** High
* **Detailed Description:** If user-supplied input from task search fields or filters is concatenated directly into database queries instead of using parameterized queries or ORM abstractions, an attacker can manipulate the query logic to extract, alter, or drop database tables.

### Threat 3: Credential Stuffing & Brute-Force Attacks

* **STRIDE Category:** Denial of Service / Spoofing
* **Risk Severity:** MEDIUM
* **Likelihood:** High | **Impact:** Medium
* **Detailed Description:** The login and password reset endpoints lack automated request restrictions, allowing malicious actors to perform high-frequency automated credential stuffing or brute-force attacks to compromise user accounts.

### Threat 4: Cross-Site Scripting (XSS)

* **STRIDE Category:** Tampering
* **Risk Severity:** MEDIUM
* **Likelihood:** Medium | **Impact:** Medium
* **Detailed Description:** Unescaped or unsanitized user inputs (such as profile biographies or task descriptions) rendered back to the browser can lead to stored XSS, allowing attackers to hijack active user sessions or steal cookies.

### Threat 5: Sensitive Information Disclosure

* **STRIDE Category:** Information Disclosure
* **Risk Severity:** MEDIUM
* **Likelihood:** Low | **Impact:** High
* **Detailed Description:** Misconfiguration in build tools or environment variable handling might cause sensitive API secrets, database credentials, or internal error stack traces to be exposed in client-side JavaScript bundles or error response headers.

---

## 3. Prioritized Hardening Checklist & Action Plan

### Priority 1 (Immediate Remediation - Critical Risks)

- [ ] **Enforce Server-Side BOLA Protections:** Implement explicit session-to-resource ownership checks in the backend controller logic. Ensure that every request verifies whether the authenticated user owns the requested task ID before returning data.

- [ ] **Eliminate SQL Injection Vulnerabilities:** Refactor all database operations to use parameterized queries, prepared statements, or robust ORMs (such as Prisma or Sequelize) to ensure user input is never interpreted as executable code.

### Priority 2 (Short-Term Remediation - High Risks)

- [ ] **Implement Rate Limiting:** Integrate rate-limiting middleware (e.g., `express-rate-limit`) on sensitive authentication routes (`/api/login`, `/api/register`, `/api/password-reset`) to mitigate brute-force and credential stuffing attacks.

- [ ] **Sanitize and Encode Inputs:** Adopt robust sanitization libraries to clean user inputs and enforce context-aware output encoding across the React frontend to neutralize Cross-Site Scripting (XSS).

### Priority 3 (Long-Term Hardening - Defense in Depth)

- [ ] **Harden HTTP Response Headers:** Configure strict security response headers using tools like Helmet for Express, including Content Security Policy (CSP), Strict-Transport-Security (HSTS), X-Frame-Options, and X-Content-Type-Options.

- [ ] **Audit Secret Management:** Ensure production secrets, database strings, and API keys are stored exclusively in secure secret stores (e.g., AWS Secrets Manager or GitHub Actions Secrets) rather than hardcoded configuration files.
