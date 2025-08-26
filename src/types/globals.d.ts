export { }

// Create a type for the roles
export type Roles = 'admin' | 'moderator' | 'beta_user' | 'host_beta' | 'preview' | 'admin_dev'

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles
    }
  }
}
