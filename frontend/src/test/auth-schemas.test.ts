import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema } from '../features/auth/schemas/auth.schema';

describe('Auth Validation Schemas Test Suite', () => {
  describe('Login Schema', () => {
    it('validates valid credentials successfully', () => {
      const result = loginSchema.safeParse({
        email: 'engineer@teamflow.io',
        password: 'ValidPassword123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email formats', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'Password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid email');
      }
    });

    it('rejects empty passwords', () => {
      const result = loginSchema.safeParse({
        email: 'user@teamflow.io',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Register Schema', () => {
    it('accepts compliant registration payload', () => {
      const result = registerSchema.safeParse({
        name: 'Bob Martin',
        email: 'bob@teamflow.io',
        password: 'SecurePassword1',
        confirmPassword: 'SecurePassword1',
      });
      expect(result.success).toBe(true);
    });

    it('rejects password when confirmation does not match', () => {
      const result = registerSchema.safeParse({
        name: 'Bob Martin',
        email: 'bob@teamflow.io',
        password: 'SecurePassword1',
        confirmPassword: 'DifferentPassword1',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('do not match');
      }
    });

    it('rejects passwords under 8 characters', () => {
      const result = registerSchema.safeParse({
        name: 'Bob Martin',
        email: 'bob@teamflow.io',
        password: 'Short1',
        confirmPassword: 'Short1',
      });
      expect(result.success).toBe(false);
    });
  });
});
