# Authentication Technical Debt

## Current Implementation

The frontend currently stores both the access token and refresh token in `localStorage`.
This behavior is intentionally retained for the current development phase.

## Future Production Upgrade

Before production deployment, replace the current storage model with:

- Access token held in application memory only.
- Refresh token delivered and stored in a `Secure`, `HttpOnly`, `SameSite` cookie.
- CSRF protection for every endpoint that relies on cookie-based authentication.

The production design should also include refresh-token rotation, reuse detection, and
clear cookie expiry and revocation behavior.
