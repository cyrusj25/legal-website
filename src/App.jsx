import { useEffect, useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import './App.css'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import ProfileSettingsPage from './pages/ProfileSettingsPage'
import SignupPage from './pages/SignupPage'
import WorkspaceDocumentsPage from './pages/WorkspaceDocumentsPage'
import {
  addWorkspaceHistory,
  checkWorkspaceExists,
  createWorkspace,
  listUserWorkspaces,
  listWorkspaceHistory,
  openWorkspace,
  uploadWorkspaceDocument,
} from './services/apiService'

const HARDCODED_CREDENTIALS = {
  userId: 'cyrusj25',
  password: 'Data@1234567',
  companyCode: 'DEEDLY',
}

const PROFILE_DIRECTORY = {
  cyrusj25: {
    fullName: 'Cyrus Johnson',
    role: 'Portal Administrator',
    email: 'cyrus.johnson@example.com',
    domain: 'BLORE LLC',
    region: 'us-east-1',
    lastLogin: '2026-07-12T21:00:00Z',
  },
}

const HISTORY_STORAGE_KEY = 'profile-load-history'

const BUYER_DOCUMENT_DEFINITIONS = [
  { key: 'Doc1', code: 'BA01' },
  { key: 'Doc2', code: 'BP02' },
  { key: 'Doc3', code: 'BI01' },
]

const SELLER_DOCUMENT_DEFINITIONS = [
  { key: 'Doc1', code: 'SA01' },
  { key: 'Doc2', code: 'SP01' },
  { key: 'Doc3', code: 'SI01' },
]

const PROPERTY_DOCUMENT_DEFINITIONS = [
  { key: 'Ekatha', code: 'EK01' },
  { key: 'Past Sale deed', code: 'SD01' },
  { key: 'Encumbrance Certificate (EC)', code: 'EC01' },
]

const HOME_LATEST_UPDATES = [
  {
    title: 'Autonomous Operations Engine Launched',
    text: 'To ue updated',
    tag: 'Announcement',
  },
  {
    title: 'Cloud Migration Accelerator Expanded',
    text: 'To ue updated',
    tag: 'Platform',
  },
  {
    title: 'Trust and Compliance Blueprint Published',
    text: 'To ue updated',
    tag: 'Insight',
  },
]

const HOME_SPOTLIGHT_ITEMS = [
  { title: 'AI-Driven Service Intelligence', text: 'To ue updated' },
  { title: 'Industry-Grade Security by Design', text: 'To ue updated' },
  { title: 'Global Delivery, Local Compliance', text: 'To ue updated' },
]

const HOME_INITIATIVES = [
  'Client Case Studio',
  'Sustainability Operations',
  'Innovation Lab Network',
  'Digital Workplace Programs',
  'Partner Ecosystem Exchange',
  'Talent and Career Pathways',
]

const SETTINGS_TABS = [
  { id: 'login-history', label: 'Login History' },
  { id: 'change-password', label: 'Change Password' },
]

const UI_THEME_STORAGE_KEY = 'ui-theme'
const WORKFLOW_STORAGE_KEY = 'workspace-workflow-v1'

const WORKFLOW_STEPS = [
  { id: 'basic-details', label: 'Enter Basic Details' },
  { id: 'upload-documents', label: 'Upload Documents' },
  { id: 'review-final-details', label: 'Review Final Details' },
  { id: 'generate-review-document', label: 'Generate Document for Review' },
  { id: 'download-document', label: 'Download Document' },
]

function createInitialBasicDetails() {
  return {
    numberOfSellers: '',
    numberOfBuyers: '',
    contactNamePrimary: '',
    contactPhonePrimaryCell: '',
    contactPhonePrimaryLandline: '',
    contactNameSecondary: '',
    contactPhoneSecondaryCell: '',
    contactPhoneSecondaryLandline: '',
    notes: '',
  }
}

function getStoredHistory() {
  const rawValue = localStorage.getItem(HISTORY_STORAGE_KEY)

  if (!rawValue) {
    return []
  }

  try {
    const parsed = JSON.parse(rawValue)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveHistory(historyList) {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyList))
}

function recordProfileLoad(userId) {
  const newEntry = {
    userId,
    loadedAt: new Date().toISOString(),
  }

  const existing = getStoredHistory()
  const updated = [newEntry, ...existing].slice(0, 20)
  saveHistory(updated)

  return updated
}

function createDocumentsFromDefinitions(documentDefinitions) {
  return documentDefinitions.map((doc) => ({
    ...doc,
    fileName: '',
    base64Data: '',
    previewUrl: '',
    lastAction: '',
    lastStatus: '',
  }))
}

function createInitialBuyerDocuments() {
  return createDocumentsFromDefinitions(BUYER_DOCUMENT_DEFINITIONS)
}

function createInitialSellerDocuments() {
  return createDocumentsFromDefinitions(SELLER_DOCUMENT_DEFINITIONS)
}

function createInitialPropertyDocuments() {
  return createDocumentsFromDefinitions(PROPERTY_DOCUMENT_DEFINITIONS)
}

function toValidPartyCount(inputValue) {
  const parsed = Number.parseInt(inputValue, 10)

  if (Number.isNaN(parsed) || parsed < 1) {
    return 1
  }

  return Math.min(parsed, 99)
}

function mergeDocumentList(existingDocuments, documentDefinitions) {
  const templateDocuments = createDocumentsFromDefinitions(documentDefinitions)

  if (!Array.isArray(existingDocuments)) {
    return templateDocuments
  }

  return templateDocuments.map((templateDoc) => {
    const matchingDoc = existingDocuments.find((doc) => doc.key === templateDoc.key)
    return matchingDoc
      ? {
          ...templateDoc,
          ...matchingDoc,
          key: templateDoc.key,
          code: templateDoc.code,
        }
      : templateDoc
  })
}

function createInitialWorkflowDocuments(buyerCount, sellerCount) {
  const validBuyerCount = toValidPartyCount(buyerCount)
  const validSellerCount = toValidPartyCount(sellerCount)

  return {
    buyerDocuments: Array.from({ length: validBuyerCount }, (_, index) => ({
      buyerNumber: index + 1,
      documents: createInitialBuyerDocuments(),
    })),
    sellerDocuments: Array.from({ length: validSellerCount }, (_, index) => ({
      sellerNumber: index + 1,
      documents: createInitialSellerDocuments(),
    })),
    propertyDocuments: createInitialPropertyDocuments(),
  }
}

function normalizeWorkflowDocumentsForCounts(existingDocuments, buyerCount, sellerCount) {
  const validBuyerCount = toValidPartyCount(buyerCount)
  const validSellerCount = toValidPartyCount(sellerCount)
  const defaultDocuments = createInitialWorkflowDocuments(validBuyerCount, validSellerCount)

  if (!existingDocuments || typeof existingDocuments !== 'object') {
    return defaultDocuments
  }

  if (Array.isArray(existingDocuments)) {
    const buyerFromLegacy = defaultDocuments.buyerDocuments.map((buyerEntry) =>
      buyerEntry.buyerNumber === 1
        ? { ...buyerEntry, documents: mergeDocumentList(existingDocuments) }
        : buyerEntry,
    )

    return {
      buyerDocuments: buyerFromLegacy,
      sellerDocuments: defaultDocuments.sellerDocuments,
    }
  }

  const existingBuyerDocuments = Array.isArray(existingDocuments.buyerDocuments)
    ? existingDocuments.buyerDocuments
    : []
  const existingSellerDocuments = Array.isArray(existingDocuments.sellerDocuments)
    ? existingDocuments.sellerDocuments
    : []

  const buyerIsGrouped =
    existingBuyerDocuments.length > 0 &&
    typeof existingBuyerDocuments[0] === 'object' &&
    Array.isArray(existingBuyerDocuments[0]?.documents)

  const normalizedBuyerDocuments = Array.from({ length: validBuyerCount }, (_, index) => {
    const buyerNumber = index + 1

    if (buyerIsGrouped) {
      const existingBuyer = existingBuyerDocuments.find(
        (buyerEntry) => buyerEntry?.buyerNumber === buyerNumber,
      )

      return {
        buyerNumber,
        documents: mergeDocumentList(existingBuyer?.documents, BUYER_DOCUMENT_DEFINITIONS),
      }
    }

    // Supports previously saved structure where buyerDocuments was a flat list.
    return {
      buyerNumber,
      documents:
        buyerNumber === 1
          ? mergeDocumentList(existingBuyerDocuments, BUYER_DOCUMENT_DEFINITIONS)
          : createInitialBuyerDocuments(),
    }
  })

  const normalizedSellerDocuments = Array.from({ length: validSellerCount }, (_, index) => {
    const sellerNumber = index + 1
    const existingSeller = existingSellerDocuments.find(
      (sellerEntry) => sellerEntry?.sellerNumber === sellerNumber,
    )

    return {
      sellerNumber,
      documents: mergeDocumentList(existingSeller?.documents, SELLER_DOCUMENT_DEFINITIONS),
    }
  })

  const normalizedPropertyDocuments = mergeDocumentList(
    existingDocuments.propertyDocuments,
    PROPERTY_DOCUMENT_DEFINITIONS,
  )

  return {
    buyerDocuments: normalizedBuyerDocuments,
    sellerDocuments: normalizedSellerDocuments,
    propertyDocuments: normalizedPropertyDocuments,
  }
}

function getAllDocumentEntries(workflowDocuments) {
  const buyerEntries = (workflowDocuments?.buyerDocuments || []).flatMap((buyerEntry) =>
    (buyerEntry.documents || []).map((doc) => ({
      ownerType: 'buyer',
      ownerIndex: buyerEntry.buyerNumber,
      ...doc,
    })),
  )

  const sellerEntries = (workflowDocuments?.sellerDocuments || []).flatMap((sellerEntry) =>
    (sellerEntry.documents || []).map((doc) => ({
      ownerType: 'seller',
      ownerIndex: sellerEntry.sellerNumber,
      ...doc,
    })),
  )

  const propertyEntries = (workflowDocuments?.propertyDocuments || []).map((doc) => ({
    ownerType: 'property',
    ownerIndex: 1,
    ...doc,
  }))

  return [...buyerEntries, ...sellerEntries, ...propertyEntries]
}

function buildDocumentProcessingPayload(documents) {
  return documents.map((doc) => ({
    ownerType: doc.ownerType,
    ownerIndex: doc.ownerIndex,
    documentKey: doc.key,
    documentCode: doc.code,
    fileName: doc.fileName,
    mimeType: doc.base64Data.split(';')[0].replace('data:', '') || 'application/octet-stream',
    base64Data: doc.base64Data.includes(',') ? doc.base64Data.split(',')[1] : doc.base64Data,
  }))
}

function createEmptyExtractedDocumentData(buyerCount, sellerCount) {
  return {
    partyInformation: {
      buyers: Array.from({ length: buyerCount }, (_, index) => ({
        buyerNumber: index + 1,
        fullNames: '',
        addresses: '',
        age: '',
        fathersName: '',
        identificationNumbers: {
          pan: '',
          aadhaar: '',
        },
      })),
      sellers: Array.from({ length: sellerCount }, (_, index) => ({
        sellerNumber: index + 1,
        fullNames: '',
        addresses: '',
        age: '',
        fathersName: '',
        identificationNumbers: {
          pan: '',
          aadhaar: '',
        },
      })),
    },
    propertyDescription: {
      specificAddress: '',
      surveyNumber: '',
      plotNumber: '',
      boundaries: '',
      totalArea: '',
      orientation: '',
    },
    financialTerms: {
      agreedSalePrice: '',
      paymentMode: '',
      advanceAmount: '',
      balancePending: '',
    },
    financialTermsExclude: {
      agreedSalePrice: false,
      paymentMode: false,
      advanceAmount: false,
      balancePending: false,
    },
    possessionAndTitle: {
      possessionHandoverDate: '',
      titleTransferDate: '',
      indemnityOrWarrantyClauses: '',
    },
  }
}

function normalizeExtractedDocumentData(extractedData, buyerCount, sellerCount) {
  const emptyData = createEmptyExtractedDocumentData(buyerCount, sellerCount)

  return {
    partyInformation: {
      buyers: emptyData.partyInformation.buyers.map((defaultBuyer, index) => {
        const sourceBuyer = extractedData?.partyInformation?.buyers?.[index]

        return {
          ...defaultBuyer,
          ...sourceBuyer,
          fullNames: Array.isArray(sourceBuyer?.fullNames)
            ? sourceBuyer.fullNames.join(', ')
            : (sourceBuyer?.fullNames || ''),
          addresses: Array.isArray(sourceBuyer?.addresses)
            ? sourceBuyer.addresses.join(', ')
            : (sourceBuyer?.addresses || ''),
          identificationNumbers: {
            ...defaultBuyer.identificationNumbers,
            ...(sourceBuyer?.identificationNumbers || {}),
          },
        }
      }),
      sellers: emptyData.partyInformation.sellers.map((defaultSeller, index) => {
        const sourceSeller = extractedData?.partyInformation?.sellers?.[index]

        return {
          ...defaultSeller,
          ...sourceSeller,
          fullNames: Array.isArray(sourceSeller?.fullNames)
            ? sourceSeller.fullNames.join(', ')
            : (sourceSeller?.fullNames || ''),
          addresses: Array.isArray(sourceSeller?.addresses)
            ? sourceSeller.addresses.join(', ')
            : (sourceSeller?.addresses || ''),
          identificationNumbers: {
            ...defaultSeller.identificationNumbers,
            ...(sourceSeller?.identificationNumbers || {}),
          },
        }
      }),
    },
    propertyDescription: {
      ...emptyData.propertyDescription,
      ...(extractedData?.propertyDescription || {}),
    },
    financialTerms: {
      ...emptyData.financialTerms,
      ...(extractedData?.financialTerms || {}),
    },
    financialTermsExclude: {
      ...emptyData.financialTermsExclude,
      ...(extractedData?.financialTermsExclude || {}),
    },
    possessionAndTitle: {
      ...emptyData.possessionAndTitle,
      ...(extractedData?.possessionAndTitle || {}),
    },
  }
}

function toStatementValue(value) {
  return value || ''
}

function buildPdfDocumentFromText(documentText) {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const horizontalMargin = 48
  const verticalMargin = 52
  const lineHeight = 18

  pdf.setFont('times', 'normal')
  pdf.setFontSize(11)

  const wrappedLines = pdf.splitTextToSize(documentText, pageWidth - horizontalMargin * 2)
  let currentY = verticalMargin

  wrappedLines.forEach((line, index) => {
    if (index > 0 && currentY > pageHeight - verticalMargin) {
      pdf.addPage()
      currentY = verticalMargin
    }

    pdf.text(line, horizontalMargin, currentY)
    currentY += lineHeight
  })

  return pdf
}

function buildMockExtractedDocumentData({ workflowBasicDetails }) {
  const buyerCount = Number.parseInt(workflowBasicDetails.numberOfBuyers, 10) || 0
  const sellerCount = Number.parseInt(workflowBasicDetails.numberOfSellers, 10) || 0

  return createEmptyExtractedDocumentData(buyerCount, sellerCount)
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error('Failed to read uploaded file.'))
    reader.readAsDataURL(file)
  })
}

