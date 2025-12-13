import { computed } from 'vue'
import { doc } from 'firebase/firestore'
import { useDocument } from 'vuefire'
import { db } from '@/firebase_conf'

export function useGoals(uidRef, typeRef) {
  const goalsQuery = computed(() => {
    if (!uidRef.value || !typeRef.value) return null

    return doc(db, 'users', uidRef.value, 'goals', typeRef.value)
  })

  const goals = useDocument(goalsQuery)

  return { goals }
}
