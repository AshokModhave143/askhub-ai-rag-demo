import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ description: 'The user message / question', maxLength: 4096 })
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  message!: string;

  @ApiPropertyOptional({ description: 'Existing session ID to continue conversation' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'Restrict search to these document IDs (empty = all documents)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentIds?: string[];
}
