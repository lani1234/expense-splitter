import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
  ISignUpResult,
} from "amazon-cognito-identity-js"

const userPool = new CognitoUserPool({
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
})

export function signIn(email: string, password: string): Promise<CognitoUserSession> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool })
    const authDetails = new AuthenticationDetails({ Username: email, Password: password })
    user.authenticateUser(authDetails, {
      onSuccess: resolve,
      onFailure: (err) => reject(new Error(err.message)),
      newPasswordRequired: () => reject(new Error("A new password is required.")),
    })
  })
}

export function signUp(email: string, password: string): Promise<ISignUpResult> {
  return new Promise((resolve, reject) => {
    userPool.signUp(email, password, [], [], (err, result) => {
      if (err) return reject(new Error(err.message))
      resolve(result!)
    })
  })
}

export function confirmSignUp(email: string, code: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool })
    user.confirmRegistration(code, true, (err) => {
      if (err) return reject(new Error(err.message))
      resolve()
    })
  })
}

export function signOut() {
  userPool.getCurrentUser()?.signOut()
}

export function getSession(): Promise<CognitoUserSession | null> {
  return new Promise((resolve) => {
    const user = userPool.getCurrentUser()
    if (!user) return resolve(null)
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session?.isValid()) return resolve(null)
      resolve(session)
    })
  })
}

export async function getAccessToken(): Promise<string | null> {
  const session = await getSession()
  return session?.getAccessToken().getJwtToken() ?? null
}
