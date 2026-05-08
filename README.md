# Catering-Marketplace

## Local development — platform admin (test account)

Use these credentials to sign in to the admin UI against a typical local database seed. The account is **admin** with **email verified** in the DB.

| Field    | Value                         |
| -------- | ----------------------------- |
| Email    | `admin@catering.local`        |
| Password | `VmbQ0PDpXYY23SRyGJpZjA`      |
| Role     | `admin` (email verified)      |

**Security:** intended for **local development only**. Do not reuse this password in production. If this repository is public or shared, rotate the password and avoid committing real secrets—prefer `.env` and `npm run seed:admin` as documented in `catering-backend/.env.example`.
