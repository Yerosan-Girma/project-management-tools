import { LabelsRepository } from './labels.repository';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/app-error';
import { CreateLabelInput, UpdateLabelInput } from './labels.schema';

export class LabelsService {
  constructor(private readonly labelsRepo: LabelsRepository = new LabelsRepository()) {}

  async createLabel(input: CreateLabelInput) {
    const existing = await prisma.label.findUnique({
      where: {
        workspaceId_name: {
          workspaceId: input.workspaceId,
          name: input.name
        }
      }
    });

    if (existing) {
      throw AppError.conflict(`A label with name "${input.name}" already exists in this workspace.`);
    }

    return this.labelsRepo.createLabel(input);
  }

  async listWorkspaceLabels(workspaceId: string) {
    return this.labelsRepo.listWorkspaceLabels(workspaceId);
  }

  async updateLabel(labelId: string, input: UpdateLabelInput) {
    const label = await this.labelsRepo.findById(labelId);
    if (!label) {
      throw AppError.notFound('Label not found.');
    }

    return this.labelsRepo.updateLabel(labelId, input);
  }

  async deleteLabel(labelId: string) {
    const label = await this.labelsRepo.findById(labelId);
    if (!label) {
      throw AppError.notFound('Label not found.');
    }

    await this.labelsRepo.deleteLabel(labelId);
    return true;
  }
}
