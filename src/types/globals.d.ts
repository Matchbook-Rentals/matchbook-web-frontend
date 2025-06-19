export { }

// Create a type for the roles
export type Roles = 'admin' | 'moderator' | 'beta_user' | 'host_beta' | 'preview'

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles
    }
  }
}
