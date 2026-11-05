import { prisma } from '../../config/database';
import { Label } from '@prisma/client';

export class LabelsRepository {
  async createLabel(data: { workspaceId: string; name: string; color: string }): Promise<Label> {
    return prisma.label.create({
      data
    });
  }

  async findById(id: string): Promise<Label | null> {
    return prisma.label.findUnique({
      where: { id }
    });
  }

  async listWorkspaceLabels(workspaceId: string): Promise<Label[]> {
    return prisma.label.findMany({
      where: { workspaceId },
      orderBy: { name: 'asc' }
    });
  }

  async updateLabel(id: string, data: Partial<Label>): Promise<Label> {
    return prisma.label.update({
      where: { id },
      data
    });
  }

  async deleteLabel(id: string): Promise<void> {
    await prisma.label.delete({
      where: { id }
    });
  }
}
