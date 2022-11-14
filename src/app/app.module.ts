import { Module } from '@nestjs/common';

import { MongoClient } from 'mongodb';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { dbInit, DBService, setupCollection } from './db.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    AppService,
    DBService,
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: async () => await dbInit()
    },
    /*
    {
      provide: 'IDEAL808_PRICES',
      useFactory: (client: MongoClient) => setupCollection(client.db('weissprice').collection('ideal808')),
      inject: ['DATABASE_CONNECTION'],
    },
    */
    {
      provide: 'TCGPLAYER_PRICES',
      useFactory: (client: MongoClient) => setupCollection(client.db('weissprice').collection('tcgplayer')),
      inject: ['DATABASE_CONNECTION'],
    },
  ]
})
export class AppModule {}
