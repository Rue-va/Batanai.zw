import type { User } from '@prisma/client';

// Never send passwordHash to the client — this is the single choke point
// every route must go through before returning a user object.
export function toPublicUser(user: User) {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}
