// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyAXoi5ZNnntoz67WcOvGxDr38QaYNPcMoY',
  authDomain: 'very-tired-project-2.firebaseapp.com',
  projectId: 'very-tired-project-2',
  storageBucket: 'very-tired-project-2.firebasestorage.app',
  messagingSenderId: '972944730206',
  appId: '1:972944730206:web:9b41f555c621ec1e2daccf',
}

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig)

// Initialize Firestore with offline persistence enabled
// This stores data in IndexedDB and syncs when back online
export const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
})

export const auth = getAuth(firebaseApp)
export const storage = getStorage(firebaseApp)
const provider = new GoogleAuthProvider()
provider.setCustomParameters({ prompt: 'select_account' })

export const signInWithGoogle = () => signInWithPopup(auth, provider)
export const signOutFromGoogle = () => signOut(auth)
