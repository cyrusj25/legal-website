import { useState } from 'react'

function WorkspaceDocumentsPage({
  activeWorkspace,
  onBackToProfile,
  workflowSteps,
  workflowStepIndex,
  workflowBasicDetails,
  onWorkflowBasicDetailsChange,
  onWorkflowBack,
  onWorkflowNext,
  onWorkflowSave,
  onGoToWorkflowStep,
  workflowError,
  workflowSaveMessage,
  workspaceDocuments,
  parsedDocumentResponse,
  onParsedDocumentResponseChange,
  handleDocumentFileChange,
  sendDocuments,
  handleDiscardDocuments,
  documentActionLoading,
  documentActionError,
  documentActionMessage,
  generatedReviewDocument,
  onGenerateReviewDocument,
  onDownloadReviewDocument,
}) {
  const normalizeDateValue = (value) => {
    if (!value) {
      return ''
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-')
      return `${day}-${month}-${year}`
    }

    return value
  }

  const formatDateInputValue = (value) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 8)

    if (digitsOnly.length <= 2) {
      return digitsOnly
    }

    if (digitsOnly.length <= 4) {
      return `${digitsOnly.slice(0, 2)}-${digitsOnly.slice(2)}`
    }

    return `${digitsOnly.slice(0, 2)}-${digitsOnly.slice(2, 4)}-${digitsOnly.slice(4)}`
  }

  const [uploadTab, setUploadTab] = useState('buyer')
  const buyerDocumentGroups = workspaceDocuments?.buyerDocuments || []
  const sellerDocumentGroups = workspaceDocuments?.sellerDocuments || []
  const propertyDocuments = workspaceDocuments?.propertyDocuments || []

  const buyerDocumentLabels = {
    Doc1: 'Buyer Aadhar',
    Doc2: 'Buyer Pan',
    Doc3: 'Buyer ID proof (Optional)',
  }

  const sellerDocumentLabels = {
    Doc1: 'Seller Aadhar',
    Doc2: 'Seller Pan',
    Doc3: 'Seller ID proof (Optional)',
  }

  const getPartyDocumentLabel = (partyType, documentKey) => {
    if (partyType === 'buyer') {
      return buyerDocumentLabels[documentKey] || documentKey
    }

    return sellerDocumentLabels[documentKey] || documentKey
  }

  const uploadedBuyerDocuments = buyerDocumentGroups.flatMap((buyerEntry) =>
    buyerEntry.documents
      .filter((doc) => doc.base64Data)
      .map((doc) => ({ ...doc, buyerNumber: buyerEntry.buyerNumber })),
  )
  const uploadedSellerDocuments = sellerDocumentGroups.flatMap((sellerEntry) =>
    sellerEntry.documents
      .filter((doc) => doc.base64Data)
      .map((doc) => ({ ...doc, sellerNumber: sellerEntry.sellerNumber })),
  )
  const uploadedPropertyDocuments = propertyDocuments.filter((doc) => doc.base64Data)
  const buyerCount = Number.parseInt(workflowBasicDetails.numberOfBuyers, 10) || 0
  const sellerCount = Number.parseInt(workflowBasicDetails.numberOfSellers, 10) || 0
  const parsedReviewData = {
    partyInformation: {
      buyers: Array.from({ length: buyerCount }, (_, index) => {
        const buyer = parsedDocumentResponse?.extractedData?.partyInformation?.buyers?.[index]

        return {
          buyerNumber: index + 1,
          fullNames: Array.isArray(buyer?.fullNames) ? buyer.fullNames.join(', ') : (buyer?.fullNames || ''),
          addresses: Array.isArray(buyer?.addresses) ? buyer.addresses.join(', ') : (buyer?.addresses || ''),
          age: buyer?.age || '',
          fathersName: buyer?.fathersName || '',
          identificationNumbers: {
            pan: buyer?.identificationNumbers?.pan || '',
            aadhaar: buyer?.identificationNumbers?.aadhaar || '',
          },
        }
      }),
      sellers: Array.from({ length: sellerCount }, (_, index) => {
        const seller = parsedDocumentResponse?.extractedData?.partyInformation?.sellers?.[index]

        return {
          sellerNumber: index + 1,
          fullNames: Array.isArray(seller?.fullNames) ? seller.fullNames.join(', ') : (seller?.fullNames || ''),
          addresses: Array.isArray(seller?.addresses) ? seller.addresses.join(', ') : (seller?.addresses || ''),
          age: seller?.age || '',
          fathersName: seller?.fathersName || '',
          identificationNumbers: {
            pan: seller?.identificationNumbers?.pan || '',
            aadhaar: seller?.identificationNumbers?.aadhaar || '',
          },
        }
      }),
    },
    propertyDescription: {
      specificAddress: parsedDocumentResponse?.extractedData?.propertyDescription?.specificAddress || '',
      surveyNumber: parsedDocumentResponse?.extractedData?.propertyDescription?.surveyNumber || '',
      plotNumber: parsedDocumentResponse?.extractedData?.propertyDescription?.plotNumber || '',
      boundaries: parsedDocumentResponse?.extractedData?.propertyDescription?.boundaries || '',
      totalArea: parsedDocumentResponse?.extractedData?.propertyDescription?.totalArea || '',
      orientation: parsedDocumentResponse?.extractedData?.propertyDescription?.orientation || '',
    },
    financialTerms: {
      agreedSalePrice: parsedDocumentResponse?.extractedData?.financialTerms?.agreedSalePrice || '',
      paymentMode: parsedDocumentResponse?.extractedData?.financialTerms?.paymentMode || '',
      advanceAmount: parsedDocumentResponse?.extractedData?.financialTerms?.advanceAmount || '',
      balancePending: parsedDocumentResponse?.extractedData?.financialTerms?.balancePending || '',
    },
    financialTermsExclude: {
      agreedSalePrice:
        parsedDocumentResponse?.extractedData?.financialTermsExclude?.agreedSalePrice || false,
      paymentMode:
        parsedDocumentResponse?.extractedData?.financialTermsExclude?.paymentMode || false,
      advanceAmount:
        parsedDocumentResponse?.extractedData?.financialTermsExclude?.advanceAmount || false,
      balancePending:
        parsedDocumentResponse?.extractedData?.financialTermsExclude?.balancePending || false,
    },
    possessionAndTitle: {
      possessionHandoverDate:
        parsedDocumentResponse?.extractedData?.possessionAndTitle?.possessionHandoverDate || '',
      titleTransferDate:
        parsedDocumentResponse?.extractedData?.possessionAndTitle?.titleTransferDate || '',
      indemnityOrWarrantyClauses:
        parsedDocumentResponse?.extractedData?.possessionAndTitle?.indemnityOrWarrantyClauses || '',
    },
  }

  const handleParsedValueChange = (nextExtractedData) => {
    onParsedDocumentResponseChange(nextExtractedData)
  }

  const updateBuyerField = (buyerIndex, fieldName, fieldValue, transform = (value) => value) => {
    const nextBuyers = parsedReviewData.partyInformation.buyers.map((buyer, index) =>
      index === buyerIndex ? { ...buyer, [fieldName]: transform(fieldValue) } : buyer,
    )

    handleParsedValueChange({
      ...parsedReviewData,
      partyInformation: {
        ...parsedReviewData.partyInformation,
        buyers: nextBuyers,
      },
    })
  }

  const updateBuyerIdField = (buyerIndex, fieldName, fieldValue) => {
    const nextBuyers = parsedReviewData.partyInformation.buyers.map((buyer, index) =>
      index === buyerIndex
        ? {
            ...buyer,
            identificationNumbers: {
              ...buyer.identificationNumbers,
              [fieldName]: fieldValue,
            },
          }
        : buyer,
    )

    handleParsedValueChange({
      ...parsedReviewData,
      partyInformation: {
        ...parsedReviewData.partyInformation,
        buyers: nextBuyers,
      },
    })
  }

  const updateSellerField = (sellerIndex, fieldName, fieldValue, transform = (value) => value) => {
    const nextSellers = parsedReviewData.partyInformation.sellers.map((seller, index) =>
      index === sellerIndex ? { ...seller, [fieldName]: transform(fieldValue) } : seller,
    )

    handleParsedValueChange({
      ...parsedReviewData,
      partyInformation: {
        ...parsedReviewData.partyInformation,
        sellers: nextSellers,
      },
    })
  }

  const updateSellerIdField = (sellerIndex, fieldName, fieldValue) => {
    const nextSellers = parsedReviewData.partyInformation.sellers.map((seller, index) =>
      index === sellerIndex
        ? {
            ...seller,
            identificationNumbers: {
              ...seller.identificationNumbers,
              [fieldName]: fieldValue,
            },
          }
        : seller,
    )

    handleParsedValueChange({
      ...parsedReviewData,
      partyInformation: {
        ...parsedReviewData.partyInformation,
        sellers: nextSellers,
      },
    })
  }

  const updatePropertyField = (fieldName, fieldValue) => {
    handleParsedValueChange({
      ...parsedReviewData,
      propertyDescription: {
        ...parsedReviewData.propertyDescription,
        [fieldName]: fieldValue,
      },
    })
  }

  const updateFinancialField = (fieldName, fieldValue) => {
    handleParsedValueChange({
      ...parsedReviewData,
      financialTerms: {
        ...parsedReviewData.financialTerms,
        [fieldName]: fieldValue,
      },
    })
  }

  const updateFinancialExcludeField = (fieldName, checked) => {
    handleParsedValueChange({
      ...parsedReviewData,
      financialTermsExclude: {
        ...parsedReviewData.financialTermsExclude,
        [fieldName]: checked,
      },
    })
  }

  const updatePossessionField = (fieldName, fieldValue) => {
    handleParsedValueChange({
      ...parsedReviewData,
      possessionAndTitle: {
        ...parsedReviewData.possessionAndTitle,
        [fieldName]: fieldValue,
      },
    })
  }

  return (
    <section className="card">
      <div className="workspace-doc-header">
        <div>
          <h2>Workspace Documents</h2>
          <p className="hint">
            Workspace: <strong>{activeWorkspace.name}</strong>
          </p>
        </div>
        <button
          type="button"
          className="ghost"
          onClick={onBackToProfile}
        >
          Back to Profile
        </button>
      </div>

      <div className="workflow-stepper" role="tablist" aria-label="Workspace workflow steps">
        {workflowSteps.map((step, index) => {
          const isActive = workflowStepIndex === index
          const isCompleted = workflowStepIndex > index

          return (
            <button
              key={step.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`workflow-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              onClick={() => onGoToWorkflowStep(index)}
            >
              <span>{index + 1}</span>
              <strong>{step.label}</strong>
            </button>
          )
        })}
      </div>

      {workflowStepIndex === 0 && (
        <section className="profile-subcard workflow-panel">
          <h3>Enter Basic Details</h3>
          <p className="hint">Capture the core metadata before uploading documents.</p>

          <form className="stacked-form" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="number-of-sellers">Number of sellers (1 to 99)</label>
            <input
              id="number-of-sellers"
              type="number"
              min={1}
              max={99}
              value={workflowBasicDetails.numberOfSellers}
              onChange={(event) =>
                onWorkflowBasicDetailsChange('numberOfSellers', event.target.value)
              }
              placeholder="1-99"
              required
            />

            <label htmlFor="number-of-buyers">Number of buyers (1 to 99)</label>
            <input
              id="number-of-buyers"
              type="number"
              min={1}
              max={99}
              value={workflowBasicDetails.numberOfBuyers}
              onChange={(event) =>
                onWorkflowBasicDetailsChange('numberOfBuyers', event.target.value)
              }
              placeholder="1-99"
              required
            />

            <label htmlFor="contact-name-primary">Contact Name (Primary)</label>
            <input
              id="contact-name-primary"
              value={workflowBasicDetails.contactNamePrimary}
              maxLength={250}
              onChange={(event) =>
                onWorkflowBasicDetailsChange('contactNamePrimary', event.target.value)
              }
              placeholder="Up to 250 characters"
              required
            />

            <label htmlFor="contact-phone-primary-cell">Contact Phone Number (Primary - Cell)</label>
            <input
              id="contact-phone-primary-cell"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              value={workflowBasicDetails.contactPhonePrimaryCell}
              onChange={(event) =>
                onWorkflowBasicDetailsChange('contactPhonePrimaryCell', event.target.value)
              }
              placeholder="10 digits"
            />

            <label htmlFor="contact-phone-primary-landline">Contact Phone Number (Primary - Landline)</label>
            <input
              id="contact-phone-primary-landline"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              value={workflowBasicDetails.contactPhonePrimaryLandline}
              onChange={(event) =>
                onWorkflowBasicDetailsChange('contactPhonePrimaryLandline', event.target.value)
              }
              placeholder="10 digits"
            />

            <label htmlFor="contact-name-secondary">Contact Name (Secondary)</label>
            <input
              id="contact-name-secondary"
              value={workflowBasicDetails.contactNameSecondary}
              maxLength={250}
              onChange={(event) =>
                onWorkflowBasicDetailsChange('contactNameSecondary', event.target.value)
              }
              placeholder="Up to 250 characters"
            />

            <label htmlFor="contact-phone-secondary-cell">Contact Phone Number (Secondary)</label>
            <input
              id="contact-phone-secondary-cell"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              value={workflowBasicDetails.contactPhoneSecondaryCell}
              onChange={(event) =>
                onWorkflowBasicDetailsChange('contactPhoneSecondaryCell', event.target.value)
              }
              placeholder="10 digits"
            />

            <label htmlFor="contact-phone-secondary-landline">Contact Phone Number (Secondary - Landline)</label>
            <input
              id="contact-phone-secondary-landline"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              value={workflowBasicDetails.contactPhoneSecondaryLandline}
              onChange={(event) =>
                onWorkflowBasicDetailsChange('contactPhoneSecondaryLandline', event.target.value)
              }
              placeholder="10 digits"
            />

            <label htmlFor="basic-notes">Notes</label>
            <textarea
              id="basic-notes"
              rows={4}
              value={workflowBasicDetails.notes}
              onChange={(event) => onWorkflowBasicDetailsChange('notes', event.target.value)}
              placeholder="Optional context for reviewers"
            />
          </form>
        </section>
      )}

      {workflowStepIndex === 1 && (
        <section className="workflow-panel">
          <p className="hint">Upload and preview buyer, seller, and property documents before moving to review.</p>

          <div className="workflow-upload-tabs" role="tablist" aria-label="Upload type tabs">
            <button
              type="button"
              role="tab"
              aria-selected={uploadTab === 'buyer'}
              className={`settings-tab ${uploadTab === 'buyer' ? 'active' : ''}`}
              onClick={() => setUploadTab('buyer')}
            >
              Upload Buyer Documents
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={uploadTab === 'seller'}
              className={`settings-tab ${uploadTab === 'seller' ? 'active' : ''}`}
              onClick={() => setUploadTab('seller')}
            >
              Upload Seller Documents
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={uploadTab === 'property'}
              className={`settings-tab ${uploadTab === 'property' ? 'active' : ''}`}
              onClick={() => setUploadTab('property')}
            >
              Upload Property Details
            </button>
          </div>

          {uploadTab === 'buyer' && (
            <div className="workflow-seller-list">
              {buyerDocumentGroups.map((buyerEntry) => (
                <section key={buyerEntry.buyerNumber} className="profile-subcard workflow-seller-section">
                  <h4>Upload documents for Buyer {buyerEntry.buyerNumber}</h4>
                  <div className="doc-grid">
                    {buyerEntry.documents.map((doc) => (
                      <article key={`buyer-${buyerEntry.buyerNumber}-${doc.key}`} className="doc-card">
                        <h3>{getPartyDocumentLabel('buyer', doc.key)}</h3>

                        <label htmlFor={`upload-buyer-${buyerEntry.buyerNumber}-${doc.key}`}>
                          Upload Buyer {buyerEntry.buyerNumber} {getPartyDocumentLabel('buyer', doc.key)}
                        </label>
                        <input
                          id={`upload-buyer-${buyerEntry.buyerNumber}-${doc.key}`}
                          type="file"
                          accept="image/*,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={(event) => {
                            void handleDocumentFileChange('buyer', buyerEntry.buyerNumber, doc.key, event)
                          }}
                        />

                        {doc.fileName && <p className="hint">Selected: {doc.fileName}</p>}

                        {doc.previewUrl ? (
                          <img
                            src={doc.previewUrl}
                            alt={`Buyer ${buyerEntry.buyerNumber} ${doc.key} preview`}
                            className="doc-preview"
                          />
                        ) : (
                          <p className="hint">Preview will appear after upload.</p>
                        )}

                        {doc.lastAction && (
                          <p className="hint">
                            Last action: {doc.lastAction} ({doc.lastStatus})
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {uploadTab === 'seller' && (
            <div className="workflow-seller-list">
              {sellerDocumentGroups.map((sellerEntry) => (
                <section key={sellerEntry.sellerNumber} className="profile-subcard workflow-seller-section">
                  <h4>Upload documents for Seller {sellerEntry.sellerNumber}</h4>
                  <div className="doc-grid">
                    {sellerEntry.documents.map((doc) => (
                      <article key={`seller-${sellerEntry.sellerNumber}-${doc.key}`} className="doc-card">
                        <h3>{getPartyDocumentLabel('seller', doc.key)}</h3>

                        <label htmlFor={`upload-seller-${sellerEntry.sellerNumber}-${doc.key}`}>
                          Upload Seller {sellerEntry.sellerNumber} {getPartyDocumentLabel('seller', doc.key)}
                        </label>
                        <input
                          id={`upload-seller-${sellerEntry.sellerNumber}-${doc.key}`}
                          type="file"
                          accept="image/*,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={(event) => {
                            void handleDocumentFileChange('seller', sellerEntry.sellerNumber, doc.key, event)
                          }}
                        />

                        {doc.fileName && <p className="hint">Selected: {doc.fileName}</p>}

                        {doc.previewUrl ? (
                          <img
                            src={doc.previewUrl}
                            alt={`Seller ${sellerEntry.sellerNumber} ${doc.key} preview`}
                            className="doc-preview"
                          />
                        ) : (
                          <p className="hint">Preview will appear after upload.</p>
                        )}

                        {doc.lastAction && (
                          <p className="hint">
                            Last action: {doc.lastAction} ({doc.lastStatus})
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {uploadTab === 'property' && (
            <section className="profile-subcard workflow-seller-section">
              <h4>Upload Property Details</h4>
              <div className="doc-grid">
                {propertyDocuments.map((doc, index) => (
                  <article key={`property-${doc.key}`} className="doc-card">
                    <h3>{doc.key}</h3>

                    <label htmlFor={`upload-property-${index}`}>
                      Upload {doc.key}
                    </label>
                    <input
                      id={`upload-property-${index}`}
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(event) => {
                        void handleDocumentFileChange('property', 1, doc.key, event)
                      }}
                    />

                    {doc.fileName && <p className="hint">Selected: {doc.fileName}</p>}

                    {doc.previewUrl ? (
                      <img
                        src={doc.previewUrl}
                        alt={`${doc.key} preview`}
                        className="doc-preview"
                      />
                    ) : (
                      <p className="hint">Preview will appear after upload.</p>
                    )}

                    {doc.lastAction && (
                      <p className="hint">
                        Last action: {doc.lastAction} ({doc.lastStatus})
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          <div className="doc-actions-row">
            <button
              type="button"
              onClick={() => {
                void sendDocuments('save')
              }}
              disabled={documentActionLoading}
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                void sendDocuments('submit')
              }}
              disabled={documentActionLoading}
            >
              Submit
            </button>
            <button
              type="button"
              className="ghost"
              onClick={handleDiscardDocuments}
              disabled={documentActionLoading}
            >
              Discard
            </button>
          </div>

          {documentActionLoading && <p className="hint">Uploading documents...</p>}
          {documentActionError && <p className="error-message">{documentActionError}</p>}
          {documentActionMessage && <p className="success-message">{documentActionMessage}</p>}
        </section>
      )}

      {workflowStepIndex === 2 && (
        <section className="profile-subcard workflow-panel">
          <h3>Review Final Details</h3>
          <p className="hint">Validate the information below and jump back to edit if needed.</p>

          <div className="workflow-review-grid">
            <article className="workflow-review-card">
              <div className="workflow-review-title-row">
                <h4>Review Final Details</h4>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => onGoToWorkflowStep(1)}
                >
                  Edit
                </button>
              </div>
              <p className="hint">
                {parsedDocumentResponse?.requestedAt
                  ? `Processed at ${new Date(parsedDocumentResponse.requestedAt).toLocaleString()}.`
                  : 'Fields stay blank until a valid response is available. You can edit them manually.'}
              </p>

              <h5>Party Information</h5>
              {parsedReviewData.partyInformation.buyers.map((buyer, index) => (
                <div key={`parsed-buyer-${buyer.buyerNumber}`} className="review-section-block">
                  <p><strong>Buyer#:</strong> {buyer.buyerNumber}</p>
                  <div className="review-detail-grid">
                    <div className="review-field review-field-wide">
                      <label htmlFor={`buyer-full-names-${buyer.buyerNumber}`}>Full names</label>
                      <input
                        id={`buyer-full-names-${buyer.buyerNumber}`}
                        value={buyer.fullNames}
                        onChange={(event) => updateBuyerField(index, 'fullNames', event.target.value)}
                      />
                    </div>
                    <div className="review-field review-field-wide">
                      <label htmlFor={`buyer-addresses-${buyer.buyerNumber}`}>Addresses</label>
                      <textarea
                        id={`buyer-addresses-${buyer.buyerNumber}`}
                        rows={3}
                        value={buyer.addresses}
                        onChange={(event) => updateBuyerField(index, 'addresses', event.target.value)}
                      />
                    </div>
                    <div className="review-field">
                      <label htmlFor={`buyer-age-${buyer.buyerNumber}`}>Age</label>
                      <input
                        id={`buyer-age-${buyer.buyerNumber}`}
                        value={buyer.age}
                        onChange={(event) => updateBuyerField(index, 'age', event.target.value)}
                      />
                    </div>
                    <div className="review-field">
                      <label htmlFor={`buyer-father-${buyer.buyerNumber}`}>Father&apos;s name</label>
                      <input
                        id={`buyer-father-${buyer.buyerNumber}`}
                        value={buyer.fathersName}
                        onChange={(event) => updateBuyerField(index, 'fathersName', event.target.value)}
                      />
                    </div>
                    <div className="review-field">
                      <label htmlFor={`buyer-pan-${buyer.buyerNumber}`}>PAN</label>
                      <input
                        id={`buyer-pan-${buyer.buyerNumber}`}
                        value={buyer.identificationNumbers.pan}
                        onChange={(event) => updateBuyerIdField(index, 'pan', event.target.value)}
                      />
                    </div>
                    <div className="review-field">
                      <label htmlFor={`buyer-aadhaar-${buyer.buyerNumber}`}>Aadhaar</label>
                      <input
                        id={`buyer-aadhaar-${buyer.buyerNumber}`}
                        value={buyer.identificationNumbers.aadhaar}
                        onChange={(event) => updateBuyerIdField(index, 'aadhaar', event.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <h5>Party Information</h5>
              {parsedReviewData.partyInformation.sellers.map((seller, index) => (
                <div key={`parsed-seller-${seller.sellerNumber}`} className="review-section-block">
                  <p><strong>Seller#:</strong> {seller.sellerNumber}</p>
                  <div className="review-detail-grid">
                    <div className="review-field review-field-wide">
                      <label htmlFor={`seller-full-names-${seller.sellerNumber}`}>Full names</label>
                      <input
                        id={`seller-full-names-${seller.sellerNumber}`}
                        value={seller.fullNames}
                        onChange={(event) => updateSellerField(index, 'fullNames', event.target.value)}
                      />
                    </div>
                    <div className="review-field review-field-wide">
                      <label htmlFor={`seller-addresses-${seller.sellerNumber}`}>Addresses</label>
                      <textarea
                        id={`seller-addresses-${seller.sellerNumber}`}
                        rows={3}
                        value={seller.addresses}
                        onChange={(event) => updateSellerField(index, 'addresses', event.target.value)}
                      />
                    </div>
                    <div className="review-field">
                      <label htmlFor={`seller-age-${seller.sellerNumber}`}>Age</label>
                      <input
                        id={`seller-age-${seller.sellerNumber}`}
                        value={seller.age}
                        onChange={(event) => updateSellerField(index, 'age', event.target.value)}
                      />
                    </div>
                    <div className="review-field">
                      <label htmlFor={`seller-father-${seller.sellerNumber}`}>Father&apos;s name</label>
                      <input
                        id={`seller-father-${seller.sellerNumber}`}
                        value={seller.fathersName}
                        onChange={(event) => updateSellerField(index, 'fathersName', event.target.value)}
                      />
                    </div>
                    <div className="review-field">
                      <label htmlFor={`seller-pan-${seller.sellerNumber}`}>PAN</label>
                      <input
                        id={`seller-pan-${seller.sellerNumber}`}
                        value={seller.identificationNumbers.pan}
                        onChange={(event) => updateSellerIdField(index, 'pan', event.target.value)}
                      />
                    </div>
                    <div className="review-field">
                      <label htmlFor={`seller-aadhaar-${seller.sellerNumber}`}>Aadhaar</label>
                      <input
                        id={`seller-aadhaar-${seller.sellerNumber}`}
                        value={seller.identificationNumbers.aadhaar}
                        onChange={(event) => updateSellerIdField(index, 'aadhaar', event.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <h5>Property Description</h5>
              <div className="review-detail-grid review-section-block">
                <div className="review-field review-field-wide">
                  <label htmlFor="property-specific-address">Specific address</label>
                  <textarea
                    id="property-specific-address"
                    rows={3}
                    value={parsedReviewData.propertyDescription.specificAddress}
                    onChange={(event) => updatePropertyField('specificAddress', event.target.value)}
                  />
                </div>
                <div className="review-field">
                  <label htmlFor="property-survey-number">Survey number</label>
                  <input
                    id="property-survey-number"
                    value={parsedReviewData.propertyDescription.surveyNumber}
                    onChange={(event) => updatePropertyField('surveyNumber', event.target.value)}
                  />
                </div>
                <div className="review-field">
                  <label htmlFor="property-plot-number">Plot number</label>
                  <input
                    id="property-plot-number"
                    value={parsedReviewData.propertyDescription.plotNumber}
                    onChange={(event) => updatePropertyField('plotNumber', event.target.value)}
                  />
                </div>
                <div className="review-field review-field-wide">
                  <label htmlFor="property-boundaries">Boundaries</label>
                  <textarea
                    id="property-boundaries"
                    rows={3}
                    value={parsedReviewData.propertyDescription.boundaries}
                    onChange={(event) => updatePropertyField('boundaries', event.target.value)}
                  />
                </div>
                <div className="review-field">
                  <label htmlFor="property-total-area">Total area</label>
                  <input
                    id="property-total-area"
                    value={parsedReviewData.propertyDescription.totalArea}
                    onChange={(event) => updatePropertyField('totalArea', event.target.value)}
                  />
                </div>
                <div className="review-field">
                  <label htmlFor="property-orientation">Orientation of the property</label>
                  <input
                    id="property-orientation"
                    value={parsedReviewData.propertyDescription.orientation}
                    onChange={(event) => updatePropertyField('orientation', event.target.value)}
                  />
                </div>
              </div>

              <h5>Financial Terms</h5>
              <div className="review-detail-grid review-section-block">
                <div className={`review-field ${parsedReviewData.financialTermsExclude.agreedSalePrice ? 'review-field-excluded' : ''}`}>
                  <label htmlFor="financial-agreed-sale-price">Agreed sale price</label>
                  <input
                    id="financial-agreed-sale-price"
                    value={parsedReviewData.financialTerms.agreedSalePrice}
                    onChange={(event) => updateFinancialField('agreedSalePrice', event.target.value)}
                  />
                  <label className="review-checkbox-row" htmlFor="exclude-financial-agreed-sale-price">
                    <input
                      id="exclude-financial-agreed-sale-price"
                      type="checkbox"
                      checked={parsedReviewData.financialTermsExclude.agreedSalePrice}
                      onChange={(event) =>
                        updateFinancialExcludeField('agreedSalePrice', event.target.checked)
                      }
                    />
                    <span>Exclude</span>
                  </label>
                </div>
                <div className={`review-field ${parsedReviewData.financialTermsExclude.paymentMode ? 'review-field-excluded' : ''}`}>
                  <label htmlFor="financial-payment-mode">Payment mode</label>
                  <input
                    id="financial-payment-mode"
                    value={parsedReviewData.financialTerms.paymentMode}
                    onChange={(event) => updateFinancialField('paymentMode', event.target.value)}
                  />
                  <label className="review-checkbox-row" htmlFor="exclude-financial-payment-mode">
                    <input
                      id="exclude-financial-payment-mode"
                      type="checkbox"
                      checked={parsedReviewData.financialTermsExclude.paymentMode}
                      onChange={(event) =>
                        updateFinancialExcludeField('paymentMode', event.target.checked)
                      }
                    />
                    <span>Exclude</span>
                  </label>
                </div>
                <div className={`review-field ${parsedReviewData.financialTermsExclude.advanceAmount ? 'review-field-excluded' : ''}`}>
                  <label htmlFor="financial-advance-amount">Advance amount</label>
                  <input
                    id="financial-advance-amount"
                    value={parsedReviewData.financialTerms.advanceAmount}
                    onChange={(event) => updateFinancialField('advanceAmount', event.target.value)}
                  />
                  <label className="review-checkbox-row" htmlFor="exclude-financial-advance-amount">
                    <input
                      id="exclude-financial-advance-amount"
                      type="checkbox"
                      checked={parsedReviewData.financialTermsExclude.advanceAmount}
                      onChange={(event) =>
                        updateFinancialExcludeField('advanceAmount', event.target.checked)
                      }
                    />
                    <span>Exclude</span>
                  </label>
                </div>
                <div className={`review-field ${parsedReviewData.financialTermsExclude.balancePending ? 'review-field-excluded' : ''}`}>
                  <label htmlFor="financial-balance-pending">Balance pending</label>
                  <input
                    id="financial-balance-pending"
                    value={parsedReviewData.financialTerms.balancePending}
                    onChange={(event) => updateFinancialField('balancePending', event.target.value)}
                  />
                  <label className="review-checkbox-row" htmlFor="exclude-financial-balance-pending">
                    <input
                      id="exclude-financial-balance-pending"
                      type="checkbox"
                      checked={parsedReviewData.financialTermsExclude.balancePending}
                      onChange={(event) =>
                        updateFinancialExcludeField('balancePending', event.target.checked)
                      }
                    />
                    <span>Exclude</span>
                  </label>
                </div>
              </div>

              <h5>Possession and Title</h5>
              <div className="review-detail-grid review-section-block">
                <div className="review-field">
                  <label htmlFor="possession-handover-date">Date of possession handover</label>
                  <input
                    id="possession-handover-date"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{2}-\d{2}-\d{4}"
                    placeholder="DD-MM-YYYY"
                    value={normalizeDateValue(parsedReviewData.possessionAndTitle.possessionHandoverDate)}
                    onChange={(event) =>
                      updatePossessionField(
                        'possessionHandoverDate',
                        formatDateInputValue(event.target.value),
                      )
                    }
                  />
                </div>
                <div className="review-field">
                  <label htmlFor="possession-title-transfer-date">Date of transfer of title</label>
                  <input
                    id="possession-title-transfer-date"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{2}-\d{2}-\d{4}"
                    placeholder="DD-MM-YYYY"
                    value={normalizeDateValue(parsedReviewData.possessionAndTitle.titleTransferDate)}
                    onChange={(event) =>
                      updatePossessionField(
                        'titleTransferDate',
                        formatDateInputValue(event.target.value),
                      )
                    }
                  />
                </div>
                <div className="review-field review-field-wide">
                  <label htmlFor="possession-indemnity">Specific indemnity or warranty clauses regarding encumbrances</label>
                  <textarea
                    id="possession-indemnity"
                    rows={4}
                    value={parsedReviewData.possessionAndTitle.indemnityOrWarrantyClauses}
                    onChange={(event) => updatePossessionField('indemnityOrWarrantyClauses', event.target.value)}
                  />
                </div>
              </div>
            </article>

          </div>
        </section>
      )}

      {workflowStepIndex === 3 && (
        <section className="profile-subcard workflow-panel">
          <h3>Generate Document for Review</h3>
          <p className="hint">Generate a consolidated review document from the current workflow data.</p>

          <div className="doc-actions-row">
            <button type="button" onClick={onGenerateReviewDocument}>
              Generate Review Document
            </button>
          </div>

          {generatedReviewDocument && (
            <pre className="workflow-document-preview">{generatedReviewDocument}</pre>
          )}
        </section>
      )}

      {workflowStepIndex === 4 && (
        <section className="profile-subcard workflow-panel">
          <h3>Download Document</h3>
          <p className="hint">Download the generated review document and share it for approval.</p>

          <div className="doc-actions-row">
            <button type="button" onClick={onDownloadReviewDocument}>
              Download Review Document
            </button>
          </div>
        </section>
      )}

      <div className="workflow-actions-row">
        <button type="button" className="ghost" onClick={onWorkflowSave}>
          Save Workspace Progress
        </button>
        <button
          type="button"
          className="ghost"
          onClick={onWorkflowBack}
          disabled={workflowStepIndex === 0}
        >
          Back
        </button>
        <button
          type="button"
          onClick={onWorkflowNext}
          disabled={workflowStepIndex === workflowSteps.length - 1}
        >
          Next
        </button>
      </div>

      {workflowError && <p className="error-message">{workflowError}</p>}
      {workflowSaveMessage && <p className="success-message">{workflowSaveMessage}</p>}
    </section>
  )
}

export default WorkspaceDocumentsPage
