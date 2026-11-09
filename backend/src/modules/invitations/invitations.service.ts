import crypto from 'crypto';
import { InvitationsRepository } from './invitations.repository';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/app-error';
import { InvitationStatus } from '@prisma/client';
import { WorkspaceRole, PlatformRole, ProjectRole } from '../../constants/roles';
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

    // 4. Check for existing active pending invitation - if found, refresh token and resend email
    const pendingInvitation = await this.invitationsRepo.findPendingInvitation(workspaceId, input.email);
    if (pendingInvitation) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const updatedInvitation = await this.invitationsRepo.updateInvitation(pendingInvitation.id, {
        inviterId,
        role: input.role as any,
        token,
        expiresAt,
        status: InvitationStatus.PENDING,
      });

      await authorizationService.recordAuditLog({
        actorId: inviterId,
        workspaceId,
        resourceType: 'workspace_invitation',
        resourceId: updatedInvitation.id,
        action: 'INVITATION_RESENT',
        metadata: {
          inviteeEmail: input.email,
          assignedRole: input.role,
        },
      });

      await this.dispatchInvitationEmail(workspace.name, input.email, input.role, token);
      logger.info(`📧 Pending invitation refreshed and re-sent to ${input.email} for workspace ${workspace.name}`);
      return updatedInvitation;
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
    await this.dispatchInvitationEmail(workspace.name, input.email, input.role, token);

    return invitation;
  }

  private async dispatchInvitationEmail(workspaceName: string, email: string, role: string, token: string) {
    const inviteUrl = `${env.FRONTEND_URL}/invitations/${token}`;
    const textContent = `You have been invited to join ${workspaceName} as ${role} on TeamFlow.\n\nClick the link below to accept your invitation and join the team:\n${inviteUrl}\n\nThis invitation link expires in 7 days. If you did not expect this email, you can safely ignore it.`;

    return sendEmail({
      to: email,
      subject: `You've been invited to join ${workspaceName} as ${role} on TeamFlow`,
      text: textContent,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 700;">TeamFlow</h1>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Collaborative Workspace Platform</p>
          </div>
          <div style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
            <h2 style="color: #1e293b; font-size: 18px; margin-bottom: 12px;">You've Been Invited!</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.5; margin-bottom: 16px;">
              You have been invited to join <strong>${workspaceName}</strong> with the role of 
              <span style="background-color: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 13px;">${role}</span>.
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
  }

  private async dispatchProjectInvitationEmail(
    workspaceName: string,
    projectName: string,
    email: string,
    projectRole: string,
    token: string
  ) {
    const inviteUrl = `${env.FRONTEND_URL}/invitations/${token}`;
    const textContent = `You have been invited to collaborate on the project "${projectName}" inside the "${workspaceName}" workspace as a ${projectRole} on TeamFlow.\n\nClick the link below to accept your project invitation and join the board:\n${inviteUrl}\n\nThis invitation link expires in 7 days. If you did not expect this email, you can safely ignore it.`;

    return sendEmail({
      to: email,
      subject: `You've been invited to project "${projectName}" on TeamFlow`,
      text: textContent,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 700;">TeamFlow</h1>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Project Deliverables & Kanban</p>
          </div>
          <div style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
            <h2 style="color: #1e293b; font-size: 18px; margin-bottom: 12px;">You've Been Invited to a Project!</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.5; margin-bottom: 16px;">
              You have been invited to join the project <strong>${projectName}</strong> inside the <strong>${workspaceName}</strong> workspace with the role of 
              <span style="background-color: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 13px;">${projectRole}</span>.
            </p>
            <p style="color: #475569; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
              As a project collaborator, you can manage tasks, organize cards on the Kanban board, and collaborate directly with your team.
            </p>
            <div style="text-align: center; margin-bottom: 28px;">
              <a href="${inviteUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
                Accept Project Invitation & Join
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
    }).catch((err) => logger.warn(`Project invitation email send failed: ${err.message}`));
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

    // Accept invitation and grant membership to the authenticated user holding the valid token
    const membership = await this.invitationsRepo.acceptInvitation(
      invitation.id,
      invitation.workspaceId,
      userId,
      invitation.role
    );

    // Record Audit Log with complete attribution
    await authorizationService.recordAuditLog({
      actorId: userId,
      workspaceId: invitation.workspaceId,
      resourceType: 'workspace_invitation',
      resourceId: invitation.id,
      action: 'INVITATION_ACCEPTED',
      metadata: {
        invitedEmail: invitation.email,
        acceptedByEmail: userEmail,
        role: invitation.role,
        emailMatched: invitation.email.toLowerCase() === userEmail.toLowerCase(),
      },
    });

    logger.info(
      `🎉 User ${userEmail} accepted invitation (sent to ${invitation.email}) for workspace ${invitation.workspaceId} as ${invitation.role}`
    );

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

  async resendInvitation(workspaceId: string, invitationId: string, operatorUserId: string) {
    const invitation = await this.invitationsRepo.findById(invitationId);
    if (!invitation || invitation.workspaceId !== workspaceId) {
      throw AppError.notFound('Invitation not found.');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw AppError.badRequest(`Cannot resend an invitation that is ${invitation.status.toLowerCase()}.`);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const updatedInvitation = await this.invitationsRepo.updateInvitation(invitationId, {
      inviterId: operatorUserId,
      token,
      expiresAt,
      status: InvitationStatus.PENDING,
    });

    await authorizationService.recordAuditLog({
      actorId: operatorUserId,
      workspaceId,
      resourceType: 'workspace_invitation',
      resourceId: invitationId,
      action: 'INVITATION_RESENT',
      metadata: {
        inviteeEmail: invitation.email,
        assignedRole: invitation.role,
      },
    });

    await this.dispatchInvitationEmail(invitation.workspace.name, invitation.email, invitation.role, token);
    logger.info(`📧 Invitation manually resent to ${invitation.email} for workspace ${invitation.workspace.name}`);
    return updatedInvitation;
  }

  async inviteProjectMember(
    projectId: string,
    inviterId: string,
    input: { email: string; role: ProjectRole }
  ) {
    const project = await prisma.project.findUnique({
      where: { id: projectId, deletedAt: null },
      include: {
        workspace: { select: { id: true, name: true, deletedAt: true } },
      },
    });
    if (!project || project.workspace.deletedAt) {
      throw AppError.notFound('Project not found.');
    }

    const workspaceId = project.workspaceId;

    // Check permissions
    const inviterUser = await prisma.user.findUnique({ where: { id: inviterId } });
    const isPlatformAdmin = inviterUser?.platformRole === PlatformRole.PLATFORM_ADMIN;

    const { allowed } = await authorizationService.hasProjectPermission(
      inviterId,
      projectId,
      'project:members:manage',
      isPlatformAdmin
    );
    if (!allowed) {
      throw AppError.forbidden('You do not have permission to invite members to this project.');
    }

    // Check if user is already a project member
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (existingUser) {
      const existingProjectMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId, userId: existingUser.id },
        },
      });
      if (existingProjectMember) {
        throw AppError.conflict('User is already a member of this project.');
      }
    }

    // Check for existing pending invitation for this project
    const pendingInvitation = await this.invitationsRepo.findPendingProjectInvitation(projectId, input.email);
    if (pendingInvitation) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const updatedInvitation = await this.invitationsRepo.updateInvitation(pendingInvitation.id, {
        inviterId,
        projectRole: input.role,
        token,
        expiresAt,
        status: InvitationStatus.PENDING,
      });

      await authorizationService.recordAuditLog({
        actorId: inviterId,
        workspaceId,
        projectId,
        resourceType: 'project_invitation',
        resourceId: updatedInvitation.id,
        action: 'PROJECT_INVITATION_RESENT',
        metadata: {
          inviteeEmail: input.email,
          projectRole: input.role,
          projectName: project.name,
        },
      });

      await this.dispatchProjectInvitationEmail(
        project.workspace.name,
        project.name,
        input.email,
        input.role,
        token
      );

      logger.info(`📧 Project invitation refreshed and re-sent to ${input.email} for project ${project.name}`);
      return updatedInvitation;
    }

    // Create new project invitation
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await this.invitationsRepo.createInvitation({
      workspaceId,
      projectId,
      inviterId,
      email: input.email,
      role: WorkspaceRole.GUEST,
      projectRole: input.role,
      token,
      expiresAt,
    });

    await authorizationService.recordAuditLog({
      actorId: inviterId,
      workspaceId,
      projectId,
      resourceType: 'project_invitation',
      resourceId: invitation.id,
      action: 'PROJECT_INVITATION_SENT',
      metadata: {
        inviteeEmail: input.email,
        projectRole: input.role,
        projectName: project.name,
      },
    });

    await this.dispatchProjectInvitationEmail(
      project.workspace.name,
      project.name,
      input.email,
      input.role,
      token
    );

    return invitation;
  }

  async listProjectInvitations(projectId: string) {
    return this.invitationsRepo.listProjectInvitations(projectId);
  }

  async resendProjectInvitation(projectId: string, invitationId: string, operatorUserId: string) {
    const invitation = await this.invitationsRepo.findById(invitationId);
    if (!invitation || invitation.projectId !== projectId) {
      throw AppError.notFound('Project invitation not found.');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw AppError.badRequest(`Cannot resend an invitation that is ${invitation.status.toLowerCase()}.`);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const updatedInvitation = await this.invitationsRepo.updateInvitation(invitationId, {
      inviterId: operatorUserId,
      token,
      expiresAt,
      status: InvitationStatus.PENDING,
    });

    await authorizationService.recordAuditLog({
      actorId: operatorUserId,
      workspaceId: invitation.workspaceId,
      projectId,
      resourceType: 'project_invitation',
      resourceId: invitationId,
      action: 'PROJECT_INVITATION_RESENT',
      metadata: {
        inviteeEmail: invitation.email,
        projectRole: invitation.projectRole,
        projectName: invitation.project?.name,
      },
    });

    await this.dispatchProjectInvitationEmail(
      invitation.workspace.name,
      invitation.project?.name || 'Project',
      invitation.email,
      invitation.projectRole || 'MEMBER',
      token
    );

    logger.info(`📧 Project invitation manually resent to ${invitation.email} for project ${invitation.project?.name}`);
    return updatedInvitation;
  }

  async cancelProjectInvitation(projectId: string, invitationId: string, operatorUserId: string) {
    const invitation = await this.invitationsRepo.findById(invitationId);
    if (!invitation || invitation.projectId !== projectId) {
      throw AppError.notFound('Project invitation not found.');
    }

    await this.invitationsRepo.cancelInvitation(invitationId);

    await authorizationService.recordAuditLog({
      actorId: operatorUserId,
      workspaceId: invitation.workspaceId,
      projectId,
      resourceType: 'project_invitation',
      resourceId: invitationId,
      action: 'PROJECT_INVITATION_CANCELLED',
      metadata: {
        inviteeEmail: invitation.email,
      },
    });

    return true;
  }
}
