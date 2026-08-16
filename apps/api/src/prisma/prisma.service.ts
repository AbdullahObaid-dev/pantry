import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client/client';
// Prisma ORM v7 removed the built-in Rust query engine entirely — a driver
// adapter is now mandatory for every database, not an optional perf knob.
// This is the standard pattern from Prisma's own NestJS integration docs.
// See CONTRACT.md §11 for the moduleFormat="cjs" generator setting this
// import depends on (without it, this import fails outright: the client
// generates as ESM by default, which doesn't load into this CommonJS app).
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}