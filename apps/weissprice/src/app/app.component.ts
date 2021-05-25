import { Component, ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LocalStorage } from 'ngx-webstorage';

import * as Papa from 'papaparse';

import { CardCheck, CardCheckWithPrice, CardPriceResponse } from '@weissprice/api-interfaces';
import { from } from 'rxjs';
import { concatMap, finalize } from 'rxjs/operators';

@Component({
  selector: 'weissprice-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {

  @ViewChild('output') output!: ElementRef;

  @LocalStorage()
  public cards!: string;

  public isLoading = false;

  public cardRefs: CardCheckWithPrice[] = [];

  public ideal808Total = 0;
  public tcgplayerTotal = 0;

  constructor(private http: HttpClient) {}

  checkPrices() {
    this.isLoading = true;
    this.cardRefs = [];
    this.ideal808Total = 0;
    this.tcgplayerTotal = 0;

    Papa.parse(this.cards, {
      dynamicTyping: true,
      worker: true,
      complete: (results) => {
        const data: string[][] = results.data as string[][];
        const cards: CardCheck[] = data.map(x => ({ name: x[0], rarity: x[1], count: +(x[2] ?? '1') }));

        const cardCounts: Record<string, number> = {};
        cards.forEach(card => {
          cardCounts[card.name + card.rarity] = cardCounts[card.name + card.rarity] ?? 0;
          cardCounts[card.name + card.rarity] += card.count;
        });

        const doneCards: Record<string, boolean> = {};

        const cardReqs = cards.map(x => this.http.post<CardPriceResponse>('/api/cards/price', { cards: [x] }));

        from(cardReqs)
          .pipe(
            concatMap(x => x),
            finalize(() => {
              this.isLoading = false;
            })
          )
          .subscribe(x => {
            const card = x.cards[0];
            if(doneCards[card.name + card.rarity]) return;
            doneCards[card.name + card.rarity] = true;

            card.count = cardCounts[card.name + card.rarity];
            card.price.ideal808 *= card.count;

            if(card.price.ideal808 > 0) {
              this.ideal808Total += card.price.ideal808;
            }

            this.cardRefs.push(card);

            setTimeout(() => {
              this.output.nativeElement.scrollTop = this.output.nativeElement.scrollHeight;
            }, 0);
          });
      }
    });
  }
}
