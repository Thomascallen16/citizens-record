# Security Policy

## Public/private boundary

This repository contains application source code. It must never contain or expose production secrets or private user data.

Never commit:

- passwords or password-reset secrets;
- JWT, session, OAuth, or authentication secrets;
- database credentials or connection strings containing credentials;
- Stripe secret keys or webhook signing secrets;
- private API keys or service-account credentials;
- banking or payment-account credentials;
- Social Security numbers or other identity credentials;
- private case files, evidence uploads, or production database exports;
- private storage objects or signed URLs intended only for authenticated users; or
- any credential that could permit impersonation or unauthorized access.

## Runtime secrets

Secrets belong in the deployment platform's protected environment/secret store. Source files may contain empty `.env.example` placeholders, but never real values.

Server-only credentials must remain server-side. Client code may receive only values explicitly designed to be public, such as a Stripe publishable key when required by the payment flow.

## Application data boundary

Authentication and authorization are required for private workspace data. Case records, evidence, chronology, acquisition queues, drafts, billing information, and other user-specific workspace data must be scoped to the authenticated user and must not be exposed through public routes, static assets, logs, error messages, or unauthenticated API procedures.

Administrative capabilities must require explicit authorization and must not be reachable merely by knowing an endpoint or UI route.

## Payments

Stripe secret keys and webhook signing secrets are server-only. Payment status must be established from verified server-side Stripe state/webhooks rather than trusted client input. Never place billing credentials in the frontend bundle or repository.

## Before deployment

Before exposing a deployment publicly, verify:

1. No real secrets exist in the working tree.
2. No private records or production database exports are tracked.
3. Authentication is required for private data.
4. Every private-data procedure enforces ownership/authorization server-side.
5. Production environment variables are configured only through protected secret storage.
6. Debug output does not disclose credentials, tokens, private records, or sensitive request data.
7. Payment webhooks validate their signatures.
8. Public documentation does not disclose operational secrets or private infrastructure details that would materially enable unauthorized access.

## Reporting a vulnerability

Do not publish credentials, private records, or an exploitable vulnerability in a public issue. Use the repository's private security-reporting mechanism when one is enabled, or contact the project owner privately.
