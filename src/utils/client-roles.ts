import { Roles } from '@/types/globals'

// Client-side role checking utilities for use with useUser() hook
export const checkClientBetaAccess = (userRole?: string) => {
  return userRole === 'admin' || userRole === 'moderator' || userRole === 'beta_user' || userRole === 'host_beta' || userRole === 'preview'
}

export const checkClientHostAccess = (userRole?: string) => {
  return userRole === 'admin' || userRole === 'moderator' || userRole === 'host_beta' || userRole === 'preview'
}

export const checkClientRole = (userRole?: string, role: Roles) => {
  return userRole === role
}