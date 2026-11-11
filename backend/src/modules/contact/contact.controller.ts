import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/api-response';
import { contactService } from './contact.service';

export class ContactController {
  sendMessage = async (req: Request, res: Response): Promise<void> => {
    const result = await contactService.handleContactMessage(req.body);
    ApiResponse.success(res, result.message, { success: true }, 200);
  };
}

export const contactController = new ContactController();
