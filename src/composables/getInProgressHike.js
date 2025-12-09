import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/firebase_conf'

export async function getInProgressHike(uid) {
  const inProgressHike = query(
    collection(db, 'users', uid, 'hikes'),
    where('status', '==', 'in_progress'),
  )
  const querySnapshot = await getDocs(inProgressHike)

  if (!querySnapshot.empty) {
    const hikeDoc = querySnapshot.docs[0]
    return {
      id: hikeDoc.id,
      ...hikeDoc.data(),
    }
  }

  return null
}
