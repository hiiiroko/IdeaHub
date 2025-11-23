import { supabase } from '../lib/supabase'
import type { UserProfile } from '../types/index.ts'

export const registerUser = async (email: string, password: string, username: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username }
    }
  })
  if (error) throw error
  return data
}

export const loginUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.user
}

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getCurrentUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data as UserProfile
}

export const resendEmailConfirmation = async (email: string) => {
  const { error } = await supabase.auth.resend({ type: 'signup', email })
  if (error) throw error
}