import { createContext, useContext, useEffect, useState } from 'react';
import type { Asset, AssetStore, Obligation, Reserve } from '../models/JetTypes';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { BN } from '@project-serum/anchor';
import { Token, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, NATIVE_MINT } from "@solana/spl-token";
import { findCollateralAddress, findDepositNoteAddress, findDepositNoteDestAddress, findLoanNoteAddress, findObligationAddress, getAccountInfoAndSubscribe, getTokenAccountAndSubscribe, parseObligationAccount, SOL_DECIMALS } from '../util/programUtil';
import { coder, useProvider, useProgram } from '../../hooks/jet-client/useClient';
import { TokenAmount } from '../util/tokens';
import { Market, useMarket } from './market';

// User context
export interface User {
  walletInit: boolean,
  setWalletInit: (init: boolean) => void,
  assets: AssetStore | null,
  setAssets: (assets: AssetStore) => void,
  position: Obligation,
  setPosition: (position: Obligation) => void,
  walletBalances: Record<string, number>,
  setWalletBalances: (walletBalances: Record<string, number>) => void,
  collateralBalances: Record<string, number>,
  setCollateralBalances: (collateralBalances: Record<string, number>) => void,
  loanBalances: Record<string, number>,
  setLoanBalances: (loanBalances: Record<string, number>) => void
};
const UserContext = createContext<User>({
  walletInit: false,
  setWalletInit: () => {},
  assets: {} as unknown as AssetStore,
  setAssets: () => {},
  position: {} as unknown as Obligation,
  setPosition: () => {},
  walletBalances: {},
  setWalletBalances: () => {},
  collateralBalances: {},
  setCollateralBalances: () => {},
  loanBalances: {},
  setLoanBalances: () => {}
});

