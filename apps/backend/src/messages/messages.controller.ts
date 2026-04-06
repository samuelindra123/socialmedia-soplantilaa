import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Delete,
  Query,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  getConversations(@Request() req: { user: { id: string } }) {
    return this.messagesService.getConversations(req.user.id);
  }

  @Get('unread-count')
  getUnreadCount(@Request() req: { user: { id: string } }) {
    return this.messagesService.getTotalUnreadCount(req.user.id);
  }

  @Get('conversation/find/:userId')
  findOrCreateConversation(
    @Request() req: { user: { id: string } },
    @Param('userId') userId: string,
  ) {
    return this.messagesService.findOrCreateConversation(req.user.id, userId);
  }

  @Post('send')
  sendMessage(
    @Request() req: { user: { id: string } },
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.sendMessage(req.user.id, dto);
  }

  @Post('send-with-media')
  @UseInterceptors(FileInterceptor('file'))
  async sendMessageWithMedia(
    @Request() req: { user: { id: string } },
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.sendMessageWithMedia(req.user.id, dto, file);
  }

  @Post(':messageId/delivered')
  markAsDelivered(
    @Request() req: { user: { id: string } },
    @Param('messageId') messageId: string,
  ) {
    return this.messagesService.markAsDelivered(messageId, req.user.id);
  }

  @Delete(':messageId')
  deleteMessage(
    @Request() req: { user: { id: string } },
    @Param('messageId') messageId: string,
    @Query('forAll') forAll: string,
  ) {
    return this.messagesService.deleteMessage(
      messageId,
      req.user.id,
      forAll === 'true',
    );
  }

  @Get(':conversationId')
  getConversation(
    @Request() req: { user: { id: string } },
    @Param('conversationId') conversationId: string,
  ) {
    return this.messagesService.getConversationMessages(
      req.user.id,
      conversationId,
    );
  }
}
