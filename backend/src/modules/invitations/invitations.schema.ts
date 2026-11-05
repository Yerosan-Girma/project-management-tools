import { z } from 'zod';
import { WorkspaceRole } from '../../constants/roles';

export const inviteMemberSchema = z.object({
  email: z.string().email('Valid email is required').toLowerCase().trim(),
  role: z.enum([WorkspaceRole.ADMIN, WorkspaceRole.MEMBER, WorkspaceRole.GUEST]).default(WorkspaceRole.MEMBER)
});

export const respondInvitationSchema = z.object({
  token: z.string().min(1, 'Invitation token is required')
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type RespondInvitationInput = z.infer<typeof respondInvitationSchema>;
