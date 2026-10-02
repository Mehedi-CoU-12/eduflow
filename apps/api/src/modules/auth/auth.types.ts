export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly avatarUrl: string | null;
  readonly locale: string | null;
  readonly status: 'active' | 'disabled';
  readonly emailVerifiedAt: Date | null;
}

/** A validated session, attached to the request by AccessGuard. */
export interface AuthContext {
  readonly sessionId: string;
  readonly userId: string;
  readonly user: AuthUser;
  /** The hostname the session was created on (and is restricted to). */
  readonly host: string;
  /** School selected on the account host; null elsewhere or before selection. */
  readonly activeSchoolId: string | null;
  readonly expiresAt: Date;
}

export const AUTH_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  locale: true,
  status: true,
  emailVerifiedAt: true,
} as const;
