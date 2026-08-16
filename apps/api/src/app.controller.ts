import { Controller, Get } from '@nestjs/common';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Proof-of-life only — confirms the skeleton boots and serves a request.
  // No business-logic routes exist yet; those arrive with their own stages
  // (search: 02a, recipes: 01e, pantry: 05a, auth: 00d).
  @Get()
  getStatus() {
    return this.appService.getStatus();
  }
}
