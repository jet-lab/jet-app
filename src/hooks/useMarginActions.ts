import { TxnResponse } from '../models/JetTypes';
import { useMargin } from '../contexts/marginContext';
import { MarginPools, PoolTokenChange, TokenFormat } from '@jet-lab/margin';

export const useMarginActions = () => {
  const { pools, marginAccount, refresh } = useMargin();

  // Deposit
  const deposit = async (abbrev: MarginPools, change: PoolTokenChange): Promise<TxnResponse> => {
    if (!marginAccount || !pools) {
      console.log('Accounts not loaded', marginAccount, pools);
      throw new Error();
    }

    const pool = pools[abbrev];

    try {
      await pool.deposit({ marginAccount, change });
      await refresh();
      return TxnResponse.Success;
    } catch (err: any) {
      console.log(err);
      await refresh();
      return TxnResponse.Failed;
    }
  };

  // Withdraw
  const withdraw = async (abbrev: MarginPools, change: PoolTokenChange): Promise<TxnResponse> => {
    if (!marginAccount || !pools) {
      throw new Error();
    }

    const pool = pools[abbrev];

    try {
      await pool.withdraw({
        marginAccount,
        pools: Object.values(pools),
        change
      });
      await refresh();
      return TxnResponse.Success;
    } catch (err: any) {
      console.log(err);
      await refresh();
      return TxnResponse.Failed;
    }
  };

  // Borrow
  const borrow = async (abbrev: MarginPools, change: PoolTokenChange): Promise<TxnResponse> => {
    if (!marginAccount || !pools) {
      throw new Error();
    }

    const pool = pools[abbrev];
    try {
      await pool.marginBorrow({
        marginAccount,
        pools: Object.values(pools),
        change,
        destination: TokenFormat.unwrappedSol
      });
      await refresh();
      return TxnResponse.Success;
    } catch (err: any) {
      console.log(err);
      await refresh();
      return TxnResponse.Failed;
    }
  };

  // Repay
  const repay = async (abbrev: MarginPools, change: PoolTokenChange): Promise<TxnResponse> => {
    if (!marginAccount || !pools) {
      throw new Error();
    }

    const pool = pools[abbrev];

    try {
      await pool.marginRepay({
        marginAccount,
        pools: Object.values(pools),
        change,
        source: TokenFormat.unwrappedSol
      });
      await refresh();
      return TxnResponse.Success;
    } catch (err: any) {
      console.log(err);
      await refresh();
      return TxnResponse.Failed;
    }
  };

  return {
    deposit,
    withdraw,
    borrow,
    repay
  };
};