function isAllowedDocumentFile(file) {
  const allowedMimeTypes = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ])
  const lowerName = file.name.toLowerCase()

  if (file.type.startsWith('image/')) {
    return true
  }

  if (allowedMimeTypes.has(file.type)) {
    return true
  }

  return (
    lowerName.endsWith('.pdf') ||
    lowerName.endsWith('.doc') ||
    lowerName.endsWith('.docx')
  )
}

function toWorkspacePath(workspaceName) {
  return `/${encodeURIComponent(workspaceName)}/`
}

function toProfilePath(userIdValue) {
  return `/${encodeURIComponent(userIdValue)}`
}

function toProfileSettingsPath(userIdValue) {
  return `/${encodeURIComponent(userIdValue)}/profile_settings`
}

function toHomePath() {
  return '/homepage/'
}

function navigateToPath(path) {
  if (window.location.pathname !== path) {
    window.history.pushState({}, '', path)
  }
}

function formatLoginTimestamp(date) {
  const pad2 = (value) => String(value).padStart(2, '0')
  const pad3 = (value) => String(value).padStart(3, '0')

  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(
    date.getUTCDate(),
  )} ${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}:${pad2(
    date.getUTCSeconds(),
  )}.${pad3(date.getUTCMilliseconds())} UTC`
}

function getWorkflowStore() {
  const rawValue = localStorage.getItem(WORKFLOW_STORAGE_KEY)

  if (!rawValue) {
    return {}
  }

  try {
    const parsed = JSON.parse(rawValue)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveWorkflowStore(store) {
  localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(store))
}

function App() {
  const [page, setPage] = useState('home')
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [companyCode, setCompanyCode] = useState(HARDCODED_CREDENTIALS.companyCode)
  const [currentUser, setCurrentUser] = useState(null)
  const [authContext, setAuthContext] = useState(null)
  const [authError, setAuthError] = useState('')
  const [signupRequestMessage, setSignupRequestMessage] = useState('')
  const [history, setHistory] = useState(() => getStoredHistory())

  const [workspaceName, setWorkspaceName] = useState('')
  const [workspaceList, setWorkspaceList] = useState([])
  const [selectedWorkspace, setSelectedWorkspace] = useState('')
  const [workspaceHistory, setWorkspaceHistory] = useState([])
  const [activeWorkspace, setActiveWorkspace] = useState(null)
  const [workspaceMessage, setWorkspaceMessage] = useState('')
  const [workspaceError, setWorkspaceError] = useState('')
  const [workspaceLoading, setWorkspaceLoading] = useState(false)

  const [workspaceDocuments, setWorkspaceDocuments] = useState(() =>
    createInitialWorkflowDocuments(1, 1),
  )
  const [documentActionLoading, setDocumentActionLoading] = useState(false)
  const [documentActionMessage, setDocumentActionMessage] = useState('')
  const [documentActionError, setDocumentActionError] = useState('')
  const [workflowStepIndex, setWorkflowStepIndex] = useState(0)
  const [workflowBasicDetails, setWorkflowBasicDetails] = useState(() =>
    createInitialBasicDetails(),
  )
  const [parsedDocumentResponse, setParsedDocumentResponse] = useState(null)
  const [generatedReviewDocument, setGeneratedReviewDocument] = useState('')
  const [workflowError, setWorkflowError] = useState('')
  const [workflowSaveMessage, setWorkflowSaveMessage] = useState('')

  const [currentPasswordInput, setCurrentPasswordInput] = useState('')
  const [newPasswordInput, setNewPasswordInput] = useState('')
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('')
  const [passwordChangeMessage, setPasswordChangeMessage] = useState('')
  const [passwordChangeError, setPasswordChangeError] = useState('')
  const [activeSettingsTab, setActiveSettingsTab] = useState(SETTINGS_TABS[0].id)
  const [theme] = useState('light')

  useEffect(() => {
    localStorage.setItem(UI_THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    if (page === 'home') {
      navigateToPath(toHomePath())
    }
  }, [page])

  const profile = useMemo(() => {
    if (!currentUser) {
      return null
    }

    return PROFILE_DIRECTORY[currentUser] || null
  }, [currentUser])

  const handleSignIn = (event) => {
    event.preventDefault()
    setAuthError('')

    if (
      userId === HARDCODED_CREDENTIALS.userId &&
      password === HARDCODED_CREDENTIALS.password &&
      companyCode === HARDCODED_CREDENTIALS.companyCode
    ) {
      const signInTimestamp = new Date()
      const profileForUser = PROFILE_DIRECTORY[userId] || {}

      setCurrentUser(userId)
      setAuthContext({
        userId,
        domain: profileForUser.domain || 'BLORE LLC',
        ip: profileForUser.ip || '10.103.1027.544',
        loginTimestamp: formatLoginTimestamp(signInTimestamp),
      })
      const updatedHistory = recordProfileLoad(userId)
      setHistory(updatedHistory)
      void loadWorkspaceContext(userId)
      navigateToPath(toProfilePath(userId))
      setPage('profile')
      setPassword('')
      return
    }

    setAuthError('Invalid credentials. Use the provided user ID, password, and company code.')
  }

  const loadWorkspaceContext = async (signedInUserId) => {
    const [workspaceResult, workspaceHistoryResult] = await Promise.all([
      listUserWorkspaces(signedInUserId),
      listWorkspaceHistory(signedInUserId),
    ])

    setWorkspaceList(workspaceResult.workspaces)
    setWorkspaceHistory(workspaceHistoryResult.history)

    if (workspaceResult.workspaces.length > 0) {
      setSelectedWorkspace(workspaceResult.workspaces[0].name)
    }
  }

  const persistWorkflowProgress = ({
    stepIndex = workflowStepIndex,
    basicDetails = workflowBasicDetails,
    documents = workspaceDocuments,
    parsedResponse = parsedDocumentResponse,
    generatedDocument = generatedReviewDocument,
    showMessage = false,
  } = {}) => {
    if (!currentUser || !activeWorkspace?.name) {
      return
    }

    const workflowStore = getWorkflowStore()
    const existingUserStore = workflowStore[currentUser] || {}
    const updatedAt = new Date().toISOString()

    workflowStore[currentUser] = {
      ...existingUserStore,
      [activeWorkspace.name]: {
        stepIndex,
        basicDetails,
        documents,
        parsedDocumentResponse: parsedResponse,
        generatedReviewDocument: generatedDocument,
        updatedAt,
      },
    }

    saveWorkflowStore(workflowStore)

    if (showMessage) {
      setWorkflowSaveMessage(
        `Workspace progress saved at ${new Date(updatedAt).toLocaleString()}.`,
      )
    }
  }

  const loadWorkflowProgress = (signedInUserId, workspaceNameValue) => {
    const workflowStore = getWorkflowStore()
    const savedProgress = workflowStore?.[signedInUserId]?.[workspaceNameValue]

    if (!savedProgress) {
      setWorkflowStepIndex(0)
      const initialBasicDetails = createInitialBasicDetails()
      setWorkflowBasicDetails(initialBasicDetails)
      setWorkspaceDocuments(
        createInitialWorkflowDocuments(
          initialBasicDetails.numberOfBuyers || 1,
          initialBasicDetails.numberOfSellers || 1,
        ),
      )
      setParsedDocumentResponse(null)
      setGeneratedReviewDocument('')
      setWorkflowError('')
      setWorkflowSaveMessage('')
      return
    }

    const normalizedStepIndex = Number.isInteger(savedProgress.stepIndex)
      ? Math.max(0, Math.min(savedProgress.stepIndex, WORKFLOW_STEPS.length - 1))
      : 0

    setWorkflowStepIndex(normalizedStepIndex)
    const resolvedBasicDetails = {
      ...createInitialBasicDetails(),
      ...(savedProgress.basicDetails || {}),
    }
    setWorkflowBasicDetails(resolvedBasicDetails)

    const restoredDocuments = normalizeWorkflowDocumentsForCounts(
      savedProgress.documents,
      resolvedBasicDetails.numberOfBuyers || 1,
      resolvedBasicDetails.numberOfSellers || 1,
    )
    setWorkspaceDocuments(restoredDocuments)

    setParsedDocumentResponse(
      savedProgress.parsedDocumentResponse && typeof savedProgress.parsedDocumentResponse === 'object'
        ? savedProgress.parsedDocumentResponse
        : null,
    )

    setGeneratedReviewDocument(
      typeof savedProgress.generatedReviewDocument === 'string'
        ? savedProgress.generatedReviewDocument
        : '',
    )
    setWorkflowError('')
    setWorkflowSaveMessage(
      savedProgress.updatedAt
        ? `Resumed saved workflow from ${new Date(savedProgress.updatedAt).toLocaleString()}.`
        : 'Resumed saved workspace workflow.',
    )
  }

  const handleSaveWorkflowProgress = () => {
    setWorkflowError('')
    persistWorkflowProgress({ showMessage: true })
  }

  const handleParsedDocumentResponseChange = (nextExtractedData) => {
    const buyerCount = Number.parseInt(workflowBasicDetails.numberOfBuyers, 10) || 0
    const sellerCount = Number.parseInt(workflowBasicDetails.numberOfSellers, 10) || 0

    setParsedDocumentResponse((previousResponse) => ({
      requestedAt: previousResponse?.requestedAt || new Date().toISOString(),
      payload: previousResponse?.payload || [],
      extractedData: normalizeExtractedDocumentData(nextExtractedData, buyerCount, sellerCount),
    }))
  }

  const handleWorkflowBasicDetailsChange = (fieldName, fieldValue) => {
    const isPhoneField =
      fieldName === 'contactPhonePrimaryCell' ||
      fieldName === 'contactPhonePrimaryLandline' ||
      fieldName === 'contactPhoneSecondaryCell' ||
      fieldName === 'contactPhoneSecondaryLandline'
    const isCountField = fieldName === 'numberOfSellers' || fieldName === 'numberOfBuyers'
    const isContactNameField =
      fieldName === 'contactNamePrimary' || fieldName === 'contactNameSecondary'

    let normalizedValue = fieldValue

    if (isPhoneField) {
      normalizedValue = fieldValue.replace(/\D/g, '').slice(0, 10)
    }

    if (isCountField) {
      normalizedValue = fieldValue.replace(/\D/g, '').slice(0, 2)
    }

    if (isContactNameField) {
      normalizedValue = fieldValue.slice(0, 250)
    }

    setWorkflowBasicDetails((previous) => ({
      ...previous,
      [fieldName]: normalizedValue,
    }))
    setParsedDocumentResponse(null)

    if (fieldName === 'numberOfSellers' || fieldName === 'numberOfBuyers') {
      setWorkspaceDocuments((previousDocuments) =>
        normalizeWorkflowDocumentsForCounts(
          previousDocuments,
          fieldName === 'numberOfBuyers'
            ? normalizedValue || 1
            : workflowBasicDetails.numberOfBuyers || 1,
          fieldName === 'numberOfSellers'
            ? normalizedValue || 1
            : workflowBasicDetails.numberOfSellers || 1,
        ),
      )
    }

    setWorkflowError('')
  }

  const handleGoToWorkflowStep = (targetIndex) => {
    const normalizedTarget = Math.max(0, Math.min(targetIndex, WORKFLOW_STEPS.length - 1))
    setWorkflowStepIndex(normalizedTarget)
    setWorkflowError('')
    persistWorkflowProgress({ stepIndex: normalizedTarget })
  }

  const handleWorkflowBack = () => {
    const previousStep = Math.max(0, workflowStepIndex - 1)
    setWorkflowStepIndex(previousStep)
    setWorkflowError('')
    persistWorkflowProgress({ stepIndex: previousStep })
  }

  const handleWorkflowNext = () => {
    if (workflowStepIndex === 0) {
      const sellerCount = Number(workflowBasicDetails.numberOfSellers)
      const buyerCount = Number(workflowBasicDetails.numberOfBuyers)
      const primaryCell = workflowBasicDetails.contactPhonePrimaryCell
      const primaryLandline = workflowBasicDetails.contactPhonePrimaryLandline
      const secondaryPhones = [
        workflowBasicDetails.contactPhoneSecondaryCell,
        workflowBasicDetails.contactPhoneSecondaryLandline,
      ]

      if (
        !workflowBasicDetails.numberOfSellers ||
        !workflowBasicDetails.numberOfBuyers ||
        !workflowBasicDetails.contactNamePrimary.trim() ||
        (!primaryCell && !primaryLandline)
      ) {
        setWorkflowError(
          'Complete required fields and provide at least one primary contact number (cell or landline).',
        )
        return
      }

      if (
        Number.isNaN(sellerCount) ||
        sellerCount < 1 ||
        sellerCount > 99 ||
        Number.isNaN(buyerCount) ||
        buyerCount < 1 ||
        buyerCount > 99
      ) {
        setWorkflowError('Number of sellers and buyers must be between 1 and 99.')
        return
      }

      if (
        workflowBasicDetails.contactNamePrimary.trim().length > 250 ||
        workflowBasicDetails.contactNameSecondary.trim().length > 250
      ) {
        setWorkflowError('Primary and secondary contact names must be within 250 characters.')
        return
      }

      if ((primaryCell && !/^\d{10}$/.test(primaryCell)) || (primaryLandline && !/^\d{10}$/.test(primaryLandline))) {
        setWorkflowError('Primary contact numbers must contain exactly 10 digits.')
        return
      }

      if (secondaryPhones.some((phoneNumber) => phoneNumber && !/^\d{10}$/.test(phoneNumber))) {
        setWorkflowError('Secondary phone numbers must contain exactly 10 digits when provided.')
        return
      }
    }

    if (workflowStepIndex === 1) {
      const uploadedCount = getAllDocumentEntries(workspaceDocuments).filter(
        (doc) => doc.base64Data,
      ).length
      if (uploadedCount === 0) {
        setWorkflowError('Upload at least one document before moving to review.')
        return
      }

      if (!parsedDocumentResponse) {
        setWorkflowError('Use Submit to process uploaded documents before moving to review.')
        return
      }
    }

    if (workflowStepIndex === 3 && !generatedReviewDocument.trim()) {
      setWorkflowError('Generate the review document before moving to download.')
      return
    }

    const nextStep = Math.min(WORKFLOW_STEPS.length - 1, workflowStepIndex + 1)
    setWorkflowStepIndex(nextStep)
    setWorkflowError('')
    persistWorkflowProgress({ stepIndex: nextStep })
  }

  const handleGenerateReviewDocument = () => {
    if (!activeWorkspace?.name || !currentUser) {
      setWorkflowError('Open a workspace before generating a review document.')
      return
    }

    const buyerCount = Number.parseInt(workflowBasicDetails.numberOfBuyers, 10) || 0
    const sellerCount = Number.parseInt(workflowBasicDetails.numberOfSellers, 10) || 0
    const normalizedExtractedData = normalizeExtractedDocumentData(
      parsedDocumentResponse?.extractedData,
      buyerCount,
      sellerCount,
    )
    const visibleFinancialTermEntries = [
      ['Agreed sale price', normalizedExtractedData.financialTerms.agreedSalePrice, normalizedExtractedData.financialTermsExclude.agreedSalePrice],
      ['Payment mode', normalizedExtractedData.financialTerms.paymentMode, normalizedExtractedData.financialTermsExclude.paymentMode],
      ['Advance amount', normalizedExtractedData.financialTerms.advanceAmount, normalizedExtractedData.financialTermsExclude.advanceAmount],
      ['Balance pending', normalizedExtractedData.financialTerms.balancePending, normalizedExtractedData.financialTermsExclude.balancePending],
    ].filter(([, , excluded]) => !excluded)
    const buyerStatements = normalizedExtractedData.partyInformation.buyers.map(
      (buyer) =>
        `Buyer ${buyer.buyerNumber}: Full names ${toStatementValue(buyer.fullNames)}. Addresses ${toStatementValue(buyer.addresses)}. Age ${toStatementValue(buyer.age)}. Father's name ${toStatementValue(buyer.fathersName)}. PAN ${toStatementValue(buyer.identificationNumbers.pan)}. Aadhaar ${toStatementValue(buyer.identificationNumbers.aadhaar)}.`,
    )
    const sellerStatements = normalizedExtractedData.partyInformation.sellers.map(
      (seller) =>
        `Seller ${seller.sellerNumber}: Full names ${toStatementValue(seller.fullNames)}. Addresses ${toStatementValue(seller.addresses)}. Age ${toStatementValue(seller.age)}. Father's name ${toStatementValue(seller.fathersName)}. PAN ${toStatementValue(seller.identificationNumbers.pan)}. Aadhaar ${toStatementValue(seller.identificationNumbers.aadhaar)}.`,
    )
    const financialStatement = visibleFinancialTermEntries.length === 0
      ? 'Financial Terms: '
      : `Financial Terms: ${visibleFinancialTermEntries
          .map(([label, value]) => `${label} ${toStatementValue(value)}`)
          .join('. ')}.`
    const generatedAt = new Date().toLocaleString()
    const reviewText = [
      `Workspace Review Document`,
      `Generated At: ${generatedAt}`,
      `Workspace: ${activeWorkspace.name}`,
      `User: ${currentUser}`,
      '',
      'Review Final Details',
      ...buyerStatements,
      ...sellerStatements,
      `Property Description: Specific address ${toStatementValue(normalizedExtractedData.propertyDescription.specificAddress)}. Survey number ${toStatementValue(normalizedExtractedData.propertyDescription.surveyNumber)}. Plot number ${toStatementValue(normalizedExtractedData.propertyDescription.plotNumber)}. Boundaries ${toStatementValue(normalizedExtractedData.propertyDescription.boundaries)}. Total area ${toStatementValue(normalizedExtractedData.propertyDescription.totalArea)}. Orientation of the property ${toStatementValue(normalizedExtractedData.propertyDescription.orientation)}.`,
      financialStatement,
      `Possession and Title: Date of possession handover ${toStatementValue(normalizedExtractedData.possessionAndTitle.possessionHandoverDate)}. Date of transfer of title ${toStatementValue(normalizedExtractedData.possessionAndTitle.titleTransferDate)}. Specific indemnity or warranty clauses regarding encumbrances ${toStatementValue(normalizedExtractedData.possessionAndTitle.indemnityOrWarrantyClauses)}.`,
    ].join('\n')

    setGeneratedReviewDocument(reviewText)
    setWorkflowError('')
    setWorkflowSaveMessage('Review document generated. You can now save and continue.')
    persistWorkflowProgress({ generatedDocument: reviewText })
  }

  const handleDownloadReviewDocument = () => {
    if (!generatedReviewDocument.trim()) {
      setWorkflowError('Generate a review document before downloading.')
      return
    }

    const pdfDocument = buildPdfDocumentFromText(generatedReviewDocument)
    const pdfBlob = pdfDocument.output('blob')
    const objectUrl = window.URL.createObjectURL(pdfBlob)
    const anchor = document.createElement('a')
    const timestamp = new Date()
    const pad2 = (value) => String(value).padStart(2, '0')
    const downloadFileName = `SALE_DEED_${activeWorkspace?.name || 'workspace'}_${timestamp.getFullYear()}${pad2(
      timestamp.getMonth() + 1,
    )}${pad2(timestamp.getDate())}${pad2(timestamp.getHours())}${pad2(
      timestamp.getMinutes(),
    )}${pad2(timestamp.getSeconds())}.pdf`

    // Future S3 upload hook:
    // await uploadGeneratedReviewPdf({
    //   userId: currentUser,
    //   workspaceName: activeWorkspace?.name,
    //   authContext,
    //   fileName: downloadFileName,
    //   pdfBlob,
    // })

    anchor.href = objectUrl
    anchor.download = downloadFileName
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    window.URL.revokeObjectURL(objectUrl)
    setWorkflowError('')
  }

  const handleDocumentFileChange = async (sectionType, ownerNumber, documentKey, event) => {
    const [selectedFile] = event.target.files || []

    if (!selectedFile) {
      return
    }

    if (!isAllowedDocumentFile(selectedFile)) {
      setDocumentActionError('Only image, PDF, and Word documents are allowed.')
      return
    }

    try {
      const base64Data = await readFileAsDataUrl(selectedFile)
      setWorkspaceDocuments((previousDocuments) => {
        if (sectionType === 'buyer') {
          return {
            ...previousDocuments,
            buyerDocuments: previousDocuments.buyerDocuments.map((buyerEntry) =>
              buyerEntry.buyerNumber === ownerNumber
                ? {
                    ...buyerEntry,
                    documents: buyerEntry.documents.map((doc) =>
                      doc.key === documentKey
                        ? {
                            ...doc,
                            fileName: selectedFile.name,
                            base64Data,
                            previewUrl: base64Data,
                            lastStatus: 'ready',
                          }
                        : doc,
                    ),
                  }
                : buyerEntry,
            ),
          }
        }

        if (sectionType === 'property') {
          return {
            ...previousDocuments,
            propertyDocuments: previousDocuments.propertyDocuments.map((doc) =>
              doc.key === documentKey
                ? {
                    ...doc,
                    fileName: selectedFile.name,
                    base64Data,
                    previewUrl: base64Data,
                    lastStatus: 'ready',
                  }
                : doc,
            ),
          }
        }

        return {
          ...previousDocuments,
          sellerDocuments: previousDocuments.sellerDocuments.map((sellerEntry) =>
            sellerEntry.sellerNumber === ownerNumber
              ? {
                  ...sellerEntry,
                  documents: sellerEntry.documents.map((doc) =>
                    doc.key === documentKey
                      ? {
                          ...doc,
                          fileName: selectedFile.name,
                          base64Data,
                          previewUrl: base64Data,
                          lastStatus: 'ready',
                        }
                      : doc,
                  ),
                }
              : sellerEntry,
          ),
        }
      })
      setParsedDocumentResponse(null)
      setDocumentActionError('')
    } catch {
      setDocumentActionError(`Unable to read ${documentKey}. Please upload again.`)
    }
  }

  const handleDiscardDocuments = () => {
    setWorkspaceDocuments(
      createInitialWorkflowDocuments(
        workflowBasicDetails.numberOfBuyers || 1,
        workflowBasicDetails.numberOfSellers || 1,
      ),
    )
    setParsedDocumentResponse(null)
    setDocumentActionMessage('All uploaded documents were discarded.')
    setDocumentActionError('')
    setWorkflowError('')
  }

  const sendDocuments = async (action) => {
    if (!activeWorkspace?.name || !currentUser) {
      setDocumentActionError('Create or open a workspace before uploading documents.')
      return
    }

    const readyDocuments = getAllDocumentEntries(workspaceDocuments).filter(
      (doc) => doc.base64Data,
    )
    if (readyDocuments.length === 0) {
      setDocumentActionError('Upload at least one document before this action.')
      return
    }

    setDocumentActionLoading(true)
    setDocumentActionError('')
    setDocumentActionMessage('')

    try {
      const processingPayload = buildDocumentProcessingPayload(readyDocuments)

      // Backend integration scaffold for document extraction. Keep this commented
      // until the client GET endpoint contract is finalized.
      // const extractionResponse = await Promise.all(
      //   processingPayload.map((payloadItem) =>
      //     callApi({
      //       method: 'GET',
      //       endpoint: '/document-processing/extract',
      //       payload: { captureInput: payloadItem },
      //       userId: currentUser,
      //       workspaceName: activeWorkspace.name,
      //       authContext,
      //     }),
      //   ),
      // )

      const uploadResults = await Promise.all(
        readyDocuments.map((doc) =>
          uploadWorkspaceDocument({
            userId: currentUser,
            workspaceName: activeWorkspace.name,
            authContext,
            description:
              doc.ownerType === 'buyer'
                ? `Buyer ${doc.ownerIndex} ${doc.key} details`
                : doc.ownerType === 'seller'
                  ? `Seller ${doc.ownerIndex} ${doc.key} details`
                  : `Property ${doc.key} details`,
            imageUrl: doc.base64Data,
            jwt: 999999999,
            dataType:
              doc.ownerType === 'buyer'
                ? `buyer-${doc.ownerIndex}-${doc.key}`
                : doc.ownerType === 'seller'
                  ? `seller-${doc.ownerIndex}-${doc.key}`
                  : `property-${doc.key}`,
            dataTypeCode: doc.code,
          }),
        ),
      )

      const succeededCount = uploadResults.filter((result) => result.ok).length
      const hasFailure = succeededCount !== uploadResults.length

      const resultMap = new Map(
        uploadResults.map((result, index) => {
          const sourceDoc = readyDocuments[index]
          const sourceKey = `${sourceDoc.ownerType}:${sourceDoc.ownerIndex}:${sourceDoc.key}`
          return [sourceKey, result]
        }),
      )

      setWorkspaceDocuments((previousDocuments) => ({
        ...previousDocuments,
        buyerDocuments: previousDocuments.buyerDocuments.map((buyerEntry) => ({
          ...buyerEntry,
          documents: buyerEntry.documents.map((doc) => {
            const sourceKey = `buyer:${buyerEntry.buyerNumber}:${doc.key}`
            const relatedResult = resultMap.get(sourceKey)

            if (!relatedResult) {
              return doc
            }

            return {
              ...doc,
              lastAction: action,
              lastStatus: relatedResult.ok ? 'uploaded' : 'failed',
            }
          }),
        })),
        sellerDocuments: previousDocuments.sellerDocuments.map((sellerEntry) => ({
          ...sellerEntry,
          documents: sellerEntry.documents.map((doc) => {
            const sourceKey = `seller:${sellerEntry.sellerNumber}:${doc.key}`
            const relatedResult = resultMap.get(sourceKey)

            if (!relatedResult) {
              return doc
            }

            return {
              ...doc,
              lastAction: action,
              lastStatus: relatedResult.ok ? 'uploaded' : 'failed',
            }
          }),
        })),
        propertyDocuments: previousDocuments.propertyDocuments.map((doc) => {
          const sourceKey = `property:1:${doc.key}`
          const relatedResult = resultMap.get(sourceKey)

          if (!relatedResult) {
            return doc
          }

          return {
            ...doc,
            lastAction: action,
            lastStatus: relatedResult.ok ? 'uploaded' : 'failed',
          }
        }),
      }))

      if (action === 'submit' && !hasFailure) {
        const mockedExtractionResponse = buildMockExtractedDocumentData({
          workflowBasicDetails,
          documents: readyDocuments,
        })

        const parsedResponse = {
          requestedAt: new Date().toISOString(),
          payload: processingPayload,
          extractedData: mockedExtractionResponse,
        }

        setParsedDocumentResponse(parsedResponse)

        const nextStep = Math.min(WORKFLOW_STEPS.length - 1, workflowStepIndex + 1)
        setWorkflowStepIndex(nextStep)
        persistWorkflowProgress({
          stepIndex: nextStep,
          parsedResponse,
        })
      }

      if (hasFailure) {
        setDocumentActionError(
          `${action} completed with partial failures. Successful uploads: ${succeededCount}/${uploadResults.length}.`,
        )
      } else {
        setDocumentActionMessage(
          `${action} completed successfully for ${uploadResults.length} document(s).`,
        )
      }
    } catch {
      setDocumentActionError(`Unable to ${action.toLowerCase()} documents. Please retry.`)
    } finally {
      setDocumentActionLoading(false)
    }
  }

  const handleCreateWorkspace = async (event) => {
    event.preventDefault()

    if (!currentUser) {
      setWorkspaceError('Please sign in before creating a workspace.')
      return
    }

    const normalizedName = workspaceName.trim()
    if (!normalizedName) {
      setWorkspaceError('Workspace name is required.')
      return
    }

    setWorkspaceError('')
    setWorkspaceMessage('')
    setWorkspaceLoading(true)

    try {
      const existsResult = await checkWorkspaceExists(currentUser, normalizedName)
      if (existsResult.exists) {
        setWorkspaceError('Workspace already exists. Choose a different name or open it.')
        return
      }

      const created = await createWorkspace(currentUser, normalizedName)
      await addWorkspaceHistory(currentUser, normalizedName, 'created')
      setWorkspaceMessage(`Workspace "${created.workspace.name}" created successfully.`)
      setActiveWorkspace(created.workspace)
      setWorkspaceName('')
      setDocumentActionError('')
      setDocumentActionMessage('')
      setWorkflowError('')
      setWorkflowSaveMessage('')
      await loadWorkspaceContext(currentUser)
      setSelectedWorkspace(created.workspace.name)
      loadWorkflowProgress(currentUser, created.workspace.name)
      navigateToPath(toWorkspacePath(created.workspace.name))
      setPage('workspace-documents')
    } catch {
      setWorkspaceError('Failed to create workspace. Please try again.')
    } finally {
      setWorkspaceLoading(false)
    }
  }

  const handleOpenWorkspace = async () => {
    if (!currentUser || !selectedWorkspace) {
      return
    }

    setWorkspaceError('')
    setWorkspaceMessage('')
    setWorkspaceLoading(true)

    try {
      const opened = await openWorkspace(currentUser, selectedWorkspace)
      await addWorkspaceHistory(currentUser, selectedWorkspace, 'opened')
      setActiveWorkspace(opened.workspace)
      setWorkspaceMessage(`Workspace "${selectedWorkspace}" opened.`)
      setDocumentActionError('')
      setDocumentActionMessage('')
      setWorkflowError('')
      setWorkflowSaveMessage('')
      await loadWorkspaceContext(currentUser)
      loadWorkflowProgress(currentUser, selectedWorkspace)
      navigateToPath(toWorkspacePath(selectedWorkspace))
      setPage('workspace-documents')
    } catch {
      setWorkspaceError('Failed to open workspace. Please try again.')
    } finally {
      setWorkspaceLoading(false)
    }
  }

  const handleRequestSignup = () => {
    setSignupRequestMessage('Signup request submitted. A portal admin will contact you.')
  }

  const openProfileSettingsPage = (tabId = SETTINGS_TABS[0].id) => {
    if (!currentUser) {
      return
    }

    setActiveSettingsTab(tabId)
    setPage('profile-settings')
    navigateToPath(toProfileSettingsPath(currentUser))
  }

  const openLoginPage = () => {
    setPage('login')
    navigateToPath('/')
  }

  const handlePasswordChange = (event) => {
    event.preventDefault()
    setPasswordChangeError('')
    setPasswordChangeMessage('')

    if (currentPasswordInput !== HARDCODED_CREDENTIALS.password) {
      setPasswordChangeError('Current password is incorrect.')
      return
    }

    if (newPasswordInput.trim().length < 8) {
      setPasswordChangeError('New password must be at least 8 characters long.')
      return
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordChangeError('New password and confirmation do not match.')
      return
    }

    setPasswordChangeMessage('Password change request submitted. To be updated.')
    setCurrentPasswordInput('')
    setNewPasswordInput('')
    setConfirmPasswordInput('')
  }

  const logout = () => {
    setCurrentUser(null)
    setAuthContext(null)
    setPage('home')
    setUserId('')
    setPassword('')
    setCompanyCode(HARDCODED_CREDENTIALS.companyCode)
    setAuthError('')
    setWorkspaceName('')
    setWorkspaceList([])
    setSelectedWorkspace('')
    setWorkspaceHistory([])
    setActiveWorkspace(null)
    setWorkspaceError('')
    setWorkspaceMessage('')
    setWorkspaceDocuments(createInitialWorkflowDocuments(1, 1))
    setParsedDocumentResponse(null)
    setDocumentActionLoading(false)
    setDocumentActionMessage('')
    setDocumentActionError('')
    setWorkflowStepIndex(0)
    setWorkflowBasicDetails(createInitialBasicDetails())
    setGeneratedReviewDocument('')
    setWorkflowError('')
    setWorkflowSaveMessage('')
    setCurrentPasswordInput('')
    setNewPasswordInput('')
    setConfirmPasswordInput('')
    setPasswordChangeMessage('')
    setPasswordChangeError('')
    setActiveSettingsTab(SETTINGS_TABS[0].id)
    navigateToPath(toHomePath())
  }

  const goBackToProfile = () => {
    setPage('profile')

    if (currentUser) {
      navigateToPath(toProfilePath(currentUser))
    }
  }

  const renderPageContent = () => {
    if (page === 'home') {
      return (
        <HomePage
          latestUpdates={HOME_LATEST_UPDATES}
          spotlightItems={HOME_SPOTLIGHT_ITEMS}
          initiatives={HOME_INITIATIVES}
        />
      )
    }

    if (page === 'login') {
      return (
        <LoginPage
          userId={userId}
          password={password}
          companyCode={companyCode}
          setUserId={setUserId}
          setPassword={setPassword}
          setCompanyCode={setCompanyCode}
          handleSignIn={handleSignIn}
          authError={authError}
        />
      )
    }

    if (page === 'signup') {
      return (
        <SignupPage
          handleRequestSignup={handleRequestSignup}
          signupRequestMessage={signupRequestMessage}
        />
      )
    }

    if (page === 'profile' && currentUser) {
      return (
        <ProfilePage
          workspaceName={workspaceName}
          setWorkspaceName={setWorkspaceName}
          handleCreateWorkspace={handleCreateWorkspace}
          workspaceLoading={workspaceLoading}
          selectedWorkspace={selectedWorkspace}
          setSelectedWorkspace={setSelectedWorkspace}
          workspaceList={workspaceList}
          handleOpenWorkspace={handleOpenWorkspace}
          activeWorkspace={activeWorkspace}
          workspaceError={workspaceError}
          workspaceMessage={workspaceMessage}
          openProfileSettingsPage={openProfileSettingsPage}
          logout={logout}
        />
      )
    }

    if (page === 'profile-settings' && currentUser && profile) {
      return (
        <ProfileSettingsPage
          currentUser={currentUser}
          profile={profile}
          onBackToProfile={goBackToProfile}
          settingsTabs={SETTINGS_TABS}
          activeSettingsTab={activeSettingsTab}
          setActiveSettingsTab={setActiveSettingsTab}
          history={history}
          workspaceHistory={workspaceHistory}
          handlePasswordChange={handlePasswordChange}
          currentPasswordInput={currentPasswordInput}
          setCurrentPasswordInput={setCurrentPasswordInput}
          newPasswordInput={newPasswordInput}
          setNewPasswordInput={setNewPasswordInput}
          confirmPasswordInput={confirmPasswordInput}
          setConfirmPasswordInput={setConfirmPasswordInput}
          passwordChangeError={passwordChangeError}
          passwordChangeMessage={passwordChangeMessage}
        />
      )
    }

    if (page === 'workspace-documents' && currentUser && activeWorkspace) {
      return (
        <WorkspaceDocumentsPage
          activeWorkspace={activeWorkspace}
          onBackToProfile={goBackToProfile}
          workflowSteps={WORKFLOW_STEPS}
          workflowStepIndex={workflowStepIndex}
          workflowBasicDetails={workflowBasicDetails}
          onWorkflowBasicDetailsChange={handleWorkflowBasicDetailsChange}
          onWorkflowBack={handleWorkflowBack}
          onWorkflowNext={handleWorkflowNext}
          onWorkflowSave={handleSaveWorkflowProgress}
          onGoToWorkflowStep={handleGoToWorkflowStep}
          workflowError={workflowError}
          workflowSaveMessage={workflowSaveMessage}
          workspaceDocuments={workspaceDocuments}
          parsedDocumentResponse={parsedDocumentResponse}
          onParsedDocumentResponseChange={handleParsedDocumentResponseChange}
          handleDocumentFileChange={handleDocumentFileChange}
          sendDocuments={sendDocuments}
          handleDiscardDocuments={handleDiscardDocuments}
          documentActionLoading={documentActionLoading}
          documentActionError={documentActionError}
          documentActionMessage={documentActionMessage}
          generatedReviewDocument={generatedReviewDocument}
          onGenerateReviewDocument={handleGenerateReviewDocument}
          onDownloadReviewDocument={handleDownloadReviewDocument}
        />
      )
    }

    return null
  }

  return (
    <div className={`portal-app-shell theme-${theme}`}>

      <div className="app-content">
        <div className={`portal-app ${page === 'workspace-documents' ? 'workspace-documents-layout' : ''}`}>
          <header className="hero">
            <div className="hero-top-row">
              <p className="eyebrow">AWS Amplify Ready Portal</p>
              {currentUser ? (
                <button type="button" className="ghost hero-auth-btn" onClick={logout}>
                  Log off
                </button>
              ) : (
                <button type="button" className="ghost hero-auth-btn" onClick={openLoginPage}>
                  Sign in
                </button>
              )}
            </div>
            <h1>Service Access Frontend</h1>
            <p>
              A secure single-page portal to access user profiles and invoke backend API
              endpoints for service workflows.
            </p>
          </header>

          <main>{renderPageContent()}</main>
        </div>
      </div>
    </div>
  )
}

export default App
