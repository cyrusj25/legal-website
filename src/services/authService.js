import { Amplify } from 'aws-amplify'
import {
  signIn,
  signUp,
  confirmSignUp,
  resendSignUpCode,
  signOut,
  fetchAuthSession,
  getCurrentUser,
  fetchUserAttributes,
  updatePassword,
} from 'aws-amplify/auth'
import { COGNITO_CONFIG } from '../config/authConfig'

export function configureAuth() {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: COGNITO_CONFIG.userPoolId,
        userPoolClientId: COGNITO_CONFIG.userPoolClientId,
      },
    },
  })
}

export async function signInWithCognito(username, password) {
  return signIn({ username, password })
}

export async function signUpWithCognito({ username, password, email, companyCode }) {
  return signUp({
    username,
    password,
    options: {
      userAttributes: {
        email,
        'custom:company_code': companyCode,
      },
    },
  })
}

export async function confirmSignUpWithCognito(username, confirmationCode) {
  return confirmSignUp({ username, confirmationCode })
}

export async function resendSignUpConfirmationCode(username) {
  return resendSignUpCode({ username })
}

export async function signOutFromCognito() {
  return signOut()
}

// Returns the current Cognito ID token so apiService can attach it as a
// Bearer token on every backend call. Resolves to an empty string when
// there is no authenticated session.
export async function getIdToken() {
  try {
    const session = await fetchAuthSession()
    return session.tokens?.idToken?.toString() || ''
  } catch {
    return ''
  }
}

export async function getAuthenticatedUserContext() {
  const user = await getCurrentUser()
  const attributes = await fetchUserAttributes()

  return {
    userId: user.username,
    email: attributes.email || '',
    companyCode: attributes['custom:company_code'] || '',
  }
}

// A SPA never does a full page reload, so on every mount (initial load or a
// browser refresh) we must check whether Amplify still holds a valid Cognito
// session (tokens persisted in local storage) instead of forcing the user
// back to the login page. Resolves to null when there is no active session.
export async function restoreAuthSession() {
  try {
    return await getAuthenticatedUserContext()
  } catch {
    return null
  }
}

export async function changeCognitoPassword(currentPassword, newPassword) {
  return updatePassword({ oldPassword: currentPassword, newPassword })
}
