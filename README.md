# Service Portal Frontend (React + Vite)

This project is a frontend portal designed to be hosted on AWS Amplify.

## Features

- Home page with project summary and entry points.
- Login flow with hardcoded credentials for the current phase:
	- User ID: `cyrusj25`
	- Password: `Data@1234567`
- Request signup action (manual approval flow placeholder).
- User profile page after login.
- Profile load history persisted in browser storage.
- Workspace manager in profile page:
	- Create new workspace by name.
	- Check duplicate workspace names before creation.
	- Open past workspaces.
	- Track workspace activity history (created/opened).
- API service caller to invoke backend endpoints (GET/POST/PUT/DELETE).

## Local Run

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

## API Endpoint Configuration

Set your backend base URL as a Vite environment variable:

```bash
VITE_API_BASE_URL=https://<your-api-domain-or-gateway-stage>
```

Example for local development:

```bash
echo "VITE_API_BASE_URL=https://api.example.com/prod" > .env
```

## Standard API Payload Envelope

Non-GET/DELETE API requests are automatically wrapped and sent in this format:

```json
{
	"data": {
		"intKey": 108039,
		"userId": "cyrusj25",
		"domain": "BLORE LLC",
		"ip": "10.103.1027.544",
		"loginTimestamp": "2026-07-05 15:44:45.101021 UTC",
		"captureInput": null,
		"profilemetadata": {
			"workspaceName": "customer1",
			"workSpacefor": "sded"
		}
	}
}
```

The app injects runtime values for `userId` and `profilemetadata.workspaceName` when available.

## Workspace API Placeholders

Workspace checks and operations currently use local browser storage as a mock.
In [src/services/apiService.js](src/services/apiService.js), each workspace method contains a TODO comment showing the endpoint contract to wire later.

Planned endpoints:

- POST /workspaces/check-exists
- POST /workspaces/create
- GET /workspaces/list?userId=<id>
- POST /workspaces/open
- GET /workspaces/history?userId=<id>

You can replace the local mock implementation with real API calls when backend services are available.

## AWS Amplify Hosting Notes

- Connect this repository to Amplify Hosting.
- Build command: `npm run build`
- Output directory: `dist`
- Add environment variable in Amplify Console:
	- `VITE_API_BASE_URL`

Amplify will inject the environment variable at build time, allowing the app to call your service endpoints.
