import { BN } from '@project-serum/anchor';
import { TxnResponse } from '../models/JetTypes';
import { useMargin } from '../contexts/marginContext';
import { MarginPools, PoolAmount } from '@jet-lab/margin';

export const useMarginActions = () => {
  const { pools, marginAccount, refresh } = useMargin();

  // Deposit
  const deposit = async (abbrev: MarginPools, amount: BN): Promise<TxnResponse> => {
    if (!marginAccount || !pools) {
      console.log('Accounts not loaded', marginAccount, pools);
      throw new Error();
    }

    const pool = pools[abbrev];

    try {
      await pool.deposit({ marginAccount, amount });
      refresh();
      return TxnResponse.Success;
    } catch (err: any) {
      console.log(err);
      refresh();
      return TxnResponse.Failed;
    }
  };

  // Withdraw
  const withdraw = async (abbrev: MarginPools, amount: PoolAmount): Promise<TxnResponse> => {
    if (!marginAccount || !pools) {
      throw new Error();
    }

    const pool = pools[abbrev];

    try {
      await pool.withdraw({
        marginAccount,
        pools: Object.values(pools),
        amount
      });
      refresh();
      return TxnResponse.Success;
    } catch (err: any) {
      console.log(err);
      refresh();
      return TxnResponse.Failed;
    }
  };

  // Borrow
  const borrow = async (abbrev: MarginPools, amount: BN): Promise<TxnResponse> => {
    if (!marginAccount || !pools) {
      throw new Error();
    }

    const pool = pools[abbrev];
    try {
      await pool.marginBorrow({
        marginAccount,
        pools: Object.values(pools),
        amount
      });
      refresh();
      return TxnResponse.Success;
    } catch (err: any) {
      console.log(err);
      refresh();
      return TxnResponse.Failed;
    }
  };

  // Repay
  const repay = async (abbrev: MarginPools, amount: PoolAmount): Promise<TxnResponse> => {
    if (!marginAccount || !pools) {
      throw new Error();
    }

    const pool = pools[abbrev];

    try {
      await pool.marginRepay({
        marginAccount,
        pools: Object.values(pools),
        amount
      });
      refresh();
      return TxnResponse.Success;
    } catch (err: any) {
      console.log(err);
      refresh();
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
