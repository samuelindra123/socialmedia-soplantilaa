import { Test, TestingModule } from '@nestjs/testing';
import { SystemStatusController } from './system-status.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('SystemStatusController', () => {
  let controller: SystemStatusController;
  let prisma: { $queryRaw: jest.Mock };

  beforeEach(async () => {
    prisma = {
      $queryRaw: jest.fn().mockResolvedValue(1),
    } as unknown as { $queryRaw: jest.Mock };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemStatusController],
      providers: [
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    controller = module.get<SystemStatusController>(SystemStatusController);
  });

  it('should report ok status when database check succeeds', async () => {
    const result = await controller.getStatus();
    expect(result.status).toBe('ok');
    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result.database.status).toBe('ok');
  });
});
