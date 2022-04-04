import { useMemo } from 'react';
import { Connection, ConfirmOptions, PublicKey } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRpcNode } from '../../contexts/Settings/rpcNode';
import { ReserveData } from '@jet-lab/jet-engine';

export const cluster = process.env.REACT_APP_CLUSTER ?? 'devnet';

const confirmOptions = {
  skipPreflight: false,
  commitment: 'recent',
  preflightCommitment: 'recent'
} as ConfirmOptions;

export function useProvider() {
  const { preferredNode } = useRpcNode();
  // TODO: use IDL cluster instead of devnet endpoint
  const connection = useMemo(() => new Connection(preferredNode ?? 'https://api.devnet.solana.com/', 'recent'), [preferredNode]);
  const wallet = useWallet();
  const options = confirmOptions;

  return useMemo(
    () => new anchor.Provider(connection, wallet as any, options),
    [connection, wallet, options]
  );
}

// TODO: use real market data from engine
export const market = {
  minColRatio: 1.25,
  marketInit: false,
  accountPubkey: {} as PublicKey,
  account: {},
  authorityPubkey: {} as PublicKey,
  totalBorrowed: 0,
  totalSupply: 0,
  reserves: {
    "USDC": {
      "name": "USDC",
      "abbrev": "USDC",
      "marketSize": {
        "tokens": 66077822.213027
      },
      "outstandingDebt": {
        "tokens": 66076335.874655
      },
      "utilizationRate": 0.9999775062445732,
      "depositApy": 1.5994241720043296,
      "borrowApr": 1.6154547509587858,
      "maximumLTV": 12500,
      "liquidationPremium": 300,
      "priceData": {
        "price": 1.0000005
      },
      "decimals": 6,
      "availableLiquidity": {
        "tokens": 1486.338372
      }
    } as unknown as ReserveData,
    "SOL": {
      "name": "Solana",
      "abbrev": "SOL",
      "marketSize": {
        "tokens": 13458.573673701
      },
      "outstandingDebt": {
        "tokens": 13317.912157718
      },
      "utilizationRate": 0.9895485569724329,
      "depositApy": 1.3350646423668873,
      "borrowApr": 1.3626570207202904,
      "maximumLTV": 12500,
      "liquidationPremium": 300,
      "priceData": {
        "price": 182.842
      },
      "decimals": 9,
      "availableLiquidity": {
        "tokens": 140.661515983
      }
    } as unknown as ReserveData,
    "BTC": {
      "name": "Bitcoin",
      "abbrev": "BTC",
      "marketSize": {
        "tokens": 211726.479395
      },
      "outstandingDebt": {
        "tokens": 4348.715231
      },
      "utilizationRate": 0.020539307333812384,
      "depositApy": 0.00012999356374718423,
      "borrowApr": 0.006392304143985678,
      "maximumLTV": 12500,
      "liquidationPremium": 300,
      "priceData": {
        "price": 64614.16
      },
      "decimals": 6,
      "availableLiquidity": {
        "tokens": 207377.764164
      }
    } as unknown as ReserveData,
    "ETH": {
      "name": "Ether",
      "abbrev": "ETH",
      "marketSize": {
        "tokens": 945244.55233
      },
      "outstandingDebt": {
        "tokens": 221395.291394
      },
      "utilizationRate": 0.23422011885523925,
      "depositApy": 0.004720804740406704,
      "borrowApr": 0.020356973649827345,
      "maximumLTV": 12500,
      "liquidationPremium": 300,
      "priceData": {
        "price": 4164.2495
      },
      "decimals": 6,
      "availableLiquidity": {
        "tokens": 723849.260936
      }
    } as unknown as ReserveData
  }
}

// TODO: use real user data from engine
export const user = {
  walletInit: true,
  assets: {
    tokens: {
      "USDC": {
        "maxDepositAmount": 400,
        "maxWithdrawAmount": 0,
        "maxBorrowAmount": 1486.338372,
        "maxRepayAmount": 20.724931
      } as Record<string, number>,
      "SOL": {
        "maxDepositAmount": 2.443795453,
        "maxWithdrawAmount": 3.180912896,
        "maxBorrowAmount": 141.762474821,
        "maxRepayAmount": 0
      } as Record<string, number>,
      "BTC": {
        "maxDepositAmount": 75.013099,
        "maxWithdrawAmount": 25.033109,
        "maxBorrowAmount": 20.13231222072027,
        "maxRepayAmount": 0
      } as Record<string, number>,
      "ETH": {
        "maxDepositAmount": 75.013099,
        "maxWithdrawAmount": 25.033109,
        "maxBorrowAmount": 20.13231222072027,
        "maxRepayAmount": 0
      } as Record<string, number>
    } as Record<string, any>,
  },
  "position": {
    "depositedValue": 104825.71611242593,
    "borrowedValue": 24.601790962465504,
    "colRatio": 4260.897764408965,
    "utilizationRate": 0.00023469232431553344
  } as Record<string, number>,
  "walletBalances": {
    "USDC": 400,
    "SOL": 2.443795453,
    "BTC": 0.000059,
    "ETH": 75.013099
  } as Record<string, number>,
  "collateralBalances": {
    "USDC": 0,
    "SOL": 3.180912896,
    "BTC": 0,
    "ETH": 25.033109
  } as Record<string, number>,
  "loanBalances": {
    "USDC": 20.724931,
    "SOL": 0,
    "BTC": 0.00006,
    "ETH": 0
  } as Record<string, number>
}