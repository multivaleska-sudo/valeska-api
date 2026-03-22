import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('forgot-password')
    async forgotPassword(@Body('email') email: string) {
        return this.authService.generateAndSendCode(email);
    }

    @Post('verify-code')
    async verifyCode(@Body('email') email: string, @Body('code') code: string) {
        return this.authService.verifyCode(email, code);
    }

    @Post('provision-device')
    async provisionDevice(
        @Body() body: { email: string; password: string; macAddress: string },
    ) {
        return this.authService.provisionDevice(
            body.email,
            body.password,
            body.macAddress
        );
    }
}