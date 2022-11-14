
import * as puppeteer from 'puppeteer';
import fetch from 'node-fetch';

import { Injectable, Logger } from '@nestjs/common';
import { CardCheck, CardCheckWithPrice, Rarity } from '../api-interfaces';
import { DBService } from './db.service';

@Injectable()
export class AppService {

  // private puppeteer;
  private scrapeQueue: Array<{ resolve, cb, promise, delay? }> = [];

  constructor(private readonly db: DBService) {
    this.init();
  }

  private async init() {
    // this.puppeteer = await this.getPuppeteer();

    this.handleQueue();

    // process.on('exit', () => this.puppeteer.close());
  }

  private async handleQueue() {
    const next = this.scrapeQueue.shift();
    if(!next) {
      setTimeout(() => this.handleQueue(), 100);
      return;
    }

    const { resolve, cb, delay } = next;

    const val = await cb();
    resolve(val);

    setTimeout(() => this.handleQueue(), delay || 100);
  }

  /*
  private async getPuppeteer() {
    return puppeteer.launch({
      ignoreDefaultArgs: ['--disable-extensions'],
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-first-run',
        '--no-sandbox',
        '--no-zygote',
        '--single-process',
      ]
    });

  }
  */

  public priceStringToNumber(price: string): number {
    return +(price.split('$')[1]);
  }

  public async checkTCGPlayer(card: CardCheck): Promise<number> {
    let resolve = null;
    const cb = this.tcgPlayer.bind(this, card);
    const promise = new Promise(resolver => {
      resolve = resolver;
    });

    this.scrapeQueue.push({ resolve, promise, cb, delay: 10 });

    const val = await promise;
    return val as number;
  }

  private async tcgPlayer(card: CardCheck): Promise<number> {

    Logger.log(`Searching ${card.name} (${card.rarity})`, 'tcgplayer');

    const storedPrice = await this.db.getTCGPlayerPrice(card.name, card.rarity);
    if(storedPrice) return storedPrice.price;

    const publicKey = process.env.TCGPLAYER_PUBLIC_KEY;
    const privateKey = process.env.TCGPLAYER_PRIVATE_KEY;
    const appName = process.env.TCGPLAYER_APPLICATION;

    if(!publicKey || !privateKey || !appName) {
      Logger.log('Need a public/private key and an app name to TCGPlayer search', 'tcgplayer');
      return 0;
    }

    const res = await fetch('https://api.tcgplayer.com/token', {
      method: 'POST',
      headers: {
        'User-Agent': appName,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=client_credentials&client_id=${publicKey}&client_secret=${privateKey}`
    });

    const tokenBody = await res.json();
    const token = tokenBody.access_token;
    if(!token) return 0;

    const products = await fetch('https://api.tcgplayer.com/catalog/categories/20/search', {
      method: 'POST',
      headers: {
        'User-Agent': appName,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sort: "MinPrice DESC",
        limit: 10,
        offset: 0,
        filters: [
          {
            name: "ProductName",
            values: [card.name]
          },
          {
            name: "Rarity",
            values: [Rarity[card.rarity]]
          },
        ]
      })
    });

    const productsBody = await products.json();
    if(productsBody.results.length === 0) return 0;

    const closestId = productsBody.results[0];
    if(!closestId) return 0;

    const prices = await fetch(`https://api.tcgplayer.com/pricing/product/${closestId}`, {
      method: 'GET',
      headers: {
        'User-Agent': appName,
        'Authorization': `Bearer ${token}`
      }
    });

    const pricesBody = await prices.json();
    if(pricesBody.results.length === 0) return 0;

    const priceRes = pricesBody.results[0];
    const price = priceRes.marketPrice || priceRes.midPrice;

    await this.db.updateTCGPlayerPrice(card.name, card.rarity, price);

    return price;
  }

  /*
  public async checkIdeal808(card: CardCheck): Promise<number> {
    let resolve = null;
    const cb = this.ideal808.bind(this, card);
    const promise = new Promise(resolver => {
      resolve = resolver;
    });

    this.scrapeQueue.push({ resolve, promise, cb });

    const val = await promise;
    return val as number;
  }
  */

  /*
  private async ideal808(card: CardCheck): Promise<number> {

    const ignoredRarities = ['C', 'CC', 'U'];
    const search = ignoredRarities.includes(card.rarity) ? card.name : `${card.name} (${card.rarity})`;

    Logger.log(`Queuing ${search}`, 'ideal808');

    const storedPrice = await this.db.getIdeal808Price(card.name, card.rarity);
    if(storedPrice) return storedPrice.price;

    try {
      const page = await this.puppeteer.newPage();
      await page.setCacheEnabled(false);

      await page.goto(`https://www.ideal808.com/SearchResults/?text=${encodeURIComponent(search)}`);

      Logger.log(search, 'ideal808');

      await page.waitForSelector('.container-fluid');

      const prices = await page.$$('#productList .row .price');
      const priceNumbers: string[] = await Promise.all(prices.map(x => x.evaluate(it => it.innerText, x)));

      const names = await page.$$('#productList .row h4 a');
      const nameStrings: string[] = await Promise.all(names.map(x => x.evaluate(it => it.innerText, x)));

      const namesAndPrices = nameStrings
        .map((name, i) => {
          return { name, price: this.priceStringToNumber(priceNumbers[i]) };
        })
        .filter(x => !x.name.includes('Bushiroad'));

      const price = namesAndPrices[0]?.price ?? 0;

      await this.db.updateIdeal808Price(card.name, card.rarity, price);
      await page.close();

      return price;

    } catch(e) {
      Logger.error(e, `ideal808 (${search})`);
      return 0;
    }
   return -1;
  }
  */

  /*
  public async getCardsValue(cards: CardCheck[]): Promise<CardCheckWithPrice[]> {

    const getCardPrice = async (card: CardCheck) => {
      const ideal808Price = await this.checkIdeal808(card);

      return { ideal808: ideal808Price };
    };

    const prices = [];

    for(const card of cards) {
      const price = await getCardPrice(card);
      prices.push(price);
    }

    const ret = cards.map((x, i) => ({ ...x, price: prices[i] }));

    return ret;
  }
  */

}
