function LoginPage({
  userId,
  password,
  companyCode,
  setUserId,
  setPassword,
  setCompanyCode,
  handleSignIn,
  authError,
  authLoading,
}) {
  return (
    <section className="card">
      <h2>Sign In</h2>
      <form onSubmit={handleSignIn} className="stacked-form">
        <label htmlFor="user-id">User ID</label>
        <input
          id="user-id"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          autoComplete="username"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />

        <label htmlFor="company-code">Company Code</label>
        <input
          id="company-code"
          value={companyCode}
          onChange={(event) => setCompanyCode(event.target.value.toUpperCase())}
          autoComplete="organization"
          required
        />

        <button type="submit" disabled={authLoading}>
          {authLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      {authError && <p className="error-message">{authError}</p>}
    </section>
  )
}

export default LoginPage
