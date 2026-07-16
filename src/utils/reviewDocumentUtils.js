function toStatementValue(value) {
  return value || ''
}

export function buildReviewDocumentText({
  workspaceName,
  currentUser,
  generatedAt,
  normalizedExtractedData,
}) {
  const visibleFinancialTermEntries = [
    [
      'Agreed sale price',
      normalizedExtractedData.financialTerms.agreedSalePrice,
      normalizedExtractedData.financialTermsExclude.agreedSalePrice,
    ],
    [
      'Payment mode',
      normalizedExtractedData.financialTerms.paymentMode,
      normalizedExtractedData.financialTermsExclude.paymentMode,
    ],
    [
      'Advance amount',
      normalizedExtractedData.financialTerms.advanceAmount,
      normalizedExtractedData.financialTermsExclude.advanceAmount,
    ],
    [
      'Balance pending',
      normalizedExtractedData.financialTerms.balancePending,
      normalizedExtractedData.financialTermsExclude.balancePending,
    ],
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

  return [
    'Workspace Review Document',
    `Generated At: ${generatedAt}`,
    `Workspace: ${workspaceName}`,
    `User: ${currentUser}`,
    '',
    'Review Final Details',
    ...buyerStatements,
    ...sellerStatements,
    `Property Description: Specific address ${toStatementValue(normalizedExtractedData.propertyDescription.specificAddress)}. Survey number ${toStatementValue(normalizedExtractedData.propertyDescription.surveyNumber)}. Plot number ${toStatementValue(normalizedExtractedData.propertyDescription.plotNumber)}. Boundaries ${toStatementValue(normalizedExtractedData.propertyDescription.boundaries)}. Total area ${toStatementValue(normalizedExtractedData.propertyDescription.totalArea)}. Orientation of the property ${toStatementValue(normalizedExtractedData.propertyDescription.orientation)}.`,
    financialStatement,
    `Possession and Title: Date of possession handover ${toStatementValue(normalizedExtractedData.possessionAndTitle.possessionHandoverDate)}. Date of transfer of title ${toStatementValue(normalizedExtractedData.possessionAndTitle.titleTransferDate)}. Specific indemnity or warranty clauses regarding encumbrances ${toStatementValue(normalizedExtractedData.possessionAndTitle.indemnityOrWarrantyClauses)}.`,
  ].join('\n')
}