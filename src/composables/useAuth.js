import { useCurrentUser } from 'vuefire'
import { signInWithGoogle } from '@/firebase_conf'

export function useAuth() {
  const user = useCurrentUser()

  async function signIn() {
    await signInWithGoogle()
  }

  return { user, signIn }
}