# Service Portal Frontend

This repository contains a React + Vite frontend for a workspace-driven legal document workflow. The current implementation covers login, workspace management, multi-step document upload, editable review details, PDF generation, and full backend API integration secured with AWS Cognito.

## Core flows

- Home, login, signup (Cognito self-service with email confirmation), profile, and profile-settings pages.
- AWS Cognito User Pool authentication (sign in, sign up, confirm sign up, change password, sign out).
- Workspace creation, listing, opening, and activity history — all persisted via backend API calls.
- Buyer, seller, and property document upload workflow.
- Editable review step prefilled from backend document-extraction responses.
- Review-document generation, backend persistence, and PDF download.

## Local development

```bash
npm install
npm run dev
```

Build validation:

```bash
npm run build
```

## Runtime configuration

Set the backend base URL and Cognito settings with Vite env vars:

```bash
VITE_API_BASE_URL=https://<your-api-domain-or-gateway-stage>
VITE_COGNITO_REGION=<aws-region>
VITE_COGNITO_USER_POOL_ID=<cognito-user-pool-id>
VITE_COGNITO_USER_POOL_CLIENT_ID=<cognito-app-client-id>
```

Example:

```bash
cat <<EOF > .env
VITE_API_BASE_URL=https://api.example.com/prod
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_exampleId
VITE_COGNITO_USER_POOL_CLIENT_ID=exampleclientid123
EOF
```

The Cognito User Pool must define a custom attribute `custom:company_code` (string, mutable) since it is set at signup and validated at sign-in.

## Source organization

- [src/config/appConfig.js](src/config/appConfig.js): shared constants and static configuration.
- [src/config/authConfig.js](src/config/authConfig.js): Cognito User Pool configuration sourced from env vars.
- [src/pages/](src/pages): route-level React components.
- [src/services/apiService.js](src/services/apiService.js): API envelope creation, Cognito-authenticated `fetch` calls, and endpoint helpers.
- [src/services/authService.js](src/services/authService.js): AWS Amplify/Cognito auth helpers (sign in, sign up, confirm, change password, sign out, ID token retrieval).
- [src/utils/workflowUtils.js](src/utils/workflowUtils.js): workflow state normalization and document helpers.
- [src/utils/pdfUtils.js](src/utils/pdfUtils.js): PDF generation and filename helpers.
- [src/utils/reviewDocumentUtils.js](src/utils/reviewDocumentUtils.js): statement-style review-document generation.
- [src/README.md](src/README.md): source-folder maintenance notes.
- [src/services/README.md](src/services/README.md): service-layer maintenance notes.

## Integration notes

- All workspace, profile, workflow-progress, and document operations call the backend API via `src/services/apiService.js`. No localStorage mocks remain.
- Every API call attaches the signed-in user's Cognito ID token as an `Authorization: Bearer <token>` header; API Gateway is expected to enforce a Cognito User Pool authorizer.
- See the project chat history / architecture notes for the full list of API services, Lambda functions, and DynamoDB tables required on the backend.

## Deployment notes

- Intended hosting target: AWS Amplify.
- Build command: `npm run build`
- Output directory: `dist`
- Required environment variables: `VITE_API_BASE_URL`, `VITE_COGNITO_REGION`, `VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_USER_POOL_CLIENT_ID`
- Add a SPA rewrite rule (`/* -> /index.html`, 200) in Amplify Hosting rewrites/redirects since routing uses client-side `pushState`.
