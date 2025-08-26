
import { Roles } from '@/types/globals'
import { auth } from '@clerk/nextjs/server'

export const checkRole = async (role: Roles) => {
  const { sessionClaims } = auth()
  const userRole = sessionClaims?.metadata.role
  
  // Special case: checking for 'admin' should also allow 'admin_dev'
  if (role === 'admin') {
    return userRole?.includes('admin') || false
  }
  
  // For all other roles, use strict equality
  return userRole === role
}

export const checkHostAccess = async () => {
  const { sessionClaims } = auth()
  const userRole = sessionClaims?.metadata.role
  return userRole === 'admin' || userRole === 'moderator' || userRole === 'host_beta' || userRole === 'preview' || userRole === 'admin_dev'
}

export const checkBetaAccess = async () => {
  const { sessionClaims } = auth()
  const userRole = sessionClaims?.metadata.role
  return userRole === 'admin' || userRole === 'moderator' || userRole === 'beta_user' || userRole === 'host_beta' || userRole === 'preview' || userRole === 'admin_dev'
}

export const checkAdminAccess = async () => {
  const { sessionClaims } = auth()
  const userRole = sessionClaims?.metadata.role
  return userRole?.includes('admin') || false
}
