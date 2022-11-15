import { Body, Controller, Get, ParseArrayPipe, Post, Query } from '@nestjs/common';

import { CardPriceCheck, CardPriceResponse } from '../api-interfaces';

import { AppService } from './app.service';

@Controller('cards')
export class AppController {

  constructor(private readonly appService: AppService) {}

  /*
  @Post('price')
  async checkPrice(@Body() cardPriceCheck: CardPriceCheck): Promise<CardPriceResponse> {
    const cards = await this.appService.getCardsValue(cardPriceCheck.cards);
    return { cards };
  }
  */

  /*
  @Get('ideal808price')
  async ideal808price(@Query('name') name: string, @Query('rarity') rarity: string): Promise<number> {
    const price = await this.appService.checkIdeal808({ count: 1, rarity, name });
    return price;
  }
  */

  @Get('tcgplayerprice')
  async tcgplayerprice(@Query('name') name: string, @Query('rarity') rarity: string, @Query('code') code: string): Promise<number> {
    const price = await this.appService.checkTCGPlayer({ rarity, name, code });
    return price;
  }

  @Get('tcgplayerpricemulti')
  async tcgplayerprices(
    @Query('name', new ParseArrayPipe({ items: String, separator: '|' })) name: string[],
    @Query('rarity', new ParseArrayPipe({ items: String, separator: '|' })) rarity: string[],
    @Query('code', new ParseArrayPipe({ items: String, separator: '|' })) code: string[]
  ): Promise<number[]> {

    const objects = [];
    for(let i = 0; i < name.length; i++) {
      objects.push({
        name: name[i],
        rarity: rarity[i],
        code: code[i]
      });
    }

    if(objects.length > 50) objects.length = 50;

    const prices = await Promise.all(objects.map(obj => this.appService.checkTCGPlayer(obj)));
    return prices;
  }

}
