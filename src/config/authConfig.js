function splitCsvEnv(value, fallback = []) {
  if (!value) {
    return fallback
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export const COGNITO_CONFIG = {
  region: import.meta.env.VITE_COGNITO_REGION || 'us-east-1',
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'us-east-1_W6xlXDUQi',
  userPoolClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID || '5pbe34ckjtre6arssgj2hvpp70',
  oauth: {
    domain: import.meta.env.VITE_COGNITO_DOMAIN || '',
    redirectSignIn: splitCsvEnv(import.meta.env.VITE_COGNITO_REDIRECT_SIGN_IN),
    redirectSignOut: splitCsvEnv(import.meta.env.VITE_COGNITO_REDIRECT_SIGN_OUT),
    scopes: splitCsvEnv(import.meta.env.VITE_COGNITO_SCOPES, ['openid', 'email', 'profile']),
    responseType: import.meta.env.VITE_COGNITO_RESPONSE_TYPE || 'code',
  },
}