// User context provider
export function UserContextProvider(props: { children: any }) {
  const { connected, publicKey } = useWallet();
  const { connection } = useProvider();
  const program = useProgram();
  const market = useMarket();
  const [walletInit, setWalletInit] = useState<boolean>(false);
  const [assets, setAssets] = useState<AssetStore>({
    sol: TokenAmount.zero(0),
    obligationBump: 0,
    obligationPubkey: {} as PublicKey,
    tokens: {
      'SOL': {} as Asset,
      'USDC': {} as Asset,
      'BTC': {} as Asset,
      'ETH': {} as Asset
    }
  });
  const [position, setPosition] = useState<Obligation>({} as unknown as Obligation);
  const [walletBalances, setWalletBalances] = useState<Record<string, number>>({'USDC': 0, 'SOL': 0, 'BTC': 0, 'ETH': 0});
  const [collateralBalances, setCollateralBalances] = useState<Record<string, number>>({'USDC': 0, 'SOL': 0, 'BTC': 0, 'ETH': 0});
  const [loanBalances, setLoanBalances] = useState<Record<string, number>>({'USDC': 0, 'SOL': 0, 'BTC': 0, 'ETH': 0});

  async function subscribeToAssets(assets: AssetStore) {
    let promise: Promise<number>;
    let promises: Promise<number>[] = [];
    if (!assets || !publicKey) {
      return;
    }
  
    // Obligation
    if (assets.obligationPubkey) {
      promise = getAccountInfoAndSubscribe(connection, assets.obligationPubkey, (account: any) => {
        if (account != null) {
          if (assets) {
            assets.obligation = {
              ...account,
              data: parseObligationAccount(account.data, coder),
            };
            setAssets({...assets});
          }
        }
      });
      promises.push(promise);
    }
  
    // Wallet native SOL balance
    promise = getAccountInfoAndSubscribe(connection, publicKey, (account: any) => {
      if (account != null) {
        if (assets) {
          const reserve = market.reserves["SOL"];
  
          // Need to be careful constructing a BN from a number.
          // If the user has more than 2^53 lamports it will throw for not having enough precision.
          assets.tokens.SOL.walletTokenBalance = new TokenAmount(new BN(account?.lamports.toString() ?? 0), SOL_DECIMALS);
          assets.sol = assets.tokens.SOL.walletTokenBalance;
          walletBalances.SOL = assets.sol.tokens;
          
          setWalletBalances(walletBalances);
          deriveValues(market, reserve, assets.tokens.SOL);
          setAssets({...assets});
        }
      }
    });
    promises.push(promise);
  
    for (const abbrev in assets.tokens) {
      const asset = assets.tokens[abbrev];
      const reserve = market.reserves[abbrev];
  
      // Wallet token account
      promise = getTokenAccountAndSubscribe(connection, asset.walletTokenPubkey, reserve.decimals, (amount: any) => {
        if (amount != null) {
          if (assets) {
            asset.walletTokenBalance = amount ?? new TokenAmount(new BN(0), reserve.decimals);
            asset.walletTokenExists = !!amount;
  
            // Update wallet token balance
            if (!asset.tokenMintPubkey.equals(NATIVE_MINT)) {
              walletBalances[reserve.abbrev] = asset.walletTokenBalance.tokens;
              setWalletBalances(walletBalances);
            }
  
            deriveValues(market, reserve, asset);
            setAssets({...assets});
          }
        }
      });
      promises.push(promise);
  
      // Reserve deposit notes
      promise = getTokenAccountAndSubscribe(connection, asset.depositNoteDestPubkey, reserve.decimals, (amount: any) => {
        if (amount != null) {
          if (assets) {
            asset.depositNoteDestBalance = amount ?? TokenAmount.zero(reserve.decimals);
            asset.depositNoteDestExists = !!amount;
            
            deriveValues(market, reserve, asset);
            setAssets({...assets});
          }
        }
      });
      promises.push(promise);
  
      // Deposit notes account
      promise = getTokenAccountAndSubscribe(connection, asset.depositNotePubkey, reserve.decimals, (amount: any) => {
        if (amount != null) {
          if (assets) {
            asset.depositNoteBalance = amount ?? TokenAmount.zero(reserve.decimals);
            asset.depositNoteExists = !!amount;
  
            deriveValues(market, reserve, asset);
            setAssets({...assets});
          }
        }
      });
      promises.push(promise);
  
      // Obligation loan notes
      promise = getTokenAccountAndSubscribe(connection, asset.loanNotePubkey, reserve.decimals, (amount: any) => {
        if (amount != null) {
          if (assets) {
            asset.loanNoteBalance = amount ?? TokenAmount.zero(reserve.decimals);
            asset.loanNoteExists = !!amount;
  
            deriveValues(market, reserve, asset);
            setAssets({...assets});
          }
        }
      });
      promises.push(promise);
  
      // Obligation collateral notes
      promise = getTokenAccountAndSubscribe(connection, asset.collateralNotePubkey, reserve.decimals, (amount :any) => {
        if (amount != null) {
          if (assets) {
            asset.collateralNoteBalance = amount ?? TokenAmount.zero(reserve.decimals);
            asset.collateralNoteExists = !!amount;
  
            deriveValues(market, reserve, asset);
            setAssets({...assets});
          }
        }
      });
      promises.push(promise);
    }

    return Promise.all(promises).then(() => setWalletInit(true));
  };

  // Derive user asset values, update global objects
  function deriveValues(market: Market, reserve: Reserve, asset: Asset) {
    asset.depositBalance = asset.depositNoteBalance.mulb(reserve.depositNoteExchangeRate).divb(new BN(Math.pow(10, 15)));
    asset.loanBalance = asset.loanNoteBalance.mulb(reserve.loanNoteExchangeRate).divb(new BN(Math.pow(10, 15)));
    asset.collateralBalance = asset.collateralNoteBalance.mulb(reserve.depositNoteExchangeRate).divb(new BN(Math.pow(10, 15)));

    // Update user obligation balances
    const userCollateralBalances = collateralBalances;
    const userLoanBalances = loanBalances;
    userCollateralBalances[reserve.abbrev] = asset.collateralBalance.tokens;
    userLoanBalances[reserve.abbrev] = asset.loanBalance.tokens;
    setCollateralBalances({...userCollateralBalances});
    setLoanBalances({...userLoanBalances});

    // Update user position object for UI
    const userPosition = {
      depositedValue: 0,
      borrowedValue: 0,
      colRatio: 0,
      utilizationRate: 0
    }

    //update user positions 
    for (let t in assets?.tokens) {
      userPosition.depositedValue += collateralBalances[t] * market.reserves[t].price;
      userPosition.borrowedValue += loanBalances[t] * market.reserves[t].price;
      userPosition.colRatio = userPosition.borrowedValue ? userPosition.depositedValue / userPosition.borrowedValue : 0;
      userPosition.utilizationRate = userPosition.depositedValue ? userPosition.borrowedValue / userPosition.depositedValue : 0;
    }
    setPosition({...userPosition});

    // Max deposit
    asset.maxDepositAmount = walletBalances[reserve.abbrev];

    // Max withdraw
    asset.maxWithdrawAmount = userPosition.borrowedValue
      ? (userPosition.depositedValue - (market.programMinColRatio * userPosition.borrowedValue)) / reserve.price
        : asset.collateralBalance.tokens;
    if (asset.maxWithdrawAmount > asset.collateralBalance.tokens) {
      asset.maxWithdrawAmount = asset.collateralBalance.tokens;
    }

    // Max borrow
    asset.maxBorrowAmount = ((userPosition.depositedValue / market.minColRatio) - userPosition.borrowedValue) / reserve.price;
    if (asset.maxBorrowAmount > reserve.availableLiquidity.tokens) {
      asset.maxBorrowAmount = reserve.availableLiquidity.tokens;
    }

    // Max repay
    if (walletBalances[reserve.abbrev] < asset.loanBalance.tokens) {
      asset.maxRepayAmount = walletBalances[reserve.abbrev];
    } else {
      asset.maxRepayAmount = asset.loanBalance.tokens;
    }

    if (assets) {
      assets.tokens[reserve.abbrev] = asset;
      setAssets({...assets});
    }
  };

  // When wallet connects, subscribe to assets
  useEffect(() => {
    if (connected && publicKey) {
      // Get user token accounts
      const getAssetPubkeys = async (): Promise<AssetStore> => {
        if (!Object.values(program) || !publicKey) {
          return {} as AssetStore;
        }

        let [obligationPubkey, obligationBump] = await findObligationAddress(program, market.accountPubkey, publicKey);
        let assetStore: AssetStore = {
          sol: new TokenAmount(new BN(0), SOL_DECIMALS),
          obligationPubkey,
          obligationBump,
          tokens: {}
        } as AssetStore;
        for (const assetAbbrev in market.reserves) {
          let reserve = market.reserves[assetAbbrev];
          let tokenMintPubkey = reserve.tokenMintPubkey;

          let [depositNoteDestPubkey, depositNoteDestBump] = await findDepositNoteDestAddress(program, reserve.accountPubkey, publicKey);
          let [depositNotePubkey, depositNoteBump] = await findDepositNoteAddress(program, reserve.accountPubkey, publicKey);
          let [loanNotePubkey, loanNoteBump] = await findLoanNoteAddress(program, reserve.accountPubkey, obligationPubkey, publicKey);
          let [collateralPubkey, collateralBump] = await findCollateralAddress(program, reserve.accountPubkey, obligationPubkey, publicKey);

          let asset: Asset = {
            tokenMintPubkey,
            walletTokenPubkey: await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, tokenMintPubkey, publicKey),
            walletTokenExists: false,
            walletTokenBalance: TokenAmount.zero(reserve.decimals),
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
      getAssetPubkeys().then((assetStore) => {
        subscribeToAssets(assetStore);
        setAssets({...assetStore});
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
        walletBalances,
        setWalletBalances,
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