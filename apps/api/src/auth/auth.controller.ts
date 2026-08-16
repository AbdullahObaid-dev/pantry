import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  // Proof-of-life for the whole auth chain, same spirit as Stage 00a's
  // unprotected GET / health check. Not a general-purpose "current user"
  // API contract for other stages to build on without reviewing it first —
  // see CONTRACT.md §6.
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getCurrentUser(@Req() req: Request) {
    return req.user;
  }
}