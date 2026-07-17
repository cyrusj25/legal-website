import { useEffect, useState } from 'react'
import './App.css'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import ProfileSettingsPage from './pages/ProfileSettingsPage'
import SignupPage from './pages/SignupPage'
import WorkspaceDocumentsPage from './pages/WorkspaceDocumentsPage'
import {
  HOME_INITIATIVES,
  HOME_LATEST_UPDATES,
  HOME_SPOTLIGHT_ITEMS,
  SETTINGS_TABS,
  UI_THEME_STORAGE_KEY,
  WORKFLOW_STEPS,
} from './config/appConfig'
import {
  addWorkspaceHistory,
  checkWorkspaceExists,
  createWorkspace,
  extractWorkspaceDocuments,
  getProfile,
  getWorkflowProgress,
  listLoginHistory,
  listUserWorkspaces,
  listWorkspaceHistory,
  openWorkspace,
  recordLoginHistory,
  saveReviewDocument,
  saveWorkflowProgress,
  uploadGeneratedReviewPdf,
  uploadWorkspaceDocument,
} from './services/apiService'
import {
  changeCognitoPassword,
  confirmSignUpWithCognito,
  getAuthenticatedUserContext,
  restoreAuthSession,
  signInWithCognito,
  signOutFromCognito,
  signUpWithCognito,
} from './services/authService'
import {
  buildDocumentProcessingPayload,
  createInitialBasicDetails,
  createInitialWorkflowDocuments,
  getAllDocumentEntries,
  isAllowedDocumentFile,
  normalizeExtractedDocumentData,
  normalizeWorkflowDocumentsForCounts,
  readFileAsDataUrl,
} from './utils/workflowUtils'
import { buildPdfDocumentFromText, buildSaleDeedFileName } from './utils/pdfUtils'
import { buildReviewDocumentText } from './utils/reviewDocumentUtils'

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

function App() {
  const [page, setPage] = useState('home')
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [companyCode, setCompanyCode] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [authContext, setAuthContext] = useState(null)
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [profile, setProfile] = useState(null)
  const [signupStep, setSignupStep] = useState('request')
  const [signupUserId, setSignupUserId] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupCompanyCode, setSignupCompanyCode] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('')
  const [signupConfirmationCode, setSignupConfirmationCode] = useState('')
  const [signupRequestMessage, setSignupRequestMessage] = useState('')
  const [signupError, setSignupError] = useState('')
  const [signupLoading, setSignupLoading] = useState(false)
  const [history, setHistory] = useState([])

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
  const [authChecking, setAuthChecking] = useState(true)

  useEffect(() => {
    localStorage.setItem(UI_THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    if (page === 'home') {
      navigateToPath(toHomePath())
    }
  }, [page])

  // A SPA keeps a single document alive across reloads/back-forward
  // navigation, so Cognito's persisted session (not a fresh login) is the
  // source of truth for auth state on mount.
  useEffect(() => {
    let isMounted = true

    const restoreSession = async () => {
      const authenticatedUser = await restoreAuthSession()

      if (!authenticatedUser || !isMounted) {
        if (isMounted) {
          setAuthChecking(false)
        }
        return
      }

      const nextAuthContext = {
        userId: authenticatedUser.userId,
        companyCode: authenticatedUser.companyCode,
        email: authenticatedUser.email,
        loginTimestamp: formatLoginTimestamp(new Date()),
      }

      setCurrentUser(authenticatedUser.userId)
      setAuthContext(nextAuthContext)

      try {
        const [profileResult, loginHistoryResult] = await Promise.all([
          getProfile(authenticatedUser.userId, nextAuthContext),
          listLoginHistory(authenticatedUser.userId, nextAuthContext),
        ])

        if (!isMounted) {
          return
        }

        setProfile(profileResult.profile)
        setHistory(loginHistoryResult.history)
        void loadWorkspaceContext(authenticatedUser.userId, nextAuthContext)
        setPage('profile')
        navigateToPath(toProfilePath(authenticatedUser.userId))
      } finally {
        if (isMounted) {
          setAuthChecking(false)
        }
      }
    }

    restoreSession()

    return () => {
      isMounted = false
    }
    // Runs once on mount only; loadWorkspaceContext is intentionally excluded
    // since it is redefined every render and this effect must not re-run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Supports the browser's back/forward buttons, which a client-rendered
  // SPA must handle itself since there is no server round trip per page.
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname

      if (path === toHomePath()) {
        setPage('home')
        return
      }

      if (!currentUser) {
        if (path === '/') {
          setPage('login')
        }
        return
      }

      if (path === toProfileSettingsPath(currentUser)) {
        setPage('profile-settings')
        return
      }

      if (path === toProfilePath(currentUser)) {
        setPage('profile')
      }
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [currentUser])

  const handleSignIn = async (event) => {
    event.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    try {
      const signInResult = await signInWithCognito(userId, password)

      if (!signInResult?.isSignedIn) {
        setAuthError('Sign-in requires additional verification steps that are not yet supported.')
        return
      }

      const authenticatedUser = await getAuthenticatedUserContext()

      if (
        companyCode &&
        authenticatedUser.companyCode &&
        companyCode !== authenticatedUser.companyCode
      ) {
        await signOutFromCognito()
        setAuthError('Company code does not match this account.')
        return
      }

      const signInTimestamp = new Date()
      const nextAuthContext = {
        userId: authenticatedUser.userId,
        companyCode: authenticatedUser.companyCode || companyCode,
        email: authenticatedUser.email,
        loginTimestamp: formatLoginTimestamp(signInTimestamp),
      }

      setCurrentUser(authenticatedUser.userId)
      setAuthContext(nextAuthContext)

      const [profileResult, loginHistoryResult] = await Promise.all([
        getProfile(authenticatedUser.userId, nextAuthContext),
        recordLoginHistory(authenticatedUser.userId, nextAuthContext),
      ])

      setProfile(profileResult.profile)
      setHistory(loginHistoryResult.history)
      void loadWorkspaceContext(authenticatedUser.userId, nextAuthContext)
      navigateToPath(toProfilePath(authenticatedUser.userId))
      setPage('profile')
      setPassword('')
    } catch {
      setAuthError('Invalid credentials. Use a registered user ID, password, and company code.')
    } finally {
      setAuthLoading(false)
    }
  }

  const loadWorkspaceContext = async (signedInUserId, signedInAuthContext = authContext) => {
    const [workspaceResult, workspaceHistoryResult] = await Promise.all([
      listUserWorkspaces(signedInUserId, signedInAuthContext),
      listWorkspaceHistory(signedInUserId, signedInAuthContext),
    ])

    setWorkspaceList(workspaceResult.workspaces)
    setWorkspaceHistory(workspaceHistoryResult.history)

    if (workspaceResult.workspaces.length > 0) {
      setSelectedWorkspace(workspaceResult.workspaces[0].name)
    }
  }

  const persistWorkflowProgress = async ({
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

    try {
      const saveResult = await saveWorkflowProgress({
        userId: currentUser,
        workspaceName: activeWorkspace.name,
        authContext,
        stepIndex,
        basicDetails,
        documents,
        parsedDocumentResponse: parsedResponse,
        generatedReviewDocument: generatedDocument,
      })

      if (showMessage) {
        setWorkflowSaveMessage(
          `Workspace progress saved at ${new Date(saveResult.updatedAt).toLocaleString()}.`,
        )
      }
    } catch {
      if (showMessage) {
        setWorkflowError('Unable to save workspace progress. Please try again.')
      }
    }
  }

  const loadWorkflowProgress = async (signedInUserId, workspaceNameValue) => {
    const progressResult = await getWorkflowProgress(signedInUserId, workspaceNameValue, authContext)
    const savedProgress = progressResult.progress

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

  const handleSaveWorkflowProgress = async () => {
    setWorkflowError('')
    await persistWorkflowProgress({ showMessage: true })
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
    const generatedAt = new Date().toLocaleString()
      const reviewText = buildReviewDocumentText({
        workspaceName: activeWorkspace.name,
        currentUser,
        generatedAt,
        normalizedExtractedData,
      })

    setGeneratedReviewDocument(reviewText)
    setWorkflowError('')
    setWorkflowSaveMessage('Review document generated. You can now save and continue.')
    persistWorkflowProgress({ generatedDocument: reviewText })
  }

  const handleDownloadReviewDocument = async () => {
    if (!generatedReviewDocument.trim()) {
      setWorkflowError('Generate a review document before downloading.')
      return
    }

    const pdfDocument = buildPdfDocumentFromText(generatedReviewDocument)
    const pdfBlob = pdfDocument.output('blob')
    const pdfBase64 = pdfDocument.output('datauristring')
    const objectUrl = window.URL.createObjectURL(pdfBlob)
    const anchor = document.createElement('a')
    const downloadFileName = buildSaleDeedFileName(activeWorkspace?.name || 'workspace')

    try {
      await saveReviewDocument({
        userId: currentUser,
        workspaceName: activeWorkspace?.name,
        authContext,
        reviewDocumentText: generatedReviewDocument,
      })
      await uploadGeneratedReviewPdf({
        userId: currentUser,
        workspaceName: activeWorkspace?.name,
        authContext,
        fileName: downloadFileName,
        pdfBase64,
      })
      setWorkflowError('')
    } catch {
      setWorkflowError('Review document generated locally, but the backend copy failed to save.')
    }

    anchor.href = objectUrl
    anchor.download = downloadFileName
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    window.URL.revokeObjectURL(objectUrl)
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
        const extractionResult = await extractWorkspaceDocuments({
          userId: currentUser,
          workspaceName: activeWorkspace.name,
          authContext,
          documents: processingPayload,
        })

        const parsedResponse = {
          requestedAt: new Date().toISOString(),
          payload: processingPayload,
          extractedData: extractionResult.extractedData,
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
      const existsResult = await checkWorkspaceExists(currentUser, normalizedName, authContext)
      if (existsResult.exists) {
        setWorkspaceError('Workspace already exists. Choose a different name or open it.')
        return
      }

      const created = await createWorkspace(currentUser, normalizedName, authContext)
      await addWorkspaceHistory(currentUser, normalizedName, 'created', authContext)
      setWorkspaceMessage(`Workspace "${created.workspace.name}" created successfully.`)
      setActiveWorkspace(created.workspace)
      setWorkspaceName('')
      setDocumentActionError('')
      setDocumentActionMessage('')
      setWorkflowError('')
      setWorkflowSaveMessage('')
      await loadWorkspaceContext(currentUser, authContext)
      setSelectedWorkspace(created.workspace.name)
      await loadWorkflowProgress(currentUser, created.workspace.name)
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
      const opened = await openWorkspace(currentUser, selectedWorkspace, authContext)
      await addWorkspaceHistory(currentUser, selectedWorkspace, 'opened', authContext)
      setActiveWorkspace(opened.workspace)
      setWorkspaceMessage(`Workspace "${selectedWorkspace}" opened.`)
      setDocumentActionError('')
      setDocumentActionMessage('')
      setWorkflowError('')
      setWorkflowSaveMessage('')
      await loadWorkspaceContext(currentUser, authContext)
      await loadWorkflowProgress(currentUser, selectedWorkspace)
      navigateToPath(toWorkspacePath(selectedWorkspace))
      setPage('workspace-documents')
    } catch {
      setWorkspaceError('Failed to open workspace. Please try again.')
    } finally {
      setWorkspaceLoading(false)
    }
  }

  const handleRequestSignup = async (event) => {
    event.preventDefault()
    setSignupError('')
    setSignupRequestMessage('')

    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Password and confirmation do not match.')
      return
    }

    setSignupLoading(true)

    try {
      await signUpWithCognito({
        username: signupUserId,
        password: signupPassword,
        email: signupEmail,
        companyCode: signupCompanyCode,
      })
      setSignupStep('confirm')
      setSignupRequestMessage(
        'Verification code sent to your email. Enter it below to confirm your account.',
      )
    } catch (error) {
      setSignupError(error?.message || 'Unable to submit signup request. Please try again.')
    } finally {
      setSignupLoading(false)
    }
  }

  const handleConfirmSignup = async (event) => {
    event.preventDefault()
    setSignupError('')
    setSignupLoading(true)

    try {
      await confirmSignUpWithCognito(signupUserId, signupConfirmationCode)
      setSignupStep('request')
      setSignupUserId('')
      setSignupEmail('')
      setSignupCompanyCode('')
      setSignupPassword('')
      setSignupConfirmPassword('')
      setSignupConfirmationCode('')
      setSignupRequestMessage('Account confirmed. An administrator will review and approve access.')
    } catch (error) {
      setSignupError(error?.message || 'Unable to confirm signup. Please check the code and try again.')
    } finally {
      setSignupLoading(false)
    }
  }

  const openProfileSettingsPage = (tabId = SETTINGS_TABS[0].id) => {
    if (!currentUser) {
      return
    }

    setActiveSettingsTab(tabId)
    setPage('profile-settings')
    navigateToPath(toProfileSettingsPath(currentUser))
    void listLoginHistory(currentUser, authContext).then((result) => setHistory(result.history))
  }

  const openLoginPage = () => {
    setPage('login')
    navigateToPath('/')
  }

  const handlePasswordChange = async (event) => {
    event.preventDefault()
    setPasswordChangeError('')
    setPasswordChangeMessage('')

    if (newPasswordInput.trim().length < 8) {
      setPasswordChangeError('New password must be at least 8 characters long.')
      return
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordChangeError('New password and confirmation do not match.')
      return
    }

    try {
      await changeCognitoPassword(currentPasswordInput, newPasswordInput)
      setPasswordChangeMessage('Password changed successfully.')
      setCurrentPasswordInput('')
      setNewPasswordInput('')
      setConfirmPasswordInput('')
    } catch (error) {
      setPasswordChangeError(
        error?.message || 'Unable to change password. Please verify your current password.',
      )
    }
  }

  const logout = async () => {
    await signOutFromCognito()
    setCurrentUser(null)
    setAuthContext(null)
    setProfile(null)
    setHistory([])
    setPage('home')
    setUserId('')
    setPassword('')
    setCompanyCode('')
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
          authLoading={authLoading}
        />
      )
    }

    if (page === 'signup') {
      return (
        <SignupPage
          signupStep={signupStep}
          signupUserId={signupUserId}
          setSignupUserId={setSignupUserId}
          signupEmail={signupEmail}
          setSignupEmail={setSignupEmail}
          signupCompanyCode={signupCompanyCode}
          setSignupCompanyCode={setSignupCompanyCode}
          signupPassword={signupPassword}
          setSignupPassword={setSignupPassword}
          signupConfirmPassword={signupConfirmPassword}
          setSignupConfirmPassword={setSignupConfirmPassword}
          signupConfirmationCode={signupConfirmationCode}
          setSignupConfirmationCode={setSignupConfirmationCode}
          handleRequestSignup={handleRequestSignup}
          handleConfirmSignup={handleConfirmSignup}
          signupRequestMessage={signupRequestMessage}
          signupError={signupError}
          signupLoading={signupLoading}
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
        {authChecking ? (
          <div className="portal-app auth-session-checking">
            <p>Restoring your session...</p>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  )
}

export default App
