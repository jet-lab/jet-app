import { AccountInfo, PublicKey } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';
import { createContext, useContext, useEffect, useState } from 'react';
import { idl, useProvider } from '../../hooks/jet-client/useClient';
import type { MarketAccount, Reserve } from '../models/JetTypes';
import { parsePriceData } from '@pythnetwork/client';
import {
  getAccountInfoAndSubscribe,
  getBorrowRate,
  getCcRate,
  getDepositRate,
  getMintInfoAndSubscribe,
  getTokenAccountAndSubscribe
} from '../util/programUtil';
import { parseIdlMetadata } from '../util/programUtil';
import { TokenAmount } from '../util/tokens';

// Market context
export interface Market {
  marketInit: boolean;
  setMarketInit: (init: boolean) => void;
  accountPubkey: PublicKey;
  setAccountPubkey: (key: PublicKey) => void;
  account: AccountInfo<MarketAccount>;
  setAccount: (account: AccountInfo<MarketAccount>) => void;
  authorityPubkey: PublicKey;
  setAuthorityPubkey: (key: PublicKey) => void;
  minColRatio: number;
  totalBorrowed: number;
  setTotalBorrowed: (tvl: number) => void;
  totalSupply: number;
  setTotalSupply: (tvl: number) => void;
  reserves: Record<string, Reserve>;
  setReserves: (reserves: Record<string, Reserve>) => void;
}
const MarketContext = createContext<Market>({
  minColRatio: 1.25,
  marketInit: false,
  setMarketInit: (init: boolean) => null,
  accountPubkey: {} as PublicKey,
  setAccountPubkey: () => null,
  account: {} as AccountInfo<MarketAccount>,
  setAccount: (account: AccountInfo<MarketAccount>) => null,
  authorityPubkey: {} as PublicKey,
  setAuthorityPubkey: () => null,
  totalBorrowed: 0,
  setTotalBorrowed: () => null,
  totalSupply: 0,
  setTotalSupply: () => null,
  reserves: {},
  setReserves: () => null
});

