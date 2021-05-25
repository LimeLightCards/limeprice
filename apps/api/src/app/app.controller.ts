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
    const price = await this.appService.ideal808(null, { count: 1, rarity, name });
    if(price === -1) return 0;
    return price;
  }

}
