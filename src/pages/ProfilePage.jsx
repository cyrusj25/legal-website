function ProfilePage({
  workspaceName,
  setWorkspaceName,
  handleCreateWorkspace,
  workspaceLoading,
  selectedWorkspace,
  setSelectedWorkspace,
  workspaceList,
  handleOpenWorkspace,
  activeWorkspace,
  workspaceError,
  workspaceMessage,
  openProfileSettingsPage,
  logout,
}) {
  return (
    <section className="card profile-shell">
      <div className="profile-main-stack">
        <section className="profile-subcard">
          <h2>Workspace Manager</h2>
          <p className="hint">
            Create a new workspace or open a past workspace.
          </p>
          <form className="stacked-form" onSubmit={handleCreateWorkspace}>
            <label htmlFor="workspace-name">New Workspace Name</label>
            <input
              id="workspace-name"
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              placeholder="Enter workspace name"
              required
            />
            <button type="submit" disabled={workspaceLoading}>
              {workspaceLoading ? 'Processing...' : 'Create Workspace'}
            </button>
          </form>

          <div className="open-workspace-box">
            <label htmlFor="existing-workspace">Open Existing Workspace</label>
            <div className="inline-controls">
              <select
                id="existing-workspace"
                value={selectedWorkspace}
                onChange={(event) => setSelectedWorkspace(event.target.value)}
                disabled={workspaceList.length === 0}
              >
                {workspaceList.length === 0 && <option value="">No workspaces yet</option>}
                {workspaceList.map((workspace) => (
                  <option key={workspace.id} value={workspace.name}>
                    {workspace.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="ghost"
                onClick={handleOpenWorkspace}
                disabled={workspaceLoading || !selectedWorkspace}
              >
                Open Workspace
              </button>
            </div>
          </div>

          {activeWorkspace && (
            <p className="hint">
              Active workspace: <strong>{activeWorkspace.name}</strong>
            </p>
          )}
          {workspaceError && <p className="error-message">{workspaceError}</p>}
          {workspaceMessage && <p className="success-message">{workspaceMessage}</p>}
        </section>
      </div>

      <aside className="right-menu-bar">
        <div className="settings-toolbar">
          <p className="settings-toolbar-title">Profile Tools</p>
          <details className="settings-dropdown">
            <summary>Settings</summary>
            <button
              type="button"
              className="ghost"
              onClick={() => openProfileSettingsPage('login-history')}
            >
              Login History
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => openProfileSettingsPage('change-password')}
            >
              Change Password
            </button>
          </details>
          <button type="button" className="ghost" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>
    </section>
  )
}

export default ProfilePage
