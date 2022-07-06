import { BN } from '@project-serum/anchor';
import { TxnResponse } from '../models/JetTypes';
import { useMargin } from '../contexts/marginContext';
import { MarginPools, PoolAmount } from '@jet-lab/margin';

export const useMarginActions = () => {
  const { pools, marginAccount, walletBalances, refresh } = useMargin();

  // Deposit
  const deposit = async (abbrev: MarginPools, amount: BN): Promise<[res: TxnResponse, txid: string[]]> => {
    if (!marginAccount || !pools) {
      console.log('Accounts not loaded', marginAccount, pools);
      throw new Error();
    }

    const pool = pools[abbrev];
    const source = walletBalances[abbrev];
    const txids: string[] = [];

    try {
      if (!(await marginAccount.exists())) {
        const txid = await marginAccount.createAccount();
        txid && txids.push(txid);
      }
      const txid = await pool.deposit({ marginAccount, amount });
      txids.push(txid);
      refresh();
      return [TxnResponse.Success, txids];
    } catch (err: any) {
      console.log(err);
      refresh();
      return [TxnResponse.Failed, []];
    }
  };

  // Withdraw
  const withdraw = async (abbrev: MarginPools, amount: PoolAmount): Promise<[res: TxnResponse, txid: string[]]> => {
    if (!marginAccount || !pools) {
      throw new Error();
    }

    const pool = pools[abbrev];
    const destination = walletBalances[abbrev];
    const txids: string[] = [];

    try {
      if (!(await marginAccount.exists())) {
        const txid = await marginAccount.createAccount();
        txid && txids.push(txid);
      }
      const txid = await pool.marginWithdraw({
        marginAccount,
        pools: Object.values(pools),
        amount
      });
      txids.push(txid);
      refresh();
      return [TxnResponse.Success, txids];
    } catch (err: any) {
      console.log(err);
      refresh();
      return [TxnResponse.Failed, []];
    }
  };

  // Borrow
  const borrow = async (abbrev: MarginPools, amount: BN): Promise<[res: TxnResponse, txid: string[]]> => {
    if (!marginAccount || !pools) {
      throw new Error();
    }

    const pool = pools[abbrev];
    const txids: string[] = [];

    try {
      if (!(await marginAccount.exists())) {
        const txid = await marginAccount.createAccount();
        txid && txids.push(txid);
      }
      const txid = await pool.marginBorrow({
        marginAccount,
        pools: Object.values(pools),
        amount
      });
      txids.push(txid);
      refresh();
      return [TxnResponse.Success, txids];
    } catch (err: any) {
      console.log(err);
      refresh();
      return [TxnResponse.Failed, []];
    }
  };

  // Repay
  const repay = async (abbrev: MarginPools, amount: PoolAmount): Promise<[res: TxnResponse, txid: string[]]> => {
    if (!marginAccount || !pools) {
      throw new Error();
    }

    const pool = pools[abbrev];
    const txids: string[] = [];

    try {
      if (!(await marginAccount.exists())) {
        const txid = await marginAccount.createAccount();
        txid && txids.push(txid);
      }
      const txid = await pool.marginRepay({
        marginAccount,
        pools: Object.values(pools),
        amount
      });
      txids.push(txid);
      refresh();
      return [TxnResponse.Success, txids];
    } catch (err: any) {
      console.log(err);
      refresh();
      return [TxnResponse.Failed, []];
    }
  };

  return {
    deposit,
    withdraw,
    borrow,
    repay
  };
};
