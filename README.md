# Service Portal Frontend

This repository contains a React + Vite frontend for a workspace-driven legal document workflow. The current implementation covers login, workspace management, multi-step document upload, editable review details, PDF generation, and backend integration scaffolding.

## Core flows

- Home, login, signup placeholder, profile, and profile-settings pages.
- Hardcoded authentication for the current development phase.
- Workspace creation, listing, opening, and activity history.
- Buyer, seller, and property document upload workflow.
- Editable review step that can be prefilled from parsed backend responses.
- Review-document generation and PDF download.

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

Set the backend base URL with Vite:

```bash
VITE_API_BASE_URL=https://<your-api-domain-or-gateway-stage>
```

Example:

```bash
echo "VITE_API_BASE_URL=https://api.example.com/prod" > .env
```

## Source organization

- [src/config/appConfig.js](src/config/appConfig.js): shared constants and static configuration.
- [src/pages/](src/pages): route-level React components.
- [src/services/apiService.js](src/services/apiService.js): API envelope creation and endpoint helpers.
- [src/utils/historyUtils.js](src/utils/historyUtils.js): login/profile history helpers.
- [src/utils/workflowUtils.js](src/utils/workflowUtils.js): workflow state normalization and document helpers.
- [src/utils/pdfUtils.js](src/utils/pdfUtils.js): PDF generation and filename helpers.
- [src/utils/reviewDocumentUtils.js](src/utils/reviewDocumentUtils.js): statement-style review-document generation.
- [src/README.md](src/README.md): source-folder maintenance notes.
- [src/services/README.md](src/services/README.md): service-layer maintenance notes.

## Integration notes

- Workspace operations still use local browser storage as a mock until backend contracts are finalized.
- Document upload uses the current API helper implementation.
- Document extraction and generated-PDF upload include backend scaffolding and commented call sites for later activation.

## Deployment notes

- Intended hosting target: AWS Amplify.
- Build command: `npm run build`
- Output directory: `dist`
- Required environment variable: `VITE_API_BASE_URL`
