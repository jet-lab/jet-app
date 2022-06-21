import { MarginPools, TokenAmount } from '@jet-lab/margin';
import type { AccountInfo, PublicKey } from '@solana/web3.js';
import type BN from 'bn.js';

// Web3
export interface HasPublicKey {
  publicKey: PublicKey;
}
export interface ToBytes {
  toBytes(): Uint8Array;
}

//Idl Metadata
export interface IdlMetadata {
  address: PublicKey;
  cluster: string;
  market: MarketMetadata;
  reserves: ReserveMetadata[];
}

// Market
export interface MarketAccount {
  version: number;
  /** The exponent used for quote prices */
  quoteExponent: number;
  /** The currency used for quote prices */
  quoteCurrency: BN;
  /** The bump seed value for generating the authority address. */
  authorityBumpSeed: number;
  /** The address used as the seed for generating the market authority
  address. Typically this is the market account's own address. */
  authoritySeed: PublicKey;
  /** The account derived by the program, which has authority over all
  assets in the market. */
  marketAuthority: PublicKey;
  /** The account that has authority to make changes to the market */
  owner: PublicKey;
  /** The mint for the token in terms of which the reserve assets are quoted */
  quoteTokenMint: PublicKey;
  /** Reserved space */
  _reserved: number[];
  /** Tracks the current prices of the tokens in reserve accounts */
  reserves: JetMarketReserveInfo[];
}
export interface JetMarketReserveInfo {
  reserve: PublicKey;
  price: BN;
  depositNoteExchangeRate: BN;
  loanNoteExchangeRate: BN;
  minCollateralRatio: BN;
  liquidationBonus: number;
  lastUpdated: BN;
  invalidated: number;
}
export type CacheReserveInfoStruct = CacheStruct & {
  /** The price of the asset being stored in the reserve account.
  USD per smallest unit (1u64) of a token */
  price: BN;
  /** The value of the deposit note (unit: reserve tokens per note token) */
  depositNoteExchangeRate: BN;
  /** The value of the loan note (unit: reserve tokens per note token) */
  loanNoteExchangeRate: BN;
  /** The minimum allowable collateralization ratio for a loan on this reserve */
  minCollateralRatio: number;
  /** The bonus awarded to liquidators when repaying a loan in exchange for a
  collateral asset. */
  liquidationBonus: number;
  /** Unused space */
  _reserved: number[];
};
export interface CacheStruct {
  /** The last slot that this information was updated in */
  lastUpdated: BN;
  /** Whether the value has been manually invalidated */
  invalidated: number;
  /** Unused space */
  _reserved: number[];
}
export interface MarketMetadata {
  market: PublicKey;
  marketAuthority: PublicKey;
}

// Reserve
export interface Reserve {
  name: string;
  abbrev: MarginPools;
  marketSize: TokenAmount;
  borrowedTokens: TokenAmount;
  utilizationRate: number;
  depositRate: number;
  borrowRate: number;
  maximumLTV: number;
  /** The bonus awarded to liquidators when repaying a loan in exchange for a
  collateral asset. */
  liquidationPremium: number;
  // /** The price of the asset being stored in the reserve account. */
  // price: number;
  decimals: number;
  /** The value of the deposit note (unit: reserve tokens per note token) */
  depositNoteExchangeRate: BN;
  /** The value of the loan note (unit: reserve tokens per note token) */
  loanNoteExchangeRate: BN;
  /** The number of seconds since 1970 that the reserve is refreshed to. */
  accruedUntil: BN;
  config: ReserveConfigStruct;

