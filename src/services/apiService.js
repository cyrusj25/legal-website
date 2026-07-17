import { getIdToken } from './authService'

const DEFAULT_API_BASE_URL = 'https://example.execute-api.us-east-1.amazonaws.com/prod'

const PROFILE_ENDPOINTS = {
  get: '/profile',
  loginHistory: '/profile/login-history',
}

const WORKSPACE_ENDPOINTS = {
  checkExists: '/workspaces/check-exists',
  create: '/workspaces/create',
  list: '/workspaces/list',
  open: '/workspaces/open',
  history: '/workspaces/history',
}

const DOCUMENT_ENDPOINTS = {
  upload: '/workspace/documents/upload',
  extract: '/workspace/documents/extract',
  uploadReviewPdf: '/workspace/documents/upload-review-pdf',
}

function getWorkflowEndpoint(workspaceName) {
  return `/workspaces/${encodeURIComponent(workspaceName)}/workflow`
}

function getReviewDocumentEndpoint(workspaceName) {
  return `/workspaces/${encodeURIComponent(workspaceName)}/review-document`
}

function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
}

function buildRequestPayload({ userId, workspaceName, workspaceFor, captureInput, authContext }) {
  return {
    data: {
      userId: userId || authContext?.userId || '',
      companyCode: authContext?.companyCode || '',
      loginTimestamp: authContext?.loginTimestamp || new Date().toISOString(),
      profilemetadata: {
        workspaceName: workspaceName || '',
        workSpacefor: workspaceFor || '',
      },
      captureInput: captureInput === undefined ? null : captureInput,
    },
  }
}

function getPayloadSegments(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      captureInput: payload === undefined ? null : payload,
      workspaceFor: undefined,
    }
  }

  if (payload.captureInput !== undefined) {
    return {
      captureInput: payload.captureInput,
      workspaceFor: payload.workspaceFor,
    }
  }

  return {
    captureInput: payload,
    workspaceFor: payload.workspaceFor,
  }
}

