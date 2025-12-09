import { computed } from 'vue'
import { collection, query, where } from 'firebase/firestore'
import { useCollection } from 'vuefire'
import { db } from '@/firebase_conf'

export function useHikes(uid, year, month) {
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 1)

  const hikesQuery = computed(() => {
    if (!uid) return null

    return query(
      collection(db, 'users', uid, 'hikes'),
      where('createdAt', '>=', start),
      where('createdAt', '<', end),
    )
  })

  const hikes = useCollection(hikesQuery)

  return { hikes }
}