  accountPubkey: PublicKey;
  vaultPubkey: PublicKey;
  depositedTokens: TokenAmount;
  feeNoteVaultPubkey: PublicKey;
  tokenMintPubkey: PublicKey;
  tokenMint: TokenAmount;
  faucetPubkey: PublicKey | null;
  depositNoteMintPubkey: PublicKey;
  depositNoteMint: TokenAmount;
  loanNoteMintPubkey: PublicKey;
  loanNoteMint: TokenAmount;
  pythPricePubkey: PublicKey;
  pythProductPubkey: PublicKey;
}
export interface ReserveAccount {
  version: number;
  index: number;
  exponent: number;
  market: PublicKey;
  oraclePrice: PublicKey;
  oracleProduct: PublicKey;
  tokenMint: PublicKey;
  depositNoteMint: PublicKey;
  loanNoteMint: PublicKey;
  vault: PublicKey;
  feeNoteVault: PublicKey;
  dexSwapTokens: PublicKey;
  dexOpenOrders: PublicKey;
  dexMarket: PublicKey;
  _reserved0: number[];
  config: ReserveConfigStruct;
  _reserved1: number[];
  state: ReserveStateStruct;
}
export interface ReserveConfigStruct {
  /** The utilization rate at which we switch from the first to second regime. */
  utilizationRate1: number;
  /** The utilization rate at which we switch from the second to third regime. */
  utilizationRate2: number;
  /** The lowest borrow rate in the first regime. Essentially the minimum
      borrow rate possible for the reserve. */
  borrowRate0: number;
  /** The borrow rate at the transition point from the first to second regime. */
  borrowRate1: number;
  /** The borrow rate at the transition point from the second to thirs regime. */
  borrowRate2: number;
  /** The highest borrow rate in the third regime. Essentially the maximum
      borrow rate possible for the reserve. */
  borrowRate3: number;
  /** The minimum allowable collateralization ratio for an obligation */
  minCollateralRatio: number;
  /** The amount given as a bonus to a liquidator */
  liquidationPremium: number;
  /** The threshold at which to collect the fees accumulated from interest into
      real deposit notes. */
  manageFeeCollectionThreshold: BN;
  /** The fee rate applied to the interest payments collected */
  manageFeeRate: number;
  /** The fee rate applied as interest owed on new loans */
  loanOriginationFee: number;
  /** Maximum slippage when selling this asset on DEX during liquidations */
  liquidationSlippage: number;
  /** Unused space */
  _reserved0: number;
  /** Maximum number of tokens to sell in a single DEX trade during liquidation */
  liquidationDexTradeMax: number;
  /** Unused space */
  _reserved1: number[];
  /** Confidence Threshold */
  confidenceThreshold: number;
}
export type ReserveStateStruct = CacheStruct & {
  accruedUntil: BN;
  borrowedTokens: BN;
  uncollectedFees: BN;
  totalDeposits: BN;
  totalDepositNotes: BN;
  totalLoanNotes: BN;
  _reserved: number[];
};
export interface ReserveMetadata {
  name: string;
  abbrev: string;
  decimals: number;
  reserveIndex: number;
  accounts: {
    reserve: PublicKey;
    vault: PublicKey;
    feeNoteVault: PublicKey;
    tokenMint: PublicKey;
    faucet?: PublicKey;
    depositNoteMint: PublicKey;
    loanNoteMint: PublicKey;

    pythPrice: PublicKey;
    pythProduct: PublicKey;

    dexMarket: PublicKey;
    dexSwapTokens: PublicKey;
    dexOpenOrders: PublicKey;
  };
  bump: {
    vault: number;
    depositNoteMint: number;
    loanNoteMint: number;

    dexSwapTokens: number;
    dexOpenOrders: number;
  };
}

// Account
export interface AssetStore {
  /** The users unwrapped sol balance found in their wallet. If we want to track more data than this,
   * this field could be expanded into a whole object instead of a BN. */
  sol: TokenAmount;
  obligationPubkey: PublicKey;
  obligationBump: number;
  obligation?: AccountInfo<ObligationAccount>;
  tokens: Record<string, Asset> & {
    SOL: Asset;
    USDC: Asset;
    BTC: Asset;
    ETH: Asset;
  };
}
export interface Asset {
  tokenMintPubkey: PublicKey;
  depositNotePubkey: PublicKey;
  depositNoteBump: number;
  depositNoteExists: boolean;
  depositNoteBalance: TokenAmount;
  depositBalance: TokenAmount;
  depositNoteDestPubkey: PublicKey;
  depositNoteDestBump: number;
  depositNoteDestExists: boolean;
  depositNoteDestBalance: TokenAmount;
  loanNotePubkey: PublicKey;
  loanNoteBump: number;
  loanNoteExists: boolean;
  loanNoteBalance: TokenAmount;
  loanBalance: TokenAmount;
  collateralNotePubkey: PublicKey;
  collateralNoteBump: number;
  collateralNoteExists: boolean;
  collateralNoteBalance: TokenAmount;
  collateralBalance: TokenAmount;
  maxDepositAmount: number;
  maxWithdrawAmount: number;
  maxBorrowAmount: number;
  maxRepayAmount: number;
}

// Obligation
export interface Obligation {
  depositedValue: number;
  borrowedValue: number;
  colRatio: number;
  utilizationRate: number;
}
export interface ObligationAccount {
  version: number;
  /** Unused space */
  _reserved0: number;
  /** The market this obligation is a part of */
  market: PublicKey;
  /** The address that owns the debt/assets as a part of this obligation */
  owner: PublicKey;
  /** Unused space */
  _reserved1: number[];
  /** Storage for cached calculations */
  cached: number[];
  /** The storage for the information on collateral owned by this obligation */
  collateral: ObligationPositionStruct[];
  /** The storage for the information on positions owed by this obligation */
  loans: ObligationPositionStruct[];
}
export interface ObligationPositionStruct {
  /** The token account holding the bank notes */
  account: PublicKey;
  /** Non-authoritative number of bank notes placed in the account */
  amount: BN;
  side: number;
  /** The index of the reserve that this position's assets are from */
  reserveIndex: number;
  _reserved: number[];
}

export interface CompiledInstruction {
  /** Index into the transaction keys array indicating the program account that executes this instruction */
  programIdIndex: number;
  /** Ordered indices into the transaction keys array indicating which accounts to pass to the program */
  accounts: number[];
  /** The program input data encoded as base 58 */
  data: string;
}

export enum TxnResponse {
  Success = 'SUCCESS',
  Failed = 'FAILED',
  Cancelled = 'CANCELLED'
}
