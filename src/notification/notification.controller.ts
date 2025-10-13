import { Controller, Get, Param, Patch, Req, UseGuards } from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { JwtAuthGuard } from "src/common/auth/AuthGuard";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";

@UseGuards(JwtAuthGuard)
@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @Get()
    @ApiOperation({
        summary: 'Get all notifications for the authenticated user',
        description:
            'Returns all notifications (read and unread) belonging to the logged-in user.',
    })
    async getNotifications(@Req() req) {
        return this.notificationService.findUserNotifications(req.user.id);
    }

    @ApiOperation({
        summary: 'Mark a notification as read',
        description:
            'Marks a specific notification as read by its ID for the logged-in user.',
    })
    @ApiParam({
        name: 'id',
        description: 'The UUID of the notification to mark as read',
        example: 'b45b0cc8-2d2f-40b3-aefb-921dfb3f9f98',
    })
    @Patch(':id/read')
    async markRead(@Param('id') id: string, @Req() req) {
        return this.notificationService.markAsRead(id, req.user.id);
    }

}