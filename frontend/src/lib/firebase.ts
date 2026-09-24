import { getApp, getApps, initializeApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check'
import { getAuth } from 'firebase/auth'
import { env } from '../config/env'

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig)

const appCheckSiteKey = env.VITE_FIREBASE_APP_CHECK_RECAPTCHA_ENTERPRISE_SITE_KEY

// App Check tokens are attached automatically to callable Functions and Data
// Connect requests. DEV may omit the key while the Firebase console is being
// prepared; production validation rejects builds without it (see the release
// script) before enforcement is enabled server-side.
export const appCheck = appCheckSiteKey
  ? initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    })
  : null

export const auth = getAuth(firebaseApp)
