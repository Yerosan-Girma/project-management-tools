import crypto from 'crypto';
import { InvitationsRepository } from './invitations.repository';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/app-error';
import { InvitationStatus } from '@prisma/client';
import { WorkspaceRole, PlatformRole } from '../../constants/roles';
import { sendEmail } from '../../config/email';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { InviteMemberInput } from './invitations.schema';
import { authorizationService } from '../authorization/authorization.service';

export class InvitationsService {
  constructor(private readonly invitationsRepo: InvitationsRepository = new InvitationsRepository()) {}

  async inviteMember(
    workspaceId: string,
    inviterId: string,
    input: InviteMemberInput
  ) {
    // 1. Verify workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId, deletedAt: null },
    });
    if (!workspace) {
      throw AppError.notFound('Workspace not found.');
    }

    // 2. Check inviter's role & permissions guardrail
    const inviterMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: inviterId },
      },
    });
    const inviterUser = await prisma.user.findUnique({ where: { id: inviterId } });
    const isPlatformAdmin = inviterUser?.platformRole === PlatformRole.PLATFORM_ADMIN;

    authorizationService.canInviteWithRole({
      operatorRole: (inviterMember?.role as WorkspaceRole) || WorkspaceRole.GUEST,
      invitedRole: input.role as WorkspaceRole,
      isPlatformAdmin,
    });

    // 3. Check if user with this email is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      const existingMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId, userId: existingUser.id },
        },
      });
      if (existingMember) {
        throw AppError.conflict('User is already a member of this workspace.');
      }
    }

    // 4. Check for existing active pending invitation
    const pendingInvitation = await this.invitationsRepo.findPendingInvitation(workspaceId, input.email);
    if (pendingInvitation) {
      throw AppError.conflict('An active invitation has already been sent to this email.');
    }

    // 5. Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await this.invitationsRepo.createInvitation({
      workspaceId,
      inviterId,
      email: input.email,
      role: input.role as any,
      token,
      expiresAt,
    });

    // 6. Record Audit Log
    await authorizationService.recordAuditLog({
      actorId: inviterId,
      workspaceId,
      resourceType: 'workspace_invitation',
      resourceId: invitation.id,
      action: 'INVITATION_SENT',
      metadata: {
        inviteeEmail: input.email,
        assignedRole: input.role,
      },
    });

    // 7. Send invitation email
    const inviteUrl = `${env.FRONTEND_URL}/invitations/${token}`;
    sendEmail({
      to: input.email,
      subject: `You've been invited to join ${workspace.name} as ${input.role} on TeamFlow`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 700;">TeamFlow</h1>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Collaborative Workspace Platform</p>
          </div>
          <div style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
            <h2 style="color: #1e293b; font-size: 18px; margin-bottom: 12px;">You've Been Invited!</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.5; margin-bottom: 16px;">
              You have been invited to join <strong>${workspace.name}</strong> with the role of 
              <span style="background-color: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 13px;">${input.role}</span>.
            </p>
            <p style="color: #475569; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
              As an invited member, you'll be able to collaborate on projects, track tasks, and participate in team boards.
            </p>
            <div style="text-align: center; margin-bottom: 28px;">
              <a href="${inviteUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
                Accept Invitation & Join
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 12px; line-height: 1.4; border-top: 1px solid #f1f5f9; padding-top: 16px;">
              Or paste this link into your browser:<br/>
              <a href="${inviteUrl}" style="color: #6366f1; word-break: break-all;">${inviteUrl}</a>
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 8px;">
              This invitation link expires in 7 days. If you did not expect this email, you can safely ignore it.
            </p>
          </div>
        </div>
      `,
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

    // Strict email match requirement to prevent invitation interception
    if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw AppError.forbidden(`This invitation was sent to ${invitation.email}, but you are currently signed in as ${userEmail}.`);
    }

    // If user is already a member, accept invitation and sync/promote role
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId: invitation.workspaceId, userId },
      },
    });
    if (existingMember) {
      const membership = await this.invitationsRepo.acceptInvitation(
        invitation.id,
        invitation.workspaceId,
        userId,
        invitation.role
      );
      return membership;
    }

    const membership = await this.invitationsRepo.acceptInvitation(
      invitation.id,
      invitation.workspaceId,
      userId,
      invitation.role
    );

    // Record Audit Log
    await authorizationService.recordAuditLog({
      actorId: userId,
      workspaceId: invitation.workspaceId,
      resourceType: 'workspace_invitation',
      resourceId: invitation.id,
      action: 'INVITATION_ACCEPTED',
      metadata: {
        userEmail,
        role: invitation.role,
      },
    });

    return membership;
  }

  async rejectInvitation(token: string) {
    const invitation = await this.getInvitationByToken(token);
    await this.invitationsRepo.rejectInvitation(invitation.id);
    return true;
  }

  async cancelInvitation(invitationId: string, workspaceId: string, operatorUserId?: string) {
    await this.invitationsRepo.cancelInvitation(invitationId);

    if (operatorUserId) {
      await authorizationService.recordAuditLog({
        actorId: operatorUserId,
        workspaceId,
        resourceType: 'workspace_invitation',
        resourceId: invitationId,
        action: 'INVITATION_CANCELLED',
      });
    }

    return true;
  }
}
