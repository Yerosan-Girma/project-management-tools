import { Request, Response } from 'express';
import { InvitationsService } from './invitations.service';
import { ApiResponse } from '../../utils/api-response';

export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService = new InvitationsService()) {}

  invite = async (req: Request, res: Response): Promise<void> => {
    const invitation = await this.invitationsService.inviteMember(
      req.params.workspaceId,
      req.user!.id,
      req.body
    );
    ApiResponse.created(res, 'Invitation sent successfully.', invitation);
  };

  listWorkspaceInvitations = async (req: Request, res: Response): Promise<void> => {
    const invitations = await this.invitationsService.listWorkspaceInvitations(req.params.workspaceId);
    ApiResponse.success(res, 'Invitations retrieved.', invitations);
  };

  getDetails = async (req: Request, res: Response): Promise<void> => {
    const token = req.params.token || (req.query.token as string);
    const invitation = await this.invitationsService.getInvitationByToken(token);
    ApiResponse.success(res, 'Invitation details retrieved.', invitation);
  };

  accept = async (req: Request, res: Response): Promise<void> => {
    const member = await this.invitationsService.acceptInvitation(
      req.body.token,
      req.user!.id,
      req.user!.email
    );
    ApiResponse.success(res, 'Workspace invitation accepted successfully.', member);
  };

  reject = async (req: Request, res: Response): Promise<void> => {
    await this.invitationsService.rejectInvitation(req.body.token);
    ApiResponse.success(res, 'Workspace invitation rejected successfully.');
  };

  cancel = async (req: Request, res: Response): Promise<void> => {
    await this.invitationsService.cancelInvitation(
      req.params.invitationId,
      req.params.workspaceId,
      req.user!.id
    );
    ApiResponse.success(res, 'Invitation cancelled.');
  };

  resend = async (req: Request, res: Response): Promise<void> => {
    const invitation = await this.invitationsService.resendInvitation(
      req.params.workspaceId,
      req.params.invitationId,
      req.user!.id
    );
    ApiResponse.success(res, 'Invitation email resent successfully.', invitation);
  };

  getMyPendingInvitations = async (req: Request, res: Response): Promise<void> => {
    const invitations = await this.invitationsService.getMyPendingInvitations(req.user!.email);
    ApiResponse.success(res, 'Pending invitations retrieved.', invitations);
  };

  inviteProjectMember = async (req: Request, res: Response): Promise<void> => {
    const result = await this.invitationsService.inviteProjectMember(
      req.params.projectId,
      req.user!.id,
      req.body
    );
    if ((result as any).directAdded) {
      ApiResponse.success(res, (result as any).message || 'Member added to project.', result);
      return;
    }
    ApiResponse.created(res, 'Project invitation sent successfully.', result);
  };

  listProjectInvitations = async (req: Request, res: Response): Promise<void> => {
    const invitations = await this.invitationsService.listProjectInvitations(req.params.projectId);
    ApiResponse.success(res, 'Project invitations retrieved.', invitations);
  };

  resendProjectInvitation = async (req: Request, res: Response): Promise<void> => {
    const invitation = await this.invitationsService.resendProjectInvitation(
      req.params.projectId,
      req.params.invitationId,
      req.user!.id
    );
    ApiResponse.success(res, 'Project invitation email resent successfully.', invitation);
  };

  cancelProjectInvitation = async (req: Request, res: Response): Promise<void> => {
    await this.invitationsService.cancelProjectInvitation(
      req.params.projectId,
      req.params.invitationId,
      req.user!.id
    );
    ApiResponse.success(res, 'Project invitation cancelled.');
  };
}
