import { IsNotEmpty, IsString } from 'class-validator';

export class FollowRequestDto {
  @IsString()
  @IsNotEmpty()
  username!: string;
}
