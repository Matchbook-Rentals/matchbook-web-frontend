
import { Roles } from '@/types/globals'
import { auth } from '@clerk/nextjs/server'

export const checkRole = async (role: Roles) => {
  const { sessionClaims } = auth()
  return sessionClaims?.metadata.role === role
}

export const checkHostAccess = async () => {
  const { sessionClaims } = auth()
  const userRole = sessionClaims?.metadata.role
  return userRole === 'admin' || userRole === 'moderator' || userRole === 'host_beta' || userRole === 'preview'
}

export const checkBetaAccess = async () => {
  const { sessionClaims } = auth()
  const userRole = sessionClaims?.metadata.role
  return userRole === 'admin' || userRole === 'moderator' || userRole === 'beta_user' || userRole === 'host_beta' || userRole === 'preview'
}
