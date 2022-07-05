import React from "react";
import { v4 as uuidv4 } from 'uuid';

export class Quote {
  constructor(id, symbol, price, volume, expiration) {
    this.id = id;
    this.symbol = symbol;
    this.price = price;
    this.volume = volume;
    this.availableVolume = volume;
    this.expiration = expiration;
  }
  getId() {    // UUID
    return this.id;
  }

  setId(id) {
    this.id = id;
  }

  setSymbol(symbol) {  // string
    this.symbol = symbol;
  }

  getSymbol() {
    return this.symbol;
  }

  setPrice(price) {    // currency numeric type
    this.price = price;
  }

  getPrice() {
    return this.price;
  }

  setAvailableVolume(volume) { //int
    this.availableVolume = volume;
  }

  getAvailableVolume() {
    return this.availableVolume;
  }

  setExpiration(expiration) {
    this.expiration = expiration;
  }

  getExpiration() {    // date
    return this.expiration;
  }
}

export class TradeResult {
  constructor(id, symbol, price, avgPrice, volume) {
    this.id = id;
    this.symbol = symbol;
    this.price = price;
    this.avgPrice = avgPrice;
    this.volumeRequested = volume;
  }

  setId(id) {
    this.id = id;
  }
  getId() {
    return this.id;
  }
  setSymbol(symbol) {
    this.symbol = symbol;
  }
  getSymbol() {
    return this.symbol;
  }
  setVolumeWeightedAveragePrice(price) {
    this.avgPrice = price;
  }
  getVolumeWeightedAveragePrice() {
    return this.avgPrice;
  }
  setVolumeRequested(volume) {
    this.volumeRequested = volume;
  }
  getVolumeRequested() {
    return this.volumeRequested;
  }
}

// Please create your own quote manager which implements IQuoteManager interface.
//
// Do not change the interface.
//
// Please adhere to good Object Oriented Programming concepts, and create whatever support code you feel is necessary.
//
// Efficiency counts think about what data structures you use and how each method will perform.
//
// Though not required, feel free to includes any notes on any areas of this interface that you would improve, or which you
// feel don't adhere to good design concepts or implementation practices.
export const publicSymbols = [
  'AAPL',
  'ABNB',
  'BBW',
  'BBY',
  'COST',
  'CRSR',
  'DPZ',
  'DUNE',
  'EA',
  'ESCA',
  'ETSY'
];
const quoteSeedCount = 5000;
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}
function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}
export class QuoteManager extends React.Component {
  constructor() {
    super();
    this.state = {
      books: [],
      trades: [],
      buySymbol: publicSymbols[0],
      buyVolume: 1
    }

    this.setBuySymbol = this.setBuySymbol.bind(this);
    this.setBuyVolume = this.setBuyVolume.bind(this);
    this.submitBuy = this.submitBuy.bind(this);
  }
  render() {
    return (
      <>
        <div>
          <select value={this.state.buySymbol} onChange={e => this.setBuySymbol(e.target.value)} >
            {publicSymbols.map(symbol => <option key={symbol} value={symbol}>{symbol}</option>)}
          </select>
          <input type='number' name='buyVolume' value={this.state.buyVolume} min={1} className="border py-1 border-sky-500 rounded" onChange={e => this.setBuyVolume(e.target.value)} />
          <button className='bg-sky-500 text-white rounded px-2 py-1' onClick={this.submitBuy}>Buy</button>
        </div>
        <ul className="max-h-screen overflow-auto grid grid-cols-6 gap-2">
          {this.state.books.map(quote => <li key={quote.id}>{quote.symbol} - {quote.availableVolume} @${quote.price}</li>)}
        </ul>
      </>
    );
  }
  componentDidMount() {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    for (let i = 1; i <= quoteSeedCount; i++) {
      this.addOrUpdateQuote({
        id: uuidv4(),
        symbol: publicSymbols[getRandomInt(0, publicSymbols.length - 1)],
        price: parseFloat(getRandomArbitrary(0.50, 3.75).toFixed(2)),
        volume: getRandomInt(500, 1000),
        expiration: getRandomInt(0, 1) ? now : tomorrow
      });
    }
  }

  setBuySymbol(symbol) {
    this.setState({ buySymbol: symbol });
  }
  setBuyVolume(volume) {
    this.setState({ buyVolume: volume });
  }
  submitBuy(evt) {
    evt.preventDefault();
    this.executeTrade(this.state.buySymbol, this.state.buyVolume);
  }
  // Add or update the quote (specified by Id) in symbol's book.
  // If quote is new or no longer in the book, add it. Otherwise update it to match the given price, volume, and symbol.
  addOrUpdateQuote(quote) {
    const quoteExitsIndex = this.state.books.findIndex(currQuote => currQuote.id === quote.id);

    if (quoteExitsIndex === -1) {
      this.state.books.push(new Quote(quote.id, quote.symbol, quote.price, quote.volume, quote.expiration));
    } else {
      this.state.books[quoteExitsIndex].setPrice(quote.price);
      this.state.books[quoteExitsIndex].setAvailableVolume(quote.availableVolume);
      this.state.books[quoteExitsIndex].setSymbol(quote.symbol);
    }

    this.setState({ books: [...this.state.books] });
  }

  // Remove quote by Id, if quote is no longer in symbol's book do nothing.
  removeQuote(id) {
    const quoteExitsIndex = this.state.books.findIndex(quote => quote.id === id);
    if (quoteExitsIndex === -1) {
      this.setState({ books: this.state.books.filter(quote => quote.id !== id) });
    }
  }

  // Remove all quotes on the specifed symbol's book.
  removeAllQuotes(symbol) {
    this.setState({ books: this.state.books.filter(quote => quote.symbol !== symbol) });
  }

  // Get the best (i.e. lowest) price in the symbol's book that still has available volume.
  // If there is no quote on the symbol's book with available volume, return null.
  // Otherwise return a Quote object with all the fields set.
  // Don't return any quote which is past its expiration time, or has been removed.
  getBestQuoteWithAvailableVolume(symbol) {
    const now = new Date();
    const symbolQuotes = this.state.books.filter(quote => quote.symbol === symbol && quote.availableVolume && quote.expiration.getTime() >= now.getTime()).sort((a, b) => a.price - b.price);

    return symbolQuotes.length ? symbolQuotes[0] : null;
  }

  calcVWAP(symbol, purchasePrice, purchaseVolume) {
    let minPrice = purchasePrice;
    let maxPrice = purchasePrice;
    let totalVolume = purchaseVolume;
    const closePrice = purchasePrice;

    const symbolTrades = this.state.trades.filter(trade => trade.symbol === symbol);

    symbolTrades.forEach(trade => {
      minPrice = trade.price < minPrice ? trade.price : minPrice;
      maxPrice = trade.price > maxPrice ? trade.price : maxPrice;
      totalVolume += trade.volumeRequested;
    });

    const typicalPrice = (minPrice + maxPrice + closePrice) / 3;
    const tpByVolume = parseFloat(typicalPrice) * purchaseVolume;

    return tpByVolume / totalVolume;
  }

  // Request that a trade be executed. For the purposes of this interface, assume that the trade is a request to BUY, not sell. Do not trade an expired quotes.
  // To Execute a trade:
  //   * Search available quotes of the specified symbol from best price to worst price.
  //   * Until the requested volume has been filled, use as much available volume as necessary (up to what is available) from each quote, subtracting the used amount from the available amount.
  // For example, we have two quotes:
  //   {Price: 1.0, Volume: 1,000, AvailableVolume: 750}
  //   {Price: 2.0, Volume: 1,000, AvailableVolume: 1,000}
  // After calling once for 500 volume, the quotes are:
  //   {Price: 1.0, Volume: 1,000, AvailableVolume: 250}
  //   {Price: 2.0, Volume: 1,000, AvailableVolume: 1,000}
  // And After calling this a second time for 500 volume, the quotes are:
  //   {Price: 1.0, Volume: 1,000, AvailableVolume: 0}
  //   {Price: 2.0, Volume: 1,000, AvailableVolume: 750}
  executeTrade(symbol, volumeRequested) {
    let volumeRemaining = volumeRequested;
    do {
      const bestQuote = this.getBestQuoteWithAvailableVolume(symbol);
      if (bestQuote !== null) {
        const newQuoteVolume = volumeRemaining < bestQuote.availableVolume ? bestQuote.availableVolume - volumeRemaining : 0;
        const volumeUsed = bestQuote.availableVolume >= volumeRemaining ? volumeRemaining : bestQuote.availableVolume;
        volumeRemaining = bestQuote.availableVolume >= volumeRemaining ? 0 : volumeRemaining - bestQuote.availableVolume;

        bestQuote.setAvailableVolume(newQuoteVolume);
        this.addOrUpdateQuote(bestQuote);

        this.state.trades.push(new TradeResult(uuidv4(), symbol, bestQuote.price, this.calcVWAP(symbol, bestQuote.price, volumeUsed), volumeUsed));
        this.setState({ trades: [...this.state.trades] });
      } else {
        volumeRemaining = 0;
      }
    } while (volumeRemaining > 0);
  }
}