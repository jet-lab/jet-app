import { BN } from '@project-serum/anchor';
import { TxnResponse } from '../models/JetTypes';
import { useUser } from '../contexts/user';
import { useMarket } from '../contexts/market';
import { useMargin } from './../../contexts/marginContext';
import { MarginTokens, PoolAmount } from '@jet-lab/margin';

export const useJetV1 = () => {
  // const { publicKey } = useWallet();
  const user = useUser();
  const market = useMarket();

  // Jet V2
  const { config, provider, programs, poolsFetched, pools, marginAccount, walletBalances, userFetched, refresh } =
    useMargin();

  // Deposit
  const deposit = async (abbrev: MarginTokens, lamports: BN): Promise<[res: TxnResponse, txid: string[]]> => {
    if (!marginAccount || !pools) {
      console.log('Accounts not loaded', marginAccount, pools);
      throw new Error();
    }

    console.log('Gt this far');

    const pool = pools[abbrev];
    const source = walletBalances[abbrev];
    const txids: string[] = [];

    try {
      if (!(await marginAccount.exists())) {
        const txid = await marginAccount.createAccount();
        txids.push(txid);
      }
      const txid = await marginAccount.deposit(pool, source.address, lamports);
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
  const withdraw = async (abbrev: MarginTokens, amount: PoolAmount): Promise<[res: TxnResponse, txid: string[]]> => {
    if (!marginAccount || !pools) {
      throw new Error();
    }

    const pool = pools[abbrev];
    const destination = walletBalances[abbrev];
    const txids: string[] = [];

    try {
      if (!(await marginAccount.exists())) {
        const txid = await marginAccount.createAccount();
        txids.push(txid);
      }
      const txid = await pool.marginWithdraw(marginAccount, destination.address, amount);
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
  const borrow = async (abbrev: MarginTokens, amount: BN): Promise<[res: TxnResponse, txid: string[]]> => {
    if (!marginAccount || !pools) {
      throw new Error();
    }

    const pool = pools[abbrev];
    const txids: string[] = [];

    try {
      if (!(await marginAccount.exists())) {
        const txid = await marginAccount.createAccount();
        txids.push(txid);
      }
      const txid = await pool.marginBorrow(marginAccount, amount);
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
  const repay = async (abbrev: MarginTokens, amount: PoolAmount): Promise<[res: TxnResponse, txid: string[]]> => {
    if (!marginAccount || !pools) {
      throw new Error();
    }

    const pool = pools[abbrev];
    const txids: string[] = [];

    try {
      if (!(await marginAccount.exists())) {
        const txid = await marginAccount.createAccount();
        txids.push(txid);
      }
      const txid = await pool.marginRepay(marginAccount, amount);
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
