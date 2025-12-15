// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
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

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, provider)
  const user = result.user

  const goalRef = doc(db, 'users', user.uid, 'goals', 'weekly')
  const goalSnap = await getDoc(goalRef)

  const userRef = doc(db, 'users', user.uid)

  /*
   * According to the American Heart Association, the recommended amount of moderate-intensity aerobic activity for adults is 150 minutes per week.
   * Example of moderate-intensity aerobic activity: brisk walking(at least 2.5miles per hour)
   * THAT is 10,058 meters per week | 43,744 meters per month | 524,640 meters per year
   * Source: https://www.heart.org/en/healthy-living/fitness/fitness-basics/aha-recs-for-physical-activity-in-adults
   */

  if (!goalSnap.exists()) {
    await setDoc(userRef, {
      totalDistance: 0,
      totalElevation: 0,
      totalHikes: 0,
      totalPhotos: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await setDoc(doc(db, 'users', user.uid, 'goals', 'weekly'), {
      type: 'weekly',
      hikesTarget: 3,
      distanceKmTarget: 10,
      photosTarget: 7,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    await setDoc(doc(db, 'users', user.uid, 'goals', 'monthly'), {
      type: 'monthly',
      hikesTarget: 12,
      distanceKmTarget: 45,
      photosTarget: 30,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    await setDoc(doc(db, 'users', user.uid, 'goals', 'annualy'), {
      type: 'annualy',
      hikesTarget: 144,
      distanceKmTarget: 525,
      photosTarget: 365,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  return result
}

export const signOutFromGoogle = () => signOut(auth)
