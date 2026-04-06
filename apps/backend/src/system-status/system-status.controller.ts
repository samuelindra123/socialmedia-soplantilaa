import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../common/decorators/public.decorator';

type SimpleStatus = 'ok' | 'degraded' | 'down';

@ApiTags('System Status')
@Controller('system-status')
export class SystemStatusController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Mengecek status API dan database untuk monitoring sistem',
  })
  async getStatus() {
    const startedAt = Date.now();

    let dbStatus: SimpleStatus = 'ok';
    let dbLatencyMs: number | null = null;
    let dbError: string | null = null;

    try {
      const t0 = Date.now();
      // Query ringan untuk memastikan koneksi database sehat
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = await this.prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - t0;
    } catch (error) {
      dbStatus = 'down';
      dbError =
        error instanceof Error ? error.message : 'Unknown database error';
    }

    const apiLatencyMs = Date.now() - startedAt;

    const overallStatus: SimpleStatus = dbStatus === 'ok' ? 'ok' : 'degraded';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptimeSec: Math.round(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      api: {
        latencyMs: apiLatencyMs,
      },
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        error: dbError,
      },
    } as const;
  }
}