// Market context provider
export function MarketContextProvider(props: { children: JSX.Element }): JSX.Element {
  const minColRatio = 1.25;
  const { connection } = useProvider();
  const [marketInit, setMarketInit] = useState<boolean>(false);
  const [accountPubkey, setAccountPubkey] = useState<PublicKey>({} as PublicKey);
  const [account, setAccount] = useState<AccountInfo<MarketAccount>>({} as AccountInfo<MarketAccount>);
  const [authorityPubkey, setAuthorityPubkey] = useState<PublicKey>({} as PublicKey);
  const [totalBorrowed, setTotalBorrowed] = useState<number>(0);
  const [totalSupply, setTotalSupply] = useState<number>(0);
  const [reserves, setReserves] = useState<Record<string, Reserve>>({});
  const idlMetadata = parseIdlMetadata(idl.metadata);

  async function subscribeToMarket(reserves: Record<string, Reserve>) {
    let promise: Promise<number>;
    const promises: Promise<number>[] = [];

    for (const reserveMeta of idlMetadata.reserves) {
      // Deposit Note Mint
      promise = getMintInfoAndSubscribe(connection, reserveMeta.accounts.depositNoteMint, (amount: any) => {
        if (amount != null) {
          reserves[reserveMeta.abbrev].depositNoteMint = amount;

          deriveValues(reserves, reserves[reserveMeta.abbrev]);
          setReserves({ ...reserves });
        }
      });
      promises.push(promise);

      // Loan Note Mint
      promise = getMintInfoAndSubscribe(connection, reserveMeta.accounts.loanNoteMint, (amount: any) => {
        if (amount != null) {
          reserves[reserveMeta.abbrev].loanNoteMint = amount;

          deriveValues(reserves, reserves[reserveMeta.abbrev]);
          setReserves({ ...reserves });
        }
      });
      promises.push(promise);

      // Reserve Vault
      promise = getTokenAccountAndSubscribe(
        connection,
        reserveMeta.accounts.vault,
        reserveMeta.decimals,
        (amount: any) => {
          if (amount != null) {
            reserves[reserveMeta.abbrev].availableLiquidity = amount;

            deriveValues(reserves, reserves[reserveMeta.abbrev]);
            setReserves({ ...reserves });
          }
        }
      );
      promises.push(promise);

      // Reserve Token Mint
      promise = getMintInfoAndSubscribe(connection, reserveMeta.accounts.tokenMint, (amount: any) => {
        if (amount != null) {
          reserves[reserveMeta.abbrev].tokenMint = amount;

          deriveValues(reserves, reserves[reserveMeta.abbrev]);
          setReserves({ ...reserves });
        }
      });
      promises.push(promise);

      // Pyth Price
      promise = getAccountInfoAndSubscribe(connection, reserveMeta.accounts.pythPrice, (account: any) => {
        if (account != null) {
          const price = parsePriceData(account.data).price;
          if (price) {
            reserves[reserveMeta.abbrev].price = price;
            deriveValues(reserves, reserves[reserveMeta.abbrev]);
            setReserves({ ...reserves });
          }
        }
      });
      promises.push(promise);
    }

    return await Promise.all(promises).then(() => setMarketInit(true));
  }

  // Derive market reserve and user asset values, update global objects
  function deriveValues(reserves: Record<string, Reserve>, reserve: Reserve) {
    // Derive market reserve values
    reserve.marketSize = reserve.outstandingDebt.add(reserve.availableLiquidity);
    reserve.utilizationRate = reserve.marketSize.isZero()
      ? 0
      : reserve.outstandingDebt.tokens / reserve.marketSize.tokens;
    const ccRate = getCcRate(reserve.config, reserve.utilizationRate);
    reserve.borrowRate = getBorrowRate(ccRate, reserve.config.manageFeeRate);
    reserve.depositRate = getDepositRate(ccRate, reserve.utilizationRate);

    // Update market total value locked and reserve array from new values
    let borrowed = 0;
    let supply = 0;
    const reservesArray: Reserve[] = [];
    for (const r in reserves) {
      borrowed += reserves[r].outstandingDebt.muln(reserves[r].price)?.tokens;
      supply += reserves[r].marketSize.sub(reserves[r].outstandingDebt).muln(reserves[r].price)?.tokens;
      reservesArray.push(reserves[r]);
    }
    setTotalBorrowed(borrowed);
    setTotalSupply(supply);
  }

  // Init reserves and subscribe
  useEffect(() => {
    // Setup reserve structures
    const reserves: Record<string, Reserve> = {};
    for (const reserveMeta of idlMetadata.reserves) {
      const reserve: Reserve = {
        name: reserveMeta.name,
        abbrev: reserveMeta.abbrev,
        marketSize: TokenAmount.zero(reserveMeta.decimals),
        outstandingDebt: TokenAmount.zero(reserveMeta.decimals),
        utilizationRate: 0,
        depositRate: 0,
        borrowRate: 0,
        maximumLTV: 0,
        liquidationPremium: 0,
        price: 0,
        decimals: reserveMeta.decimals,
        depositNoteExchangeRate: new BN(0),
        loanNoteExchangeRate: new BN(0),
        accruedUntil: new BN(0),
        config: {
          utilizationRate1: 0,
          utilizationRate2: 0,
          borrowRate0: 0,
          borrowRate1: 0,
          borrowRate2: 0,
          borrowRate3: 0,
          minCollateralRatio: 0,
          liquidationPremium: 0,
          manageFeeCollectionThreshold: new BN(0),
          manageFeeRate: 0,
          loanOriginationFee: 0,
          liquidationSlippage: 0,
          _reserved0: 0,
          liquidationDexTradeMax: 0,
          _reserved1: [],
          confidenceThreshold: 0
        },

        accountPubkey: reserveMeta.accounts.reserve,
        vaultPubkey: reserveMeta.accounts.vault,
        availableLiquidity: TokenAmount.zero(reserveMeta.decimals),
        feeNoteVaultPubkey: reserveMeta.accounts.feeNoteVault,
        tokenMintPubkey: reserveMeta.accounts.tokenMint,
        tokenMint: TokenAmount.zero(reserveMeta.decimals),
        faucetPubkey: reserveMeta.accounts.faucet ?? null,
        depositNoteMintPubkey: reserveMeta.accounts.depositNoteMint,
        depositNoteMint: TokenAmount.zero(reserveMeta.decimals),
        loanNoteMintPubkey: reserveMeta.accounts.loanNoteMint,
        loanNoteMint: TokenAmount.zero(reserveMeta.decimals),
        pythPricePubkey: reserveMeta.accounts.pythPrice,
        pythProductPubkey: reserveMeta.accounts.pythProduct
      };
      reserves[reserveMeta.abbrev] = reserve;
    }

    // Update market accounts and reserves
    setAccountPubkey(idlMetadata.market.market);
    setAuthorityPubkey(idlMetadata.market.marketAuthority);
    setReserves({ ...reserves });
    subscribeToMarket(reserves);
  }, []);

  return (
    <MarketContext.Provider
      value={{
        minColRatio,
        marketInit,
        setMarketInit,
        accountPubkey,
        setAccountPubkey,
        account,
        setAccount,
        authorityPubkey,
        setAuthorityPubkey,
        totalBorrowed,
        setTotalBorrowed,
        totalSupply,
        setTotalSupply,
        reserves,
        setReserves
      }}>
      {props.children}
    </MarketContext.Provider>
  );
}

// Market hook
export const useMarket = () => {
  const context = useContext(MarketContext);
  return context;
};
