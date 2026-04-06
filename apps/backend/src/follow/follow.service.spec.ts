import { Test, TestingModule } from '@nestjs/testing';
import { FollowService } from './follow.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

describe('FollowService', () => {
  let service: FollowService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: NotificationsGateway,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<FollowService>(FollowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
