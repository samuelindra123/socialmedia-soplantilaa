import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * DTO untuk parameter query daftar video.
 */
export class ListVideosDto {
  @ApiPropertyOptional({
    description: 'Halaman yang ingin diambil (mulai dari 1).',
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt({ message: 'Parameter page harus berupa angka bulat' })
  @Min(1, { message: 'Halaman minimal 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Jumlah item per halaman (maksimal 50).',
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt({ message: 'Parameter limit harus berupa angka bulat' })
  @Min(1, { message: 'Limit minimal 1' })
  @Max(50, { message: 'Limit maksimal 50' })
  limit?: number = 10;
}
