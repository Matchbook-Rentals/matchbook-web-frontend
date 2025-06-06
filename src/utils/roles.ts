
import { Roles } from '@/types/globals'
import { auth } from '@clerk/nextjs/server'

export const checkRole = async (role: Roles) => {
  const { sessionClaims } = auth()
  return sessionClaims?.metadata.role === role
}

export const checkHostAccess = async () => {
  const { sessionClaims } = auth()
  const userRole = sessionClaims?.metadata.role
  return userRole === 'admin' || userRole === 'moderator' || userRole === 'host_beta'
}

export const checkBetaAccess = async () => {
  const { sessionClaims } = auth()
  const userRole = sessionClaims?.metadata.role
  return userRole === 'admin' || userRole === 'moderator' || userRole === 'beta_user' || userRole === 'host_beta'
}

// Client-side role checking utilities for use with useUser() hook
export const checkClientBetaAccess = (userRole?: string) => {
  return userRole === 'admin' || userRole === 'moderator' || userRole === 'beta_user' || userRole === 'host_beta'
}

export const checkClientHostAccess = (userRole?: string) => {
  return userRole === 'admin' || userRole === 'moderator' || userRole === 'host_beta'
}

export const checkClientRole = (userRole?: string, role: Roles) => {
  return userRole === role
}
