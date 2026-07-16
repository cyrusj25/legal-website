const DEFAULT_API_BASE_URL = 'https://example.execute-api.us-east-1.amazonaws.com/prod'
const WORKSPACE_STORE_KEY = 'workspace-store-v1'
const WORKSPACE_HISTORY_KEY = 'workspace-history-v1'

const DEFAULT_REQUEST_CONTEXT = {
  intKey: 108039,
  userId: 'cyrusj25',
  domain: 'BLORE LLC',
  ip: '10.103.1027.544',
  loginTimestamp: '2026-07-05 15:44:45.101021 UTC',
  captureInput: null,
  profilemetadata: {
    workspaceName: 'customer1',
    workSpacefor: 'sded',
  },
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
  uploadReviewPdf: '/workspace/documents/upload-review-pdf',
}

function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
}

function toStandardPayload({
  userId,
  workspaceName,
  workspaceFor,
  captureInput,
  authContext,
  dataOverrides,
}) {
  const resolvedUserId =
    userId || authContext?.userId || DEFAULT_REQUEST_CONTEXT.userId
  const resolvedDomain =
    authContext?.domain || dataOverrides?.domain || DEFAULT_REQUEST_CONTEXT.domain
  const resolvedIp =
    authContext?.ip || dataOverrides?.ip || DEFAULT_REQUEST_CONTEXT.ip
  const resolvedLoginTimestamp =
    authContext?.loginTimestamp ||
    dataOverrides?.loginTimestamp ||
    DEFAULT_REQUEST_CONTEXT.loginTimestamp

  return {
    data: {
      ...DEFAULT_REQUEST_CONTEXT,
      ...dataOverrides,
      userId: resolvedUserId,
      domain: resolvedDomain,
      ip: resolvedIp,
      loginTimestamp: resolvedLoginTimestamp,
      captureInput:
        captureInput === undefined
          ? DEFAULT_REQUEST_CONTEXT.captureInput
          : captureInput,
      profilemetadata: {
        ...DEFAULT_REQUEST_CONTEXT.profilemetadata,
        ...(dataOverrides?.profilemetadata || {}),
        workspaceName:
          workspaceName ||
          dataOverrides?.profilemetadata?.workspaceName ||
          DEFAULT_REQUEST_CONTEXT.profilemetadata.workspaceName,
        workSpacefor:
          workspaceFor ||
          dataOverrides?.profilemetadata?.workSpacefor ||
          DEFAULT_REQUEST_CONTEXT.profilemetadata.workSpacefor,
      },
    },
  }
}

function getPayloadSegments(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      captureInput: payload === undefined ? null : payload,
      dataOverrides: {},
      workspaceName: undefined,
      workspaceFor: undefined,
    }
  }

  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return {
      captureInput:
        payload.data.captureInput === undefined ? null : payload.data.captureInput,
      dataOverrides: payload.data,
      workspaceName: payload.data.profilemetadata?.workspaceName,
      workspaceFor: payload.data.profilemetadata?.workSpacefor,
    }
  }

  return {
    captureInput: payload.captureInput === undefined ? payload : payload.captureInput,
    dataOverrides: payload,
    workspaceName: payload.profilemetadata?.workspaceName,
    workspaceFor: payload.profilemetadata?.workSpacefor,
  }
}

function readJsonStorage(key, fallbackValue) {
  const value = localStorage.getItem(key)

  if (!value) {
    return fallbackValue
  }

  try {
    return JSON.parse(value)
  } catch {
    return fallbackValue
  }
}

function writeJsonStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function getWorkspaceStore() {
  return readJsonStorage(WORKSPACE_STORE_KEY, {})
}

function getWorkspaceHistoryStore() {
  return readJsonStorage(WORKSPACE_HISTORY_KEY, {})
}

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
  const requestPayload = toStandardPayload({
    userId,
    workspaceName,
    workspaceFor: payloadSegments.workspaceFor,
    captureInput: payloadSegments.captureInput,
    authContext,
    dataOverrides: payloadSegments.dataOverrides,
  })
  const baseUrl = `${getApiBaseUrl()}${normalizedPath}`
  const url =
    method === 'GET' || method === 'DELETE'
      ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}requestData=${encodeURIComponent(
          JSON.stringify(requestPayload.data),
        )}`
      : baseUrl

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
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

export async function checkWorkspaceExists(userId, workspaceName) {
  // TODO: Replace this local mock with a real backend call when endpoint is ready.
  // Example integration:
  // return callApi({
  //   method: 'POST',
  //   endpoint: WORKSPACE_ENDPOINTS.checkExists,
  //   userId,
  //   workspaceName,
  //   payload: { captureInput: { operation: 'checkWorkspaceExists' } },
  // })
  const store = getWorkspaceStore()
  const userWorkspaces = Array.isArray(store[userId]) ? store[userId] : []
  const exists = userWorkspaces.some(
    (workspace) => workspace.name.toLowerCase() === workspaceName.toLowerCase(),
  )

  return {
    exists,
    endpoint: WORKSPACE_ENDPOINTS.checkExists,
  }
}

export async function createWorkspace(userId, workspaceName) {
  // TODO: Replace this local mock with a real backend call when endpoint is ready.
  // Example integration:
  // return callApi({
  //   method: 'POST',
  //   endpoint: WORKSPACE_ENDPOINTS.create,
  //   userId,
  //   workspaceName,
  //   payload: { captureInput: { operation: 'createWorkspace' } },
  // })
  const store = getWorkspaceStore()
  const userWorkspaces = Array.isArray(store[userId]) ? store[userId] : []
  const newWorkspace = {
    id: `${workspaceName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    name: workspaceName,
    createdAt: new Date().toISOString(),
    lastOpenedAt: new Date().toISOString(),
  }

  store[userId] = [newWorkspace, ...userWorkspaces]
  writeJsonStorage(WORKSPACE_STORE_KEY, store)

  return {
    workspace: newWorkspace,
    endpoint: WORKSPACE_ENDPOINTS.create,
  }
}

export async function listUserWorkspaces(userId) {
  // TODO: Replace this local mock with a real backend call when endpoint is ready.
  // Example integration:
  // return callApi({ method: 'GET', endpoint: `${WORKSPACE_ENDPOINTS.list}?userId=${encodeURIComponent(userId)}`, userId })
  const store = getWorkspaceStore()
  const workspaces = Array.isArray(store[userId]) ? store[userId] : []

  return {
    workspaces,
    endpoint: WORKSPACE_ENDPOINTS.list,
  }
}

export async function openWorkspace(userId, workspaceName) {
  // TODO: Replace this local mock with a real backend call when endpoint is ready.
  // Example integration:
  // return callApi({
  //   method: 'POST',
  //   endpoint: WORKSPACE_ENDPOINTS.open,
  //   userId,
  //   workspaceName,
  //   payload: { captureInput: { operation: 'openWorkspace' } },
  // })
  const store = getWorkspaceStore()
  const userWorkspaces = Array.isArray(store[userId]) ? store[userId] : []

  const updated = userWorkspaces.map((workspace) => {
    if (workspace.name.toLowerCase() !== workspaceName.toLowerCase()) {
      return workspace
    }

    return {
      ...workspace,
      lastOpenedAt: new Date().toISOString(),
    }
  })

  store[userId] = updated
  writeJsonStorage(WORKSPACE_STORE_KEY, store)

  const activeWorkspace = updated.find(
    (workspace) => workspace.name.toLowerCase() === workspaceName.toLowerCase(),
  )

  return {
    workspace: activeWorkspace || null,
    endpoint: WORKSPACE_ENDPOINTS.open,
  }
}

export async function addWorkspaceHistory(userId, workspaceName, action) {
  // TODO: Replace this local mock with a real backend call when endpoint is ready.
  // Example integration:
  // return callApi({
  //   method: 'POST',
  //   endpoint: WORKSPACE_ENDPOINTS.history,
  //   userId,
  //   workspaceName,
  //   payload: { captureInput: { operation: 'addWorkspaceHistory', action } },
  // })
  const historyStore = getWorkspaceHistoryStore()
  const userHistory = Array.isArray(historyStore[userId]) ? historyStore[userId] : []
  const entry = {
    workspaceName,
    action,
    at: new Date().toISOString(),
  }

  historyStore[userId] = [entry, ...userHistory].slice(0, 40)
  writeJsonStorage(WORKSPACE_HISTORY_KEY, historyStore)

  return {
    history: historyStore[userId],
    endpoint: WORKSPACE_ENDPOINTS.history,
  }
}

export async function listWorkspaceHistory(userId) {
  // TODO: Replace this local mock with a real backend call when endpoint is ready.
  // Example integration:
  // return callApi({ method: 'GET', endpoint: `${WORKSPACE_ENDPOINTS.history}?userId=${encodeURIComponent(userId)}`, userId })
  const historyStore = getWorkspaceHistoryStore()

  return {
    history: Array.isArray(historyStore[userId]) ? historyStore[userId] : [],
    endpoint: WORKSPACE_ENDPOINTS.history,
  }
}

export async function uploadWorkspaceDocument({
  userId,
  workspaceName,
  authContext,
  description,
  imageUrl,
  jwt,
  dataType,
  dataTypeCode,
}) {
  // TODO: Replace or extend this endpoint when backend contract is finalized.
  // Example request payload sent to backend:
  // {
  //   data: {
  //     intKey,
  //     userId,
  //     domain,
  //     ip,
  //     loginTimestamp,
  //     captureInput: { description, imageUrl, jwt, dataType, dataTypeCode }
  //   }
  // }
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
        jwt,
        dataType,
        dataTypeCode,
      },
    },
  })
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
