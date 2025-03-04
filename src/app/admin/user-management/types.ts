// Serialized user interface that can be safely passed to client components
export interface SerializedUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  emailAddress: string | null;
  role: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
}