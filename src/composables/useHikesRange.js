import { computed } from 'vue'
import { collection, query, where } from 'firebase/firestore'
import { useCollection } from 'vuefire'
import { db } from '@/firebase_conf'

export function useHikesRange(uid, range) {
  const hikesQuery = computed(() => {
    if (!uid.value) {
      return null
    }

    return query(
      collection(db, 'users', uid.value, 'hikes'),
      where('createdAt', '>=', range.value.start),
      where('createdAt', '<', range.value.end),
    )
  })

  const hikes = useCollection(hikesQuery)

  return { hikes }
}
