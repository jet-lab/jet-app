import { createContext, useContext, useEffect, useState } from 'react';
import type { Asset, AssetStore, Obligation } from '../models/JetTypes';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { BN, Program } from '@project-serum/anchor';
import { NATIVE_MINT, getAssociatedTokenAddress } from '@solana/spl-token';
import {
  findCollateralAddress,
  findDepositNoteAddress,
  findDepositNoteDestAddress,
  findLoanNoteAddress,
  findObligationAddress,
  getAccountInfoAndSubscribe,
  getTokenAccountAndSubscribe,
  SOL_DECIMALS
} from '../util/programUtil';
import { useMargin } from '../../contexts/marginContext';
import { TokenAmount } from '../util/tokens';
import { useMarket } from './market';

// User context
export interface User {
  walletInit: boolean;
  setWalletInit: (init: boolean) => void;
  assets: AssetStore | null;
  setAssets: (assets: AssetStore) => void;
  position: Obligation;
  setPosition: (position: Obligation) => void;
  // walletBalances: Record<string, number>;
  // setWalletBalances: (walletBalances: Record<string, number>) => void;
  collateralBalances: Record<string, number>;
  setCollateralBalances: (collateralBalances: Record<string, number>) => void;
  loanBalances: Record<string, number>;
  setLoanBalances: (loanBalances: Record<string, number>) => void;
}
const UserContext = createContext<User>({
  walletInit: false,
  setWalletInit: () => null,
  assets: {} as unknown as AssetStore,
  setAssets: () => null,
  position: {} as unknown as Obligation,
  setPosition: () => null,
  // walletBalances: {},
  // setWalletBalances: () => null,
  collateralBalances: {},
  setCollateralBalances: () => null,
  loanBalances: {},
  setLoanBalances: () => null
});

