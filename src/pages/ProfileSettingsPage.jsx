function ProfileSettingsPage({
  currentUser,
  profile,
  onBackToProfile,
  settingsTabs,
  activeSettingsTab,
  setActiveSettingsTab,
  history,
  workspaceHistory,
  handlePasswordChange,
  currentPasswordInput,
  setCurrentPasswordInput,
  newPasswordInput,
  setNewPasswordInput,
  confirmPasswordInput,
  setConfirmPasswordInput,
  passwordChangeError,
  passwordChangeMessage,
}) {
  return (
    <section className="card">
      <div className="settings-page-header">
        <div>
          <h2>Settings</h2>
          <p className="hint">Use tabs to manage account history and password options.</p>
        </div>
        <button
          type="button"
          className="ghost"
          onClick={onBackToProfile}
        >
          Back to Profile
        </button>
      </div>

      <div className="settings-tabs" role="tablist" aria-label="Profile settings tabs">
        {settingsTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeSettingsTab === tab.id}
            className={`settings-tab ${activeSettingsTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveSettingsTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSettingsTab === 'login-history' && (
        <>
          <div className="profile-grid">
            <section className="profile-subcard">
              <h3>User Details</h3>
              <p><strong>User ID:</strong> {currentUser}</p>
              <p><strong>Name:</strong> {profile.fullName}</p>
              <p><strong>Role:</strong> {profile.role}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Region:</strong> {profile.region}</p>
              <p><strong>Last Login:</strong> {new Date(profile.lastLogin).toLocaleString()}</p>
            </section>

            <section className="profile-subcard">
              <h3>User Login History</h3>
              {history.length === 0 ? (
                <p className="hint">No profile history yet.</p>
              ) : (
                <ul className="history-list">
                  {history.map((entry, index) => (
                    <li key={`${entry.userId}-${entry.loadedAt}-${index}`}>
                      <span>{entry.userId}</span>
                      <span>{new Date(entry.loadedAt).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="profile-subcard profile-settings-history">
            <h3>Workspace Activity History</h3>
            {workspaceHistory.length === 0 ? (
              <p className="hint">No workspace activity yet.</p>
            ) : (
              <ul className="history-list">
                {workspaceHistory.map((entry, index) => (
                  <li key={`${entry.workspaceName}-${entry.action}-${entry.at}-${index}`}>
                    <span>
                      {entry.workspaceName} ({entry.action})
                    </span>
                    <span>{new Date(entry.at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {activeSettingsTab === 'change-password' && (
        <section className="profile-subcard profile-settings-history">
          <h3>Change Password</h3>
          <form className="stacked-form" onSubmit={handlePasswordChange}>
            <label htmlFor="current-password-input">Current Password</label>
            <input
              id="current-password-input"
              type="password"
              value={currentPasswordInput}
              onChange={(event) => setCurrentPasswordInput(event.target.value)}
              required
            />

            <label htmlFor="new-password-input">New Password</label>
            <input
              id="new-password-input"
              type="password"
              value={newPasswordInput}
              onChange={(event) => setNewPasswordInput(event.target.value)}
              required
            />

            <label htmlFor="confirm-password-input">Confirm New Password</label>
            <input
              id="confirm-password-input"
              type="password"
              value={confirmPasswordInput}
              onChange={(event) => setConfirmPasswordInput(event.target.value)}
              required
            />

            <button type="submit">Change Password</button>
          </form>

          {passwordChangeError && <p className="error-message">{passwordChangeError}</p>}
          {passwordChangeMessage && <p className="success-message">{passwordChangeMessage}</p>}
        </section>
      )}
    </section>
  )
}

export default ProfileSettingsPage
