import { z } from 'zod';

import { localeSchema } from '../i18n/locales.js';

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;

/** Emails are compared and stored lowercased (the database enforces this too). */
export const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email());

export const newPasswordSchema = z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH);

export const personNameSchema = z.string().trim().min(1).max(120);

/** Opaque single-use tokens delivered by email (base64url). */
export const authTokenSchema = z
  .string()
  .min(32)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/);

export const signupSchema = z.object({
  name: personNameSchema,
  email: emailSchema,
  password: newPasswordSchema,
  locale: localeSchema.optional(),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const verifyEmailSchema = z.object({ token: authTokenSchema });
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const resendVerificationSchema = z.object({ email: emailSchema });
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: authTokenSchema,
  password: newPasswordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** Selects the active school for a session on the root (account) host. */
export const switchSchoolSchema = z.object({ schoolId: z.uuid() });
export type SwitchSchoolInput = z.infer<typeof switchSchoolSchema>;
