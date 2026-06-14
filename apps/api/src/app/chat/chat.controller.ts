import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

import type { AuthUser } from '../auth/auth.types';

interface AuthRequest extends Request {
  user: AuthUser;
}

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a message and get a RAG-powered answer' })
  @ApiResponse({ status: 200, description: 'Answer with citations' })
  async sendMessage(@Body() dto: SendMessageDto, @Request() req: AuthRequest) {
    const userId = req.user.id;
    const { session, answer } = await this.chatService.sendMessage(dto, userId);

    return {
      sessionId: session.id,
      messageId: answer.id,
      answer: answer.content,
      citations: answer.citations ?? [],
      timestamp: answer.timestamp,
    };
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List all chat sessions for the current user' })
  getSessions(@Request() req: AuthRequest) {
    const sessions = this.chatService.getSessions(req.user.id);
    return sessions.map((s) => ({
      id: s.id,
      title: s.title,
      messageCount: s.messages.length,
      documentIds: s.documentIds,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get a specific chat session with messages' })
  getSession(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.chatService.getSession(id, req.user.id);
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a chat session' })
  deleteSession(@Param('id') id: string, @Request() req: AuthRequest) {
    this.chatService.deleteSession(id, req.user.id);
  }
}
