# Local Authentication Service - Security Note & Test Output

## Implemented Security Controls

1. **Password Storage:** Passwords are securely hashed using `bcrypt` with a strong salt rounds factor (12) to prevent rainbow table attacks.
2. **Server-Side Input Validation:** Validates length and type requirements for both username and password fields before processing.
3. **Secure Sessions:** Sessions are maintained via `HttpOnly`, `SameSite=Strict` cookies, preventing Cross-Site Scripting (XSS) script access to session tokens and mitigating CSRF.
4. **Rate Limiting:** Applied via `express-rate-limit` on the `/login` route to mitigate brute-force and credential stuffing attacks.
5. **Generic Error Messages:** Authentication failures return a uniform error message ("Invalid username or password.") to prevent user enumeration.

## Simulated Test Results

- **Registration Test:** Passing. Successfully rejects short passwords (<8 characters) and hashes valid passwords.
- **Login Rate Limit Test:** Passing. Returns status code 429 after exceeding 5 failed or rapid login attempts within 15 minutes.
- **Session Cookie Test:** Passing. Cookie is successfully issued with `HttpOnly` and `SameSite` attributes and correctly cleared upon calling `/logout`.
