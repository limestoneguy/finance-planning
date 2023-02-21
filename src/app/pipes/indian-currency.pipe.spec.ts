import { IndianCurrencyPipe } from './indian-currency.pipe';

describe('IndianCurrencyPipe', () => {
  it('create an instance', () => {
    const pipe = new IndianCurrencyPipe();
    expect(pipe).toBeTruthy();
  });
});