// Every call is authenticated with the signed-in Cognito user's ID token so
// the API Gateway Cognito authorizer can validate the request before it
// reaches the backing Lambda function.
export async function callApi({
  method,
  endpoint,
  payload,
  userId,
  workspaceName,
  authContext,
}) {
  const normalizedPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const payloadSegments = getPayloadSegments(payload)
  const requestPayload = buildRequestPayload({
    userId,
    workspaceName,
    workspaceFor: payloadSegments.workspaceFor,
    captureInput: payloadSegments.captureInput,
    authContext,
  })
  const baseUrl = `${getApiBaseUrl()}${normalizedPath}`
  const url =
    method === 'GET' || method === 'DELETE'
      ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}requestData=${encodeURIComponent(
          JSON.stringify(requestPayload.data),
        )}`
      : baseUrl

  const idToken = await getIdToken()

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body:
      method === 'GET' || method === 'DELETE'
        ? undefined
        : JSON.stringify(requestPayload),
  })

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  return {
    ok: response.ok,
    status: response.status,
    data,
    requestPayload,
  }
}

// ---- Profile ----

export async function getProfile(userId, authContext) {
  const response = await callApi({
    method: 'GET',
    endpoint: PROFILE_ENDPOINTS.get,
    userId,
    authContext,
  })

  return {
    profile: response.data?.profile || null,
    endpoint: PROFILE_ENDPOINTS.get,
  }
}

export async function recordLoginHistory(userId, authContext) {
  const response = await callApi({
    method: 'POST',
    endpoint: PROFILE_ENDPOINTS.loginHistory,
    userId,
    authContext,
    payload: { captureInput: { operation: 'recordLoginHistory' } },
  })

  return {
    history: Array.isArray(response.data?.history) ? response.data.history : [],
    endpoint: PROFILE_ENDPOINTS.loginHistory,
  }
}

export async function listLoginHistory(userId, authContext) {
  const response = await callApi({
    method: 'GET',
    endpoint: PROFILE_ENDPOINTS.loginHistory,
    userId,
    authContext,
  })

  return {
    history: Array.isArray(response.data?.history) ? response.data.history : [],
    endpoint: PROFILE_ENDPOINTS.loginHistory,
  }
}

// ---- Workspaces ----

export async function checkWorkspaceExists(userId, workspaceName, authContext) {
  const response = await callApi({
    method: 'POST',
    endpoint: WORKSPACE_ENDPOINTS.checkExists,
    userId,
    workspaceName,
    authContext,
    payload: { captureInput: { operation: 'checkWorkspaceExists' } },
  })

  return {
    exists: Boolean(response.data?.exists),
    endpoint: WORKSPACE_ENDPOINTS.checkExists,
  }
}

export async function createWorkspace(userId, workspaceName, authContext) {
  const response = await callApi({
    method: 'POST',
    endpoint: WORKSPACE_ENDPOINTS.create,
    userId,
    workspaceName,
    authContext,
    payload: { captureInput: { operation: 'createWorkspace' } },
  })

  return {
    workspace: response.data?.workspace || null,
    endpoint: WORKSPACE_ENDPOINTS.create,
  }
}

export async function listUserWorkspaces(userId, authContext) {
  const response = await callApi({
    method: 'GET',
    endpoint: WORKSPACE_ENDPOINTS.list,
    userId,
    authContext,
  })

  return {
    workspaces: Array.isArray(response.data?.workspaces) ? response.data.workspaces : [],
    endpoint: WORKSPACE_ENDPOINTS.list,
  }
}

export async function openWorkspace(userId, workspaceName, authContext) {
  const response = await callApi({
    method: 'POST',
    endpoint: WORKSPACE_ENDPOINTS.open,
    userId,
    workspaceName,
    authContext,
    payload: { captureInput: { operation: 'openWorkspace' } },
  })

  return {
    workspace: response.data?.workspace || null,
    endpoint: WORKSPACE_ENDPOINTS.open,
  }
}

export async function addWorkspaceHistory(userId, workspaceName, action, authContext) {
  const response = await callApi({
    method: 'POST',
    endpoint: WORKSPACE_ENDPOINTS.history,
    userId,
    workspaceName,
    authContext,
    payload: { captureInput: { operation: 'addWorkspaceHistory', action } },
  })

  return {
    history: Array.isArray(response.data?.history) ? response.data.history : [],
    endpoint: WORKSPACE_ENDPOINTS.history,
  }
}

export async function listWorkspaceHistory(userId, authContext) {
  const response = await callApi({
    method: 'GET',
    endpoint: WORKSPACE_ENDPOINTS.history,
    userId,
    authContext,
  })

  return {
    history: Array.isArray(response.data?.history) ? response.data.history : [],
    endpoint: WORKSPACE_ENDPOINTS.history,
  }
}

// ---- Workflow progress ----

export async function getWorkflowProgress(userId, workspaceName, authContext) {
  const response = await callApi({
    method: 'GET',
    endpoint: getWorkflowEndpoint(workspaceName),
    userId,
    workspaceName,
    authContext,
  })

  return {
    progress: response.data?.progress || null,
    endpoint: getWorkflowEndpoint(workspaceName),
  }
}

export async function saveWorkflowProgress({
  userId,
  workspaceName,
  authContext,
  stepIndex,
  basicDetails,
  documents,
  parsedDocumentResponse,
  generatedReviewDocument,
}) {
  const response = await callApi({
    method: 'PUT',
    endpoint: getWorkflowEndpoint(workspaceName),
    userId,
    workspaceName,
    authContext,
    payload: {
      captureInput: {
        stepIndex,
        basicDetails,
        documents,
        parsedDocumentResponse,
        generatedReviewDocument,
      },
    },
  })

  return {
    updatedAt: response.data?.updatedAt || new Date().toISOString(),
    endpoint: getWorkflowEndpoint(workspaceName),
  }
}

// ---- Documents ----

export async function uploadWorkspaceDocument({
  userId,
  workspaceName,
  authContext,
  description,
  imageUrl,
  dataType,
  dataTypeCode,
}) {
  return callApi({
    method: 'POST',
    endpoint: DOCUMENT_ENDPOINTS.upload,
    userId,
    workspaceName,
    authContext,
    payload: {
      captureInput: {
        description,
        imageUrl,
        dataType,
        dataTypeCode,
      },
    },
  })
}

export async function extractWorkspaceDocuments({ userId, workspaceName, authContext, documents }) {
  const response = await callApi({
    method: 'POST',
    endpoint: DOCUMENT_ENDPOINTS.extract,
    userId,
    workspaceName,
    authContext,
    payload: { captureInput: { documents } },
  })

  return {
    extractedData: response.data?.extractedData || null,
    endpoint: DOCUMENT_ENDPOINTS.extract,
  }
}

export async function uploadGeneratedReviewPdf({
  userId,
  workspaceName,
  authContext,
  fileName,
  pdfBase64,
}) {
  return callApi({
    method: 'POST',
    endpoint: DOCUMENT_ENDPOINTS.uploadReviewPdf,
    userId,
    workspaceName,
    authContext,
    payload: {
      captureInput: {
        fileName,
        pdfBase64,
      },
    },
  })
}

export async function saveReviewDocument({ userId, workspaceName, authContext, reviewDocumentText }) {
  const response = await callApi({
    method: 'POST',
    endpoint: getReviewDocumentEndpoint(workspaceName),
    userId,
    workspaceName,
    authContext,
    payload: { captureInput: { reviewDocumentText } },
  })

  return {
    savedAt: response.data?.savedAt || new Date().toISOString(),
    endpoint: getReviewDocumentEndpoint(workspaceName),
  }
}
