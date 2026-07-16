# Services

`apiService.js` is the single integration point for backend-facing requests.

## Responsibilities

- Build the standard API envelope used by the frontend.
- Call workspace endpoints.
- Upload document files and generated PDFs.
- Keep local mock behavior in one place until backend contracts are finalized.

## Maintenance Notes

- Add new endpoints to the local endpoint maps first.
- Keep transport concerns here; avoid putting `fetch` calls directly in components.
- When TODO placeholders are replaced by production APIs, preserve the current function signatures where possible to limit UI churn.