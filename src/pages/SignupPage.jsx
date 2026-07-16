function SignupPage({ handleRequestSignup, signupRequestMessage }) {
  return (
    <section className="card">
      <h2>Request Signup</h2>
      <p>
        Signup approval is currently manual. Submit your request and an
        administrator will review onboarding details.
      </p>
      <button type="button" onClick={handleRequestSignup}>
        Submit Signup Request
      </button>
      {signupRequestMessage && <p className="success-message">{signupRequestMessage}</p>}
    </section>
  )
}

export default SignupPage
