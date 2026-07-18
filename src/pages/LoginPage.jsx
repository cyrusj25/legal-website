function LoginPage({
  userId,
  password,
  setUserId,
  setPassword,
  handleSignIn,
  authError,
  authLoading,
}) {
  return (
    <section className="card">
      <h2>Sign In</h2>
      <form onSubmit={handleSignIn} className="stacked-form">
        <label htmlFor="user-id">Email ID</label>
        <input
          id="user-id"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          autoComplete="email"
          inputMode="email"
          placeholder="name@example.com"
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

        <button type="submit" disabled={authLoading}>
          {authLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      {authError && <p className="error-message">{authError}</p>}
    </section>
  )
}

export default LoginPage
