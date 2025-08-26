import { Roles } from '@/types/globals'

// Client-side role checking utilities for use with useUser() hook
export const checkClientBetaAccess = (userRole?: string) => {
  return userRole === 'admin' || userRole === 'moderator' || userRole === 'beta_user' || userRole === 'host_beta' || userRole === 'preview' || userRole === 'admin_dev'
}

export const checkClientHostAccess = (userRole?: string) => {
  return userRole === 'admin' || userRole === 'moderator' || userRole === 'host_beta' || userRole === 'preview' || userRole === 'admin_dev'
}

export const checkClientRole = (userRole?: string, role: Roles) => {
  // Special case: checking for 'admin' should also allow 'admin_dev'
  if (role === 'admin') {
    return userRole?.includes('admin') || false
  }
  
  // For all other roles, use strict equality
  return userRole === role
}

export const checkClientAdminAccess = (userRole?: string) => {
  return userRole?.includes('admin') || false
}