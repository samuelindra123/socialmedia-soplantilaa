import { IsNotEmpty, IsUUID } from 'class-validator';

export class FollowActionDto {
  @IsUUID()
  @IsNotEmpty()
  followRequestId!: string;
}
