import { ref, computed } from 'vue'
import { collection, query, where } from 'firebase/firestore'
import { useCollection } from 'vuefire'
import { db } from '@/firebase_conf'

export function useHikes(uid, year, month) {
  if (!uid) return ref([])

  const start = new Date(year, month, 1)
  const next = new Date(year, month + 1, 1)

  const HikeQuery = query(
    collection(db, 'users', uid, 'hikes'),
    where('createdAt', '>=', start),
    where('createdAt', '<', next),
  )

  return useCollection(HikeQuery)
}
