# Source Layout

This folder is split by responsibility so UI, workflow state helpers, and API access stay easier to change independently.

## Structure

- `config/` contains app-wide constants and static configuration.
- `pages/` contains route-level React components.
- `services/` contains backend and storage-facing API helpers.
- `utils/` contains pure helpers for workflow state, PDF generation, and document text generation.

## Refactor Guidelines

- Keep page components focused on rendering and event wiring.
- Move reusable pure logic into `utils/`.
- Keep endpoint contracts inside `services/`.
- Prefer adding new config values to `config/appConfig.js` instead of scattering constants.