export interface CardCheck {
  name: string;
  rarity: string;
  count: number;
}

export type CardCheckWithPrice = CardCheck & {
  price: {
    ideal808: number;
  };
}

export interface CardPriceCheck {
  cards: CardCheck[];
}

export interface CardPriceResponse {
  cards: CardCheckWithPrice[];
}

export interface Price {
  name: string;
  rarity: string;
  price: number;
}

export enum Rarity {
  TD = 'Trial Deck',
  PR = 'Promo',

  C = 'Common',
  U = 'Uncommon',
  R = 'Rare',
  RR = 'Double Rare',
  RRR = 'Triple Rare',
  SR = 'Super Rare',
  SSP = 'Super Special Rare',
  HR = 'High Rare',
  XR = 'Extra Rare',

  CC = 'Climax Common',
  CR = 'Climax Rare',

  SPM = 'Special Pack Rare',
  SEC = 'Secret Rare',

  BDR = 'Band Rare',
  GGR = 'Gun Gale Rare',
  FBR = 'Fujimi Fantasia Bunko Rare',
  KR = 'Kaguya Rare',
  STR = 'Starlight Rare',
  JJR = 'JoJo Rare',


}