// User context provider
export function UserContextProvider(props: { children: JSX.Element }): JSX.Element {
  const { connected, publicKey } = useWallet();
  const { programs, connection } = useMargin();
  const program = programs?.marginPool as any as Program;
  const market = useMarket();
  const [walletInit, setWalletInit] = useState<boolean>(false);
  const [assets, setAssets] = useState<AssetStore>({
    sol: TokenAmount.zero(0),
    obligationBump: 0,
    obligationPubkey: {} as PublicKey,
    tokens: {
      SOL: {} as Asset,
      USDC: {} as Asset,
      BTC: {} as Asset,
      ETH: {} as Asset
    }
  });
  const [position, setPosition] = useState<Obligation>({
    depositedValue: 0,
    borrowedValue: 0,
    colRatio: 0,
    utilizationRate: 0
  });
  const [walletBalances, setWalletBalances] = useState<Record<string, number>>({ USDC: 0, SOL: 0, BTC: 0, ETH: 0 });
  const [collateralBalances, setCollateralBalances] = useState<Record<string, number>>({
    USDC: 0,
    SOL: 0,
    BTC: 0,
    ETH: 0
  });
  const [loanBalances, setLoanBalances] = useState<Record<string, number>>({ USDC: 0, SOL: 0, BTC: 0, ETH: 0 });

  async function subscribeToAssets(assets: AssetStore) {
    let promise: Promise<number>;
    const promises: Promise<number>[] = [];
    if (!assets || !publicKey) {
      return;
    }

    // Wallet native SOL balance
    promise = getAccountInfoAndSubscribe(connection, publicKey, (account: any) => {
      if (account != null) {
        // Need to be careful constructing a BN from a number.
        // If the user has more than 2^53 lamports it will throw for not having enough precision.
        // assets.tokens.SOL.walletTokenBalance = new TokenAmount(new BN(account?.lamports.toString() ?? 0), SOL_DECIMALS);
        // assets.sol = assets.tokens.SOL.walletTokenBalance;
        // walletBalances.SOL = assets.sol.tokens;

        setWalletBalances(walletBalances);
        if (walletInit) {
          deriveValues(assets);
        }
      }
    });
    promises.push(promise);

    for (const abbrev in assets.tokens) {
      const asset = assets.tokens[abbrev];
      const reserve = market.reserves[abbrev];

      // Wallet token account
      // promise = getTokenAccountAndSubscribe(connection, asset.walletTokenPubkey, reserve.decimals, (amount: any) => {
      //   if (amount != null) {
      //     asset.walletTokenBalance = amount ?? new TokenAmount(new BN(0), reserve.decimals);
      //     asset.walletTokenExists = !!amount;

      //     // Update wallet token balance
      //     if (!asset.tokenMintPubkey.equals(NATIVE_MINT)) {
      //       walletBalances[reserve.abbrev] = asset.walletTokenBalance.tokens;
      //       setWalletBalances(walletBalances);
      //     }
      //     deriveValues(assets);
      //   }
      // });
      // promises.push(promise);

      // Reserve deposit notes
      promise = getTokenAccountAndSubscribe(
        connection,
        asset.depositNoteDestPubkey,
        reserve.decimals,
        (amount: any) => {
          if (amount != null) {
            asset.depositNoteDestBalance = amount ?? TokenAmount.zero(reserve.decimals);
            asset.depositNoteDestExists = !!amount;
            if (walletInit) {
              deriveValues(assets);
            }
          }
        }
      );
      promises.push(promise);

      // Deposit notes account
      promise = getTokenAccountAndSubscribe(connection, asset.depositNotePubkey, reserve.decimals, (amount: any) => {
        if (amount != null) {
          asset.depositNoteBalance = amount ?? TokenAmount.zero(reserve.decimals);
          asset.depositNoteExists = !!amount;
          deriveValues(assets);
        }
      });
      promises.push(promise);

      // Obligation loan notes
      promise = getTokenAccountAndSubscribe(connection, asset.loanNotePubkey, reserve.decimals, (amount: any) => {
        if (amount != null) {
          asset.loanNoteBalance = amount ?? TokenAmount.zero(reserve.decimals);
          asset.loanNoteExists = !!amount;
          deriveValues(assets);
        }
      });
      promises.push(promise);

      // Obligation collateral notes
      promise = getTokenAccountAndSubscribe(connection, asset.collateralNotePubkey, reserve.decimals, (amount: any) => {
        if (amount != null) {
          asset.collateralNoteBalance = amount ?? TokenAmount.zero(reserve.decimals);
          asset.collateralNoteExists = !!amount;
          deriveValues(assets);
        }
      });
      promises.push(promise);
    }

    return Promise.all(promises).then(() => {
      deriveValues(assets);
      setWalletInit(true);
    });
  }

  // Derive user position values on any asset change
  function deriveValues(assets: AssetStore) {
    // Collateral, deposit and loan balances first and foremost
    for (const abbrev in assets.tokens) {
      const asset = assets.tokens[abbrev];
      const reserve = market.reserves[abbrev];
      if (!(asset.depositNoteBalance && asset.loanNoteBalance && asset.collateralNoteBalance)) {
        return;
      }

      asset.depositBalance = asset.depositNoteBalance
        .mulb(reserve.depositNoteExchangeRate)
        .divb(new BN(Math.pow(10, 15)));
      asset.loanBalance = asset.loanNoteBalance.mulb(reserve.loanNoteExchangeRate).divb(new BN(Math.pow(10, 15)));
      asset.collateralBalance = asset.collateralNoteBalance
        .mulb(reserve.depositNoteExchangeRate)
        .divb(new BN(Math.pow(10, 15)));

      collateralBalances[reserve.abbrev] = asset.collateralBalance.tokens;
      loanBalances[reserve.abbrev] = asset.loanBalance.tokens;
    }
    setCollateralBalances({ ...collateralBalances });
    setLoanBalances({ ...loanBalances });

    // Calculate user's current position from ALL of those balances
    const updatedPosition: Obligation = { depositedValue: 0, borrowedValue: 0, colRatio: 0, utilizationRate: 0 };
    for (const abbrev in assets.tokens) {
      updatedPosition.depositedValue += collateralBalances[abbrev] * market.reserves[abbrev].price;
      updatedPosition.borrowedValue += loanBalances[abbrev] * market.reserves[abbrev].price;
      updatedPosition.colRatio = updatedPosition.borrowedValue
        ? updatedPosition.depositedValue / updatedPosition.borrowedValue
        : 0;
      updatedPosition.utilizationRate = updatedPosition.depositedValue
        ? updatedPosition.borrowedValue / updatedPosition.depositedValue
        : 0;
    }
    setPosition(updatedPosition);

    // Calculate user's maximum trade values from their updated position
    for (const abbrev in assets.tokens) {
      const asset = assets.tokens[abbrev];
      const reserve = market.reserves[abbrev];

      // Max deposit
      asset.maxDepositAmount = walletBalances[reserve.abbrev];

      // Max withdraw
      asset.maxWithdrawAmount = updatedPosition.borrowedValue
        ? (updatedPosition.depositedValue - market.minColRatio * updatedPosition.borrowedValue) / reserve.price
        : asset.collateralBalance.tokens;
      if (asset.maxWithdrawAmount > asset.collateralBalance.tokens) {
        asset.maxWithdrawAmount = asset.collateralBalance.tokens;
      }
      if (asset.maxWithdrawAmount > reserve.availableLiquidity.tokens) {
        asset.maxWithdrawAmount = reserve.availableLiquidity.tokens;
      }

      // Max borrow
      asset.maxBorrowAmount =
        (updatedPosition.depositedValue / market.minColRatio - updatedPosition.borrowedValue) / reserve.price;
      if (asset.maxBorrowAmount > reserve.availableLiquidity.tokens) {
        asset.maxBorrowAmount = reserve.availableLiquidity.tokens;
      }

      // Max repay
      if (walletBalances[reserve.abbrev] < asset.loanBalance.tokens) {
        asset.maxRepayAmount = walletBalances[reserve.abbrev];
      } else {
        asset.maxRepayAmount = asset.loanBalance.tokens;
      }

      assets.tokens[reserve.abbrev] = asset;
    }
    setAssets({ ...assets });
  }

  // When wallet connects, subscribe to assets
  useEffect(() => {
    if (connected && publicKey) {
      // Get user token accounts
      const getAssetPubkeys = async (): Promise<AssetStore> => {
        if (!program || !publicKey) {
          return {} as AssetStore;
        }

        const [obligationPubkey, obligationBump] = await findObligationAddress(
          program,
          market.accountPubkey,
          publicKey
        );
        const assetStore: AssetStore = {
          sol: new TokenAmount(new BN(0), SOL_DECIMALS),
          obligationPubkey,
          obligationBump,
          tokens: {}
        } as AssetStore;
        for (const assetAbbrev in market.reserves) {
          const reserve = market.reserves[assetAbbrev];
          const tokenMintPubkey = reserve.tokenMintPubkey;

          const [depositNoteDestPubkey, depositNoteDestBump] = await findDepositNoteDestAddress(
            program,
            reserve.accountPubkey,
            publicKey
          );
          const [depositNotePubkey, depositNoteBump] = await findDepositNoteAddress(
            program,
            reserve.accountPubkey,
            publicKey
          );
          const [loanNotePubkey, loanNoteBump] = await findLoanNoteAddress(
            program,
            reserve.accountPubkey,
            obligationPubkey,
            publicKey
          );
          const [collateralPubkey, collateralBump] = await findCollateralAddress(
            program,
            reserve.accountPubkey,
            obligationPubkey,
            publicKey
          );

          const asset: Asset = {
            tokenMintPubkey,
            // walletTokenPubkey: await getAssociatedTokenAddress(tokenMintPubkey, publicKey),
            // walletTokenExists: false,
            // walletTokenBalance: TokenAmount.zero(reserve.decimals),
            depositNotePubkey,
            depositNoteBump,
            depositNoteExists: false,
            depositNoteBalance: TokenAmount.zero(reserve.decimals),
            depositBalance: TokenAmount.zero(reserve.decimals),
            depositNoteDestPubkey,
            depositNoteDestBump,
            depositNoteDestExists: false,
            depositNoteDestBalance: TokenAmount.zero(reserve.decimals),
            loanNotePubkey,
            loanNoteBump,
            loanNoteExists: false,
            loanNoteBalance: TokenAmount.zero(reserve.decimals),
            loanBalance: TokenAmount.zero(reserve.decimals),
            collateralNotePubkey: collateralPubkey,
            collateralNoteBump: collateralBump,
            collateralNoteExists: false,
            collateralNoteBalance: TokenAmount.zero(reserve.decimals),
            collateralBalance: TokenAmount.zero(reserve.decimals),
            maxDepositAmount: 0,
            maxWithdrawAmount: 0,
            maxBorrowAmount: 0,
            maxRepayAmount: 0
          };

          // Set user assets
          assetStore.tokens[assetAbbrev] = asset;
        }

        return assetStore;
      };
      // Get all asset pubkeys owned by wallet pubkey
      getAssetPubkeys().then(assetStore => {
        subscribeToAssets(assetStore);
      });
    } else {
      setWalletInit(false);
    }
  }, [connected, publicKey]);

  return (
    <UserContext.Provider
      value={{
        walletInit,
        setWalletInit,
        assets,
        setAssets,
        position,
        setPosition,
        collateralBalances,
        setCollateralBalances,
        loanBalances,
        setLoanBalances
      }}>
      {props.children}
    </UserContext.Provider>
  );
}

// User hook
export const useUser = () => {
  const context = useContext(UserContext);
  return context;
};
