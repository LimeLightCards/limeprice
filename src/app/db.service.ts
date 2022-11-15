

import { Inject, Injectable, Logger } from '@nestjs/common';

import { MongoClient, Collection } from 'mongodb';

import { Price } from '../api-interfaces';

export async function dbInit() {

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';

  const client = new MongoClient(uri, { useUnifiedTopology: true });
  await client.connect();

  Logger.log(`Connected to ${uri}`, 'DB');

  return client;
};

export function setupCollection(collection: Collection): Collection {
  collection.createIndex( { createdAt: 1 }, { expireAfterSeconds: 86400 });
  return collection;
}

@Injectable()
export class DBService {

  constructor(
    // @Inject('IDEAL808_PRICES') private ideal808Collection: Collection<Price>,
    @Inject('TCGPLAYER_PRICES') private tcgplayerCollection: Collection<Price>
  ) {}

  /*
  public async getIdeal808Price(name: string, rarity: string): Promise<Price> {
    return this.ideal808Collection.findOne<Price>({ name, rarity });
  }

  public async updateIdeal808Price(name: string, rarity: string, price: number): Promise<void> {
    return this.ideal808Collection.updateOne(
      { name },
      { $set: { name, rarity, price, createdAt: new Date() } },
      { upsert: true }
    );
  }
  */

  public async getTCGPlayerPrice(code: string): Promise<Price> {
    return this.tcgplayerCollection.findOne<Price>({ code });
  }

  public async updateTCGPlayerPrice(name: string, rarity: string, code: string, price: number): Promise<void> {
    return this.tcgplayerCollection.updateOne(
      { name },
      { $set: { name, rarity, price, code, createdAt: new Date() } },
      { upsert: true }
    );
  }

}
