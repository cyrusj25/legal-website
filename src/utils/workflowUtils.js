import {
  BUYER_DOCUMENT_DEFINITIONS,
  PROPERTY_DOCUMENT_DEFINITIONS,
  SELLER_DOCUMENT_DEFINITIONS,
} from '../config/appConfig'

export function createInitialBasicDetails() {
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

export function createInitialWorkflowDocuments(buyerCount, sellerCount) {
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

// Preserve previously saved workflow shapes while enforcing the current document set.
export function normalizeWorkflowDocumentsForCounts(existingDocuments, buyerCount, sellerCount) {
  const validBuyerCount = toValidPartyCount(buyerCount)
  const validSellerCount = toValidPartyCount(sellerCount)
  const defaultDocuments = createInitialWorkflowDocuments(validBuyerCount, validSellerCount)

  if (!existingDocuments || typeof existingDocuments !== 'object') {
    return defaultDocuments
  }

  if (Array.isArray(existingDocuments)) {
    const buyerFromLegacy = defaultDocuments.buyerDocuments.map((buyerEntry) =>
      buyerEntry.buyerNumber === 1
        ? { ...buyerEntry, documents: mergeDocumentList(existingDocuments, BUYER_DOCUMENT_DEFINITIONS) }
        : buyerEntry,
    )

    return {
      buyerDocuments: buyerFromLegacy,
      sellerDocuments: defaultDocuments.sellerDocuments,
      propertyDocuments: defaultDocuments.propertyDocuments,
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

export function getAllDocumentEntries(workflowDocuments) {
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

export function buildDocumentProcessingPayload(documents) {
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

export function createEmptyExtractedDocumentData(buyerCount, sellerCount) {
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

export function normalizeExtractedDocumentData(extractedData, buyerCount, sellerCount) {
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

export function buildMockExtractedDocumentData({ workflowBasicDetails }) {
  const buyerCount = Number.parseInt(workflowBasicDetails.numberOfBuyers, 10) || 0
  const sellerCount = Number.parseInt(workflowBasicDetails.numberOfSellers, 10) || 0

  return createEmptyExtractedDocumentData(buyerCount, sellerCount)
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error('Failed to read uploaded file.'))
    reader.readAsDataURL(file)
  })
}

export function isAllowedDocumentFile(file) {
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