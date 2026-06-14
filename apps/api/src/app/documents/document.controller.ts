import { randomUUID } from 'crypto';
import * as path from 'path';

import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { DocumentService } from './document.service';

interface AuthRequest extends Request {
  user: { id: string; email: string; name: string; role: string };
}

@ApiTags('documents')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a document (PDF, DOCX, XLSX, TXT)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = process.env['UPLOAD_DIR'] ?? './uploads';
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname).toLowerCase();
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: {
        fileSize: parseInt(process.env['MAX_UPLOAD_MB'] ?? '50') * 1024 * 1024,
      },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File, @Request() req: AuthRequest) {
    if (!file) throw new BadRequestException('No file provided');
    return this.documentService.upload(file, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all documents for current user' })
  list(@Request() req: AuthRequest) {
    return this.documentService.findAll(req.user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get document statistics' })
  stats() {
    return this.documentService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  getOne(@Param('id') id: string) {
    return this.documentService.findById(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a document' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  async remove(@Param('id') id: string, @Request() req: AuthRequest) {
    await this.documentService.delete(id, req.user.id);
  }
}
