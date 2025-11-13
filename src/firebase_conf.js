// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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
export const db = getFirestore(firebaseApp)
