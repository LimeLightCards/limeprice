import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import { CardPriceCheck, CardPriceResponse } from '@weissprice/api-interfaces';

import { AppService } from './app.service';

@Controller('cards')
export class AppController {

  constructor(private readonly appService: AppService) {}

  @Post('price')
  async checkPrice(@Body() cardPriceCheck: CardPriceCheck): Promise<CardPriceResponse> {
    const cards = await this.appService.getCardsValue(cardPriceCheck.cards);
    return { cards };
  }

  @Get('ideal808price')
  async ideal808price(@Query('name') name: string, @Query('rarity') rarity: string): Promise<number> {
    const price = await this.appService.checkIdeal808({ count: 1, rarity, name });
    return price;
  }

  @Get('tcgplayerprice')
  async tcgplayerprice(@Query('name') name: string, @Query('rarity') rarity: string): Promise<number> {
    const price = await this.appService.checkTCGPlayer({ count: 1, rarity, name });
    return price;
  }

}
