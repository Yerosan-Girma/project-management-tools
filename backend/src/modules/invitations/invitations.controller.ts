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
}
