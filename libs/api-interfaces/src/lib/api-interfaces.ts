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
