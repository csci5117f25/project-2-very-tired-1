import { computed } from 'vue'
import { collection, query, where, doc } from 'firebase/firestore'
import { useDocument } from 'vuefire'
import { db } from '@/firebase_conf'
import { useHikes } from './useHikes'

export function useGoals(uidRef, typeRef) {
  const goalsQuery = computed(() => {
    const uid = uidRef.value
    const type = typeRef.value

    console.log('uid:', uid)
    console.log('type:', type)

    if (!uid || !type) return null

    console.log('Fetching path:', `users/${uid}/goals/${type}`)
    return doc(db, 'users', uid, 'goals', type)
  })

  const goals = useDocument(goalsQuery)

  return { goals }
}
