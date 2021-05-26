
import * as puppeteer from 'puppeteer';

import { Injectable, Logger } from '@nestjs/common';
import { CardCheck, CardCheckWithPrice } from '@weissprice/api-interfaces';
import { DBService } from './db.service';

@Injectable()
export class AppService {

  private puppeteer;
  private scrapeQueue: Array<{ resolve, cb, promise }> = [];

  constructor(private readonly db: DBService) {
    this.init();
  }

  private async init() {
    this.puppeteer = await this.getPuppeteer();

    this.handleQueue();

    process.on('exit', () => this.puppeteer.close());
  }

  private async handleQueue() {
    const next = this.scrapeQueue.shift();
    if(!next) {
      setTimeout(() => this.handleQueue(), 100);
      return;
    }

    const { resolve, cb } = next;

    const val = await cb();
    resolve(val);

    setTimeout(() => this.handleQueue(), 100);
  }

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

  public priceStringToNumber(price: string): number {
    return +(price.split('$')[1]);
  }

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

  private async ideal808(card: CardCheck): Promise<number> {

    const storedPrice = await this.db.getIdeal808Price(card.name, card.rarity);
    if(storedPrice) return storedPrice.price;

    const ignoredRarities = ['C', 'CC', 'U'];
    const search = ignoredRarities.includes(card.rarity) ? card.name : `${card.name} (${card.rarity})`;

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

      return price;

    } catch(e) {
      Logger.error(e, `ideal808 (${search})`);
      return 0;
    }
  }

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

}
