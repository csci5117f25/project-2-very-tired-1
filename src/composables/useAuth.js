import { useCurrentUser } from 'vuefire'
import { signInWithGoogle, signOutFromGoogle } from '@/firebase_conf'

export function useAuth() {
  const user = useCurrentUser()

  async function signIn() {
    await signInWithGoogle()
  }

  async function signOut() {
    await signOutFromGoogle()
  }

  return { user, signIn, signOut }
}
