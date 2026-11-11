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
import { NotificationJob } from '../../jobs/notification.job';
import { NotificationType } from '../../constants/status';

export class InvitationsService {
  constructor(private readonly invitationsRepo: InvitationsRepository = new InvitationsRepository()) {}

  async inviteMember(
    workspaceId: string,
    inviterId: string,
    input: InviteMemberInput
  ) {
    const cleanEmail = input.email.trim().toLowerCase();

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
      where: { email: cleanEmail },
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
    const pendingInvitation = await this.invitationsRepo.findPendingInvitation(workspaceId, cleanEmail);
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
          inviteeEmail: cleanEmail,
          assignedRole: input.role,
        },
      });

      const emailSent = await this.dispatchInvitationEmail(workspace.name, cleanEmail, input.role, token);
      logger.info(`📧 Pending invitation refreshed and re-sent to ${cleanEmail} for workspace ${workspace.name} (emailDelivered: ${emailSent})`);

      if (existingUser) {
        await NotificationJob.createAndDispatch({
          recipientId: existingUser.id,
          type: NotificationType.WORKSPACE_INVITATION,
          title: `Workspace Invitation: ${workspace.name}`,
          message: `You were invited to join workspace "${workspace.name}" as ${input.role}.`,
          resourceType: 'invitation',
          resourceId: token,
        });
      }

      return {
        ...updatedInvitation,
        emailSent,
      };
    }

    // 5. Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await this.invitationsRepo.createInvitation({
      workspaceId,
      inviterId,
      email: cleanEmail,
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
        inviteeEmail: cleanEmail,
        assignedRole: input.role,
      },
    });

    // 7. Send invitation email
    const emailSent = await this.dispatchInvitationEmail(workspace.name, cleanEmail, input.role, token);

    // 8. If invited user already has an account on TeamFlow, trigger in-app notification immediately
    if (existingUser) {
      await NotificationJob.createAndDispatch({
        recipientId: existingUser.id,
        type: NotificationType.WORKSPACE_INVITATION,
        title: `Workspace Invitation: ${workspace.name}`,
        message: `You have been invited to join workspace "${workspace.name}" as ${input.role}.`,
        resourceType: 'invitation',
        resourceId: token,
      });
    }

    return {
      ...invitation,
      emailSent,
    };
  }

  private async dispatchInvitationEmail(workspaceName: string, email: string, role: string, token: string): Promise<boolean> {
    const inviteUrl = `${env.FRONTEND_URL}/invitations/${token}`;
    const textContent = `You have been invited to join ${workspaceName} as ${role} on TeamFlow.\n\nClick the link below to accept your invitation and join the team:\n${inviteUrl}\n\nThis invitation link expires in 7 days. If you did not expect this email, you can safely ignore it.`;

    try {
      return await sendEmail({
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
      });
    } catch (err: any) {
      logger.warn(`Invitation email send failed: ${err.message}`);
      return false;
    }
  }

  private async dispatchProjectInvitationEmail(
    workspaceName: string,
    projectName: string,
    email: string,
    projectRole: string,
    token: string
  ): Promise<boolean> {
    const inviteUrl = `${env.FRONTEND_URL}/invitations/${token}`;
    const textContent = `You have been invited to collaborate on the project "${projectName}" inside the "${workspaceName}" workspace as a ${projectRole} on TeamFlow.\n\nClick the link below to accept your project invitation and join the board:\n${inviteUrl}\n\nThis invitation link expires in 7 days. If you did not expect this email, you can safely ignore it.`;

    try {
      return await sendEmail({
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
      });
    } catch (err: any) {
      logger.warn(`Project invitation email send failed: ${err.message}`);
      return false;
    }
  }

  private async dispatchProjectAddedEmail(
    workspaceName: string,
    projectName: string,
    email: string,
    projectRole: string,
    projectId: string
  ) {
    const projectUrl = `${env.FRONTEND_URL}/projects/${projectId}`;
    const textContent = `You have been added directly to project "${projectName}" inside the "${workspaceName}" workspace as a ${projectRole} on TeamFlow.\n\nOpen your project board now:\n${projectUrl}\n\nSince you are already a member of this workspace, your access has been granted immediately!`;

    return sendEmail({
      to: email,
      subject: `You've been added to project "${projectName}" on TeamFlow`,
      text: textContent,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 700;">TeamFlow</h1>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Project Deliverables & Kanban</p>
          </div>
          <div style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
            <h2 style="color: #1e293b; font-size: 18px; margin-bottom: 12px;">You've Been Added to a Project!</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.5; margin-bottom: 16px;">
              You have been added to the project <strong>${projectName}</strong> in workspace <strong>${workspaceName}</strong> as a 
              <span style="background-color: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 13px;">${projectRole}</span>.
            </p>
            <p style="color: #475569; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
              Because you are already a member of this workspace, your access has been granted immediately. You can view tasks and start collaborating right away!
            </p>
            <div style="text-align: center; margin-bottom: 28px;">
              <a href="${projectUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
                Go to Project Board
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 12px; line-height: 1.4; border-top: 1px solid #f1f5f9; padding-top: 16px;">
              Or copy this direct link:<br/>
              <a href="${projectUrl}" style="color: #6366f1; word-break: break-all;">${projectUrl}</a>
            </p>
          </div>
        </div>
      `,
    }).catch((err) => logger.warn(`Project added notification email send failed: ${err.message}`));
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

    if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw AppError.forbidden('This invitation was sent to a different email address.');
    }

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

    // Mark corresponding in-app invitation notification as read
    await prisma.notification.updateMany({
      where: {
        recipientId: userId,
        resourceType: 'invitation',
        resourceId: token,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    }).catch(() => {});

    return membership;
  }

  async rejectInvitation(token: string) {
    const invitation = await this.getInvitationByToken(token);
    await this.invitationsRepo.rejectInvitation(invitation.id);

    // Mark corresponding in-app invitation notification as read
    await prisma.notification.updateMany({
      where: {
        resourceType: 'invitation',
        resourceId: token,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    }).catch(() => {});

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

    const emailSent = await this.dispatchInvitationEmail(invitation.workspace.name, invitation.email, invitation.role, token);
    logger.info(`📧 Invitation manually resent to ${invitation.email} for workspace ${invitation.workspace.name} (emailDelivered: ${emailSent})`);
    return {
      ...updatedInvitation,
      emailSent,
    };
  }

  async inviteProjectMember(
    projectId: string,
    inviterId: string,
    input: { email: string; role: ProjectRole }
  ) {
    const cleanEmail = input.email.trim().toLowerCase();

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
      where: { email: cleanEmail },
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

      // Check if user is already a member of this workspace
      const existingWorkspaceMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId, userId: existingUser.id },
        },
      });

      if (existingWorkspaceMember) {
        // Direct addition: user is already in the workspace!
        const member = await prisma.projectMember.create({
          data: {
            projectId,
            userId: existingUser.id,
            role: input.role,
          },
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        });

        await authorizationService.recordAuditLog({
          actorId: inviterId,
          workspaceId,
          projectId,
          resourceType: 'project_member',
          resourceId: member.id,
          action: 'PROJECT_MEMBER_ADDED',
          metadata: {
            userId: existingUser.id,
            email: existingUser.email,
            role: input.role,
            directAdded: true,
          },
        });

        // Trigger real-time in-app notification
        await NotificationJob.createAndDispatch({
          recipientId: existingUser.id,
          type: NotificationType.PROJECT_MEMBER_ADDED,
          title: `Added to project "${project.name}"`,
          message: `You were directly added to project "${project.name}" in workspace "${project.workspace.name}" as ${input.role}.`,
          resourceType: 'project',
          resourceId: projectId,
        });

        // Send informative notification email
        await this.dispatchProjectAddedEmail(
          project.workspace.name,
          project.name,
          existingUser.email,
          input.role,
          projectId
        );

        logger.info(`✨ User ${existingUser.email} is already in workspace ${project.workspace.name}; directly added to project ${project.name}`);

        return {
          directAdded: true,
          member,
          message: `${existingUser.name || cleanEmail} is already a member of this workspace and was directly added to the project.`,
        };
      }
    }

    // Check for existing pending invitation for this project
    const pendingInvitation = await this.invitationsRepo.findPendingProjectInvitation(projectId, cleanEmail);
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
          inviteeEmail: cleanEmail,
          projectRole: input.role,
          projectName: project.name,
        },
      });

      // If registered user, also trigger in-app notification
      if (existingUser) {
        await NotificationJob.createAndDispatch({
          recipientId: existingUser.id,
          type: NotificationType.WORKSPACE_INVITATION,
          title: `Project Invitation: ${project.name}`,
          message: `You were invited to collaborate on project "${project.name}" in workspace "${project.workspace.name}" as ${input.role}.`,
          resourceType: 'invitation',
          resourceId: token,
        });
      }

      const emailSent = await this.dispatchProjectInvitationEmail(
        project.workspace.name,
        project.name,
        cleanEmail,
        input.role,
        token
      );

      logger.info(`📧 Project invitation refreshed and re-sent to ${cleanEmail} for project ${project.name} (emailDelivered: ${emailSent})`);
      return {
        ...updatedInvitation,
        emailSent,
      };
    }

    // Create new project invitation
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await this.invitationsRepo.createInvitation({
      workspaceId,
      projectId,
      inviterId,
      email: cleanEmail,
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
        inviteeEmail: cleanEmail,
        projectRole: input.role,
        projectName: project.name,
      },
    });

    // If registered user, trigger in-app notification immediately
    if (existingUser) {
      await NotificationJob.createAndDispatch({
        recipientId: existingUser.id,
        type: NotificationType.WORKSPACE_INVITATION,
        title: `Project Invitation: ${project.name}`,
        message: `You were invited to collaborate on project "${project.name}" in workspace "${project.workspace.name}" as ${input.role}.`,
        resourceType: 'invitation',
        resourceId: token,
      });
    }

    const emailSent = await this.dispatchProjectInvitationEmail(
      project.workspace.name,
      project.name,
      cleanEmail,
      input.role,
      token
    );

    return {
      ...invitation,
      emailSent,
    };
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

    const emailSent = await this.dispatchProjectInvitationEmail(
      invitation.workspace.name,
      invitation.project?.name || 'Project',
      invitation.email,
      invitation.projectRole || 'MEMBER',
      token
    );

    // If target user exists on platform, trigger in-app notification
    const targetUser = await prisma.user.findUnique({
      where: { email: invitation.email.toLowerCase() },
    });
    if (targetUser) {
      await NotificationJob.createAndDispatch({
        recipientId: targetUser.id,
        type: NotificationType.WORKSPACE_INVITATION,
        title: `Project Invitation Resent: ${invitation.project?.name || 'Project'}`,
        message: `Your invitation to join project "${invitation.project?.name || 'Project'}" in workspace "${invitation.workspace.name}" was resent.`,
        resourceType: 'invitation',
        resourceId: token,
      });
    }

    logger.info(`📧 Project invitation manually resent to ${invitation.email} for project ${invitation.project?.name} (emailDelivered: ${emailSent})`);
    return {
      ...updatedInvitation,
      emailSent,
    };
  }

  async getMyPendingInvitations(userEmail: string) {
    return prisma.workspaceInvitation.findMany({
      where: {
        email: { equals: userEmail.toLowerCase(), mode: 'insensitive' },
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            key: true,
            description: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
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
