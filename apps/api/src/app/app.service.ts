
import * as puppeteer from 'puppeteer';

import { Injectable, Logger } from '@nestjs/common';
import { CardCheck, CardCheckWithPrice } from '@weissprice/api-interfaces';
import { DBService } from './db.service';

@Injectable()
export class AppService {

  constructor(private readonly db: DBService) {}

  public priceStringToNumber(price: string): number {
    return +(price.split('$')[1]);
  }

  public async ideal808(browser, card: CardCheck): Promise<number> {

    const storedPrice = await this.db.getIdeal808Price(card.name, card.rarity);
    if(storedPrice) return storedPrice.price;

    const hasBrowser = !!browser;

    if(!browser) {
      browser = await puppeteer.launch();
    }

    const ignoredRarities = ['C', 'CC', 'U'];
    const search = ignoredRarities.includes(card.rarity) ? card.name : `${card.name} (${card.rarity})`;

    const page = await browser.newPage();

    try {
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

      const price = namesAndPrices[0]?.price ?? -1;

      await this.db.updateIdeal808Price(card.name, card.rarity, price);

      if(!hasBrowser) await browser.close();

      return price;

    } catch(e) {
      Logger.error(e, `ideal808 (${search})`);

      if(!hasBrowser) await browser.close();
      return -1;
    }
  }

  public async getCardsValue(cards: CardCheck[]): Promise<CardCheckWithPrice[]> {

    const browser = await puppeteer.launch();

    const getCardPrice = async (card: CardCheck) => {
      const ideal808Price = await this.ideal808(browser, card);

      return { ideal808: ideal808Price };
    };

    const prices = [];

    for(const card of cards) {
      const price = await getCardPrice(card);
      prices.push(price);
    }

    await browser.close();

    const ret = cards.map((x, i) => ({ ...x, price: prices[i] }));

    return ret;
  }

}
