function SignupPage({
  signupStep,
  signupUserId,
  setSignupUserId,
  signupEmail,
  setSignupEmail,
  signupPassword,
  setSignupPassword,
  signupConfirmPassword,
  setSignupConfirmPassword,
  signupConfirmationCode,
  setSignupConfirmationCode,
  handleRequestSignup,
  handleConfirmSignup,
  signupRequestMessage,
  signupError,
  signupLoading,
}) {
  if (signupStep === 'confirm') {
    return (
      <section className="card">
        <h2>Confirm Your Account</h2>
        <p>Enter the verification code sent to your email to activate your account.</p>
        <form onSubmit={handleConfirmSignup} className="stacked-form">
          <label htmlFor="signup-confirmation-code">Verification Code</label>
          <input
            id="signup-confirmation-code"
            value={signupConfirmationCode}
            onChange={(event) => setSignupConfirmationCode(event.target.value)}
            required
          />

          <button type="submit" disabled={signupLoading}>
            {signupLoading ? 'Confirming...' : 'Confirm Account'}
          </button>
        </form>
        {signupError && <p className="error-message">{signupError}</p>}
        {signupRequestMessage && <p className="success-message">{signupRequestMessage}</p>}
      </section>
    )
  }

  return (
    <section className="card">
      <h2>Request Signup</h2>
      <p>
        Create your account credentials. An administrator will review and approve access
        after email verification.
      </p>
      <form onSubmit={handleRequestSignup} className="stacked-form">
        <label htmlFor="signup-user-id">User ID</label>
        <input
          id="signup-user-id"
          value={signupUserId}
          onChange={(event) => setSignupUserId(event.target.value)}
          autoComplete="username"
          required
        />

        <label htmlFor="signup-email">Email</label>
        <input
          id="signup-email"
          type="email"
          value={signupEmail}
          onChange={(event) => setSignupEmail(event.target.value)}
          autoComplete="email"
          required
        />

        <label htmlFor="signup-password">Password</label>
        <input
          id="signup-password"
          type="password"
          value={signupPassword}
          onChange={(event) => setSignupPassword(event.target.value)}
          autoComplete="new-password"
          required
        />

        <label htmlFor="signup-confirm-password">Confirm Password</label>
        <input
          id="signup-confirm-password"
          type="password"
          value={signupConfirmPassword}
          onChange={(event) => setSignupConfirmPassword(event.target.value)}
          autoComplete="new-password"
          required
        />

        <button type="submit" disabled={signupLoading}>
          {signupLoading ? 'Submitting...' : 'Submit Signup Request'}
        </button>
      </form>
      {signupError && <p className="error-message">{signupError}</p>}
      {signupRequestMessage && <p className="success-message">{signupRequestMessage}</p>}
    </section>
  )
}

export default SignupPage
