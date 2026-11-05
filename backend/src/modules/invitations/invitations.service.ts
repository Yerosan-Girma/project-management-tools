import crypto from 'crypto';
import { InvitationsRepository } from './invitations.repository';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/app-error';
import { InvitationStatus } from '@prisma/client';
import { sendEmail } from '../../config/email';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { InviteMemberInput } from './invitations.schema';

export class InvitationsService {
  constructor(private readonly invitationsRepo: InvitationsRepository = new InvitationsRepository()) {}

  async inviteMember(
    workspaceId: string,
    inviterId: string,
    input: InviteMemberInput
  ) {
    // 1. Verify workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId, deletedAt: null }
    });
    if (!workspace) {
      throw AppError.notFound('Workspace not found.');
    }

    // 2. Check if user with this email is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() }
    });

    if (existingUser) {
      const existingMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId, userId: existingUser.id }
        }
      });
      if (existingMember) {
        throw AppError.conflict('User is already a member of this workspace.');
      }
    }

    // 3. Check for existing active pending invitation
    const pendingInvitation = await this.invitationsRepo.findPendingInvitation(workspaceId, input.email);
    if (pendingInvitation) {
      throw AppError.conflict('An active invitation has already been sent to this email.');
    }

    // 4. Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await this.invitationsRepo.createInvitation({
      workspaceId,
      inviterId,
      email: input.email,
      role: input.role as any,
      token,
      expiresAt
    });

    // 5. Send invitation email
    const inviteUrl = `${env.FRONTEND_URL}/invitations/accept?token=${token}`;
    sendEmail({
      to: input.email,
      subject: `You've been invited to join ${workspace.name} on TeamFlow`,
      html: `
        <h2>Join Workspace: ${workspace.name}</h2>
        <p>You have been invited to join <strong>${workspace.name}</strong> as a <strong>${input.role}</strong>.</p>
        <p><a href="${inviteUrl}">Click here to accept your invitation</a></p>
        <p>This invitation link expires in 7 days.</p>
      `
    }).catch((err) => logger.warn(`Invitation email send failed: ${err.message}`));

    return invitation;
  }

  async listWorkspaceInvitations(workspaceId: string) {
    return this.invitationsRepo.listWorkspaceInvitations(workspaceId);
  }

  async getInvitationByToken(token: string) {
    const invitation = await this.invitationsRepo.findByToken(token);
    if (!invitation) {
      throw AppError.notFound('Invitation not found.');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw AppError.badRequest(`Invitation has already been ${invitation.status.toLowerCase()}.`);
    }

    if (new Date() > invitation.expiresAt) {
      throw AppError.badRequest('This invitation has expired.');
    }

    return invitation;
  }

  async acceptInvitation(token: string, userId: string, userEmail: string) {
    const invitation = await this.getInvitationByToken(token);

    // Optional: email mismatch warning/check
    if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
      logger.warn(`User ${userEmail} accepting invitation intended for ${invitation.email}`);
    }

    return this.invitationsRepo.acceptInvitation(
      invitation.id,
      invitation.workspaceId,
      userId,
      invitation.role
    );
  }

  async rejectInvitation(token: string) {
    const invitation = await this.getInvitationByToken(token);
    await this.invitationsRepo.rejectInvitation(invitation.id);
    return true;
  }

  async cancelInvitation(invitationId: string, workspaceId: string) {
    await this.invitationsRepo.cancelInvitation(invitationId);
    return true;
  }
}
