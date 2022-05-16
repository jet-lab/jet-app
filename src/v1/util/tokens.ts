import { bigIntToBn } from '@jet-lab/jet-engine';
import { BN } from '@project-serum/anchor';
import type { Account, Mint } from '@solana/spl-token';

// Token Amounts
export class TokenAmount {
  /** Raw amount of token lamports */
  public amount: BN;
  /** Number of decimals configured for token's mint */
  public decimals: number;
  /** Token amount as string, accounts for decimals */
  public uiAmount: string;
  /** Token amount as a float, accounts for decimals. Imprecise at large numbers */
  public tokens: number;

  constructor(amount: BN, decimals: number) {
    if (!BN.isBN(amount)) {
      console.warn('Amount is not a BN', amount);
      amount = new BN(0);
    }
    this.amount = amount;
    this.decimals = decimals;
    this.tokens = TokenAmount.tokenAmount(amount, decimals);
    this.uiAmount = this.tokens.toString();
  }

  public static zero(decimals: number) {
    return new TokenAmount(new BN(0), decimals);
  }

  public static tokenAccount(tokenAccount: Account, decimals: number) {
    return new TokenAmount(bigIntToBn(tokenAccount.amount), decimals);
  }

  public static mint(mint: Mint) {
    return new TokenAmount(bigIntToBn(mint.supply), mint.decimals);
  }

  public static tokens(tokenAmount: string, decimals: number) {
    return new TokenAmount(TokenAmount.tokensToLamports(tokenAmount, decimals), decimals);
  }

  private static tokenAmount(lamports: BN, decimals: number) {
    const str = lamports.toString(10, decimals);
    return parseFloat(str.slice(0, -decimals) + '.' + str.slice(-decimals));
  }

  public static tokenPrice(marketValue: number, price: number, decimals: number) {
    const tokens = price !== 0 ? marketValue / price : 0;
    return TokenAmount.tokens(tokens.toFixed(decimals), decimals);
  }

  // Convert a uiAmount string into lamports BN
  private static tokensToLamports(uiAmount: string, decimals: number) {
    // Convert from exponential notation (7.46e-7) to regular
    if (uiAmount.indexOf('e+') !== -1 || uiAmount.indexOf('e-') !== -1) {
      uiAmount = Number(uiAmount).toLocaleString('fullwide', { useGrouping: false });
    }

    let lamports: string = uiAmount;

    // Remove commas
    while (lamports.indexOf(',') !== -1) {
      lamports = lamports.replace(',', '');
    }

    // Determine if there's a decimal, take number of
    // characters after it as fractionalValue
    let fractionalValue = 0;
    const initialPlace = lamports.indexOf('.');
    if (initialPlace !== -1) {
      fractionalValue = lamports.length - (initialPlace + 1);

      // If fractional value is lesser than a lamport, round to nearest lamport
      if (fractionalValue > decimals) {
        lamports = String(parseFloat(lamports).toFixed(decimals));
      }

      // Remove decimal
      lamports = lamports.replace('.', '');
    }

    // Append zeros
    for (let i = 0; i < decimals - fractionalValue; i++) {
      lamports += '0';
    }

    // Return BN value in lamports
    return new BN(lamports);
  }

  public add(b: TokenAmount) {
    return this.do(b, BN.prototype.add);
  }

  public addb(b: BN) {
    return new TokenAmount(this.amount.add(b), this.decimals);
  }

  public addn(b: number) {
    return new TokenAmount(this.amount.addn(b), this.decimals);
  }

  public sub(b: TokenAmount) {
    return this.do(b, BN.prototype.sub);
  }

  public subb(b: BN) {
    return new TokenAmount(this.amount.sub(b), this.decimals);
  }

  public subn(b: number) {
    return new TokenAmount(this.amount.subn(b), this.decimals);
  }

  public mul(b: TokenAmount) {
    return this.do(b, BN.prototype.mul);
  }

  public mulb(b: BN) {
    return new TokenAmount(this.amount.mul(b), this.decimals);
  }

  public muln(b: number) {
    return new TokenAmount(this.amount.muln(b), this.decimals);
  }

  public div(b: TokenAmount) {
    return this.do(b, BN.prototype.div);
  }

  public divb(b: BN) {
    return new TokenAmount(this.amount.div(b), this.decimals);
  }

  public divn(b: number) {
    return new TokenAmount(this.amount.divn(b), this.decimals);
  }

  public lt(b: TokenAmount) {
    return this.amount.lt(b.amount);
  }

  public gt(b: TokenAmount) {
    return this.amount.gt(b.amount);
  }

  public eq(b: TokenAmount) {
    return this.amount.eq(b.amount);
  }

  public isZero() {
    return this.amount.isZero();
  }

  private do(b: TokenAmount, fn: (b: BN) => BN) {
    if (this.decimals !== b.decimals) {
      console.warn('Decimal mismatch');
      return TokenAmount.zero(this.decimals);
    }
    const amount = fn.call(this.amount, b.amount);
    return new TokenAmount(amount, this.decimals);
  }
}

export type AmountUnits = {
  tokens?: Record<string, unknown>;
  depositNotes?: Record<string, unknown>;
  loanNotes?: Record<string, unknown>;
};

export class Amount {
  private constructor(public units: AmountUnits, public value: BN) {}

  static tokens(amount: number | BN): Amount {
    return new Amount({ tokens: {} }, new BN(amount));
  }

  static depositNotes(amount: number | BN): Amount {
    return new Amount({ depositNotes: {} }, new BN(amount));
  }

  static loanNotes(amount: number | BN): Amount {
    return new Amount({ loanNotes: {} }, new BN(amount));
  }
}
