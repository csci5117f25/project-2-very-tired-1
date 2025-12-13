import { computed } from 'vue'
import { doc } from 'firebase/firestore'
import { useDocument } from 'vuefire'
import { db } from '@/firebase_conf'

export function useUserData(uid) {
  const userDocRef = computed(() => {
    if (!uid.value) {
      return null
    }
    return doc(db, 'users', uid.value)
  })

  const userData = useDocument(userDocRef)

  return { userData }
}
