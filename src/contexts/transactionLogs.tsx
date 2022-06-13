import { createContext, useContext, useEffect, useState } from 'react';
import { TokenAmount } from '@jet-lab/margin';
import { ConfirmedSignatureInfo, TransactionResponse } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { BN } from '@project-serum/anchor';
import bs58 from 'bs58';
import { idl, useMargin } from './marginContext';
import { useRpcNode } from './rpcNode';
import { useLanguage } from './localization/localization';
import { timeout } from '../utils/utils';

// Transaction logs context
interface TransactionLog {
  blockDate: string;
  time: string;
  signature: string;
  sigIndex: number; //signature index that we used to find this transaction
  tradeAction: string;
  tradeAmount: TokenAmount;
  tokenAbbrev: string;
  tokenDecimals: number;
  tokenPrice: number;
}

interface TransactionLogs {
  loadingLogs: boolean;
  logs: TransactionLog[];
  noMoreSignatures: boolean;
  addLog: (signature: string) => Promise<void>;
  searchMoreLogs: () => void;
}

const TransactionsContext = createContext<TransactionLogs>({
  loadingLogs: false,
  logs: [],
  noMoreSignatures: false,
  addLog: async () => null as unknown as void,
  searchMoreLogs: () => null
});

// Transaction logs context provider
export function TransactionsProvider(props: { children: JSX.Element }): JSX.Element {
  const { dictionary } = useLanguage();
  const { connection } = useMargin();
  const { connected, publicKey } = useWallet();
  const { preferredNode } = useRpcNode();
  const [signatures, setSignatures] = useState<ConfirmedSignatureInfo[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logs, setLogs] = useState<TransactionLog[]>([]);
  const [noMoreSignatures, setNoMoreSignatures] = useState(false);

  // Get transaction details from a signature
  async function getLogDetail(
    log: TransactionResponse,
    signature: string,
    sigIndex?: number
  ): Promise<TransactionLog | undefined> {
    if (!(log.meta?.logMessages && log.blockTime)) {
      return;
    }

    // Record of instructions to their first 8 bytes for transaction logs
    const instructionBytes: Record<string, number[]> = {
      deposit: [242, 35, 198, 137, 82, 225, 242, 182],
      withdraw: [183, 18, 70, 156, 148, 109, 161, 34],
      borrow: [228, 253, 131, 202, 207, 116, 89, 18],
      repay: [234, 103, 67, 82, 208, 234, 219, 166]
    };

    // Use log messages to only surface transactions that utilize Jet
    for (const msg of log.meta.logMessages) {
      if (msg.indexOf(idl.metadata.address) !== -1) {
        for (const progInst in instructionBytes) {
          for (const inst of log.transaction.message.instructions) {
            // Get first 8 bytes from data
            const txInstBytes = [];
            for (let i = 0; i < 8; i++) {
              txInstBytes.push(bs58.decode(inst.data)[i]);
            }
            const jetLog = {} as TransactionLog;
            // If those bytes match any of our instructions label trade action
            if (JSON.stringify(instructionBytes[progInst]) === JSON.stringify(txInstBytes)) {
              jetLog.tradeAction = dictionary.transactions[progInst];
              // Determine asset and trade amount
              for (const pre of log.meta.preTokenBalances as any[]) {
                for (const post of log.meta.postTokenBalances as any[]) {
                  if (pre.mint === post.mint && pre.uiTokenAmount.amount !== post.uiTokenAmount.amount) {
                    for (const reserve of idl.metadata.reserves) {
                      if (reserve.accounts.tokenMint === pre.mint) {
                        // For withdraw and borrow SOL,
                        // Skip last account (pre-token balance is 0)
                        if (
                          reserve.abbrev === 'SOL' &&
                          (progInst === 'withdraw' || progInst === 'borrow') &&
                          pre.uiTokenAmount.amount === '0'
                        ) {
                          break;
                        }
                        jetLog.tokenAbbrev = reserve.abbrev;
                        jetLog.tokenDecimals = reserve.decimals;
                        jetLog.tokenPrice = reserve.price;
                        jetLog.tradeAmount = new TokenAmount(
                          new BN(post.uiTokenAmount.amount - pre.uiTokenAmount.amount),
                          reserve.decimals
                        );
                      }
                    }
                  }
                }
              }
              // Signature
              jetLog.signature = signature;

              const dateTime = new Date(log.blockTime * 1000);
              // UI date
              jetLog.blockDate = dateTime.toLocaleDateString();
              //UI time
              jetLog.time = dateTime.toLocaleTimeString('en-US', { hour12: false });
              //add signature index that we have iterated over
              jetLog.sigIndex = sigIndex ? sigIndex : 0;
              // If we found mint match, add tx to logs
              if (jetLog.tokenAbbrev) {
                return jetLog;
              }
            }
          }
        }
      }
    }
    return;
  }

  // Get transaction details for multiple signatures
  async function getDetailedLogs(sigs: ConfirmedSignatureInfo[]) {
    // Begin loading transaction logs
    setLoadingLogs(true);

    //At which index of the signature array do we want to start finding more Jet transactions
    let sigIndex = logs.length ? logs[logs.length - 1].sigIndex + 1 : 0;
    const newLogs: TransactionLog[] = [];

    // Iterate through signatures to find Jet transactions up to 10 transactions
    while (newLogs.length < 10) {
      // Get current signature string using signatures index
      const currentSignature = sigs[sigIndex]?.signature;
      if (!currentSignature) {
        return;
      }

      // Get confirmed transaction response
      const log = await connection.getTransaction(currentSignature, {
        commitment: 'confirmed'
      });

      //If it's a Jet transaction, make a TransactionLog
      const detailedLog = log ? await getLogDetail(log, currentSignature, sigIndex) : null;

      if (detailedLog) {
        newLogs.push(detailedLog);
      }

      // Increment current signature index
      sigIndex++;

      // If we run out of signatures, break
      if (sigIndex >= sigs.length) {
        setNoMoreSignatures(true);
        break;
      }
    }

    // Add transaction logs if there are new ones to add
    if (newLogs.length > 0) {
      setLogs([...logs, ...newLogs]);
    }

    setLoadingLogs(false);
  }

  // Add new transaction log upon completing a new trade
  async function addLog(signature: string) {
    const txLogs = logs;
    // Set logs to load
    setLoadingLogs(true);

    // Keep trying to get confirmed log (may take a few seconds for validation)
    let log = null;
    while (!log) {
      log = await connection.getTransaction(signature, {
        commitment: 'confirmed'
      });
      timeout(2000);
    }

    // Get UI details and add to logs store
    const logDetail = await getLogDetail(log, signature);
    if (logDetail) {
      txLogs.unshift(logDetail);
      setLogs(txLogs);
    }

    setLoadingLogs(false);
  }

  // Once we have a pubkey for user's wallet, init their logs
  // Call reset on any new pubkey or rpc node change
  useEffect(() => {
    setLogs([]);
    if (publicKey) {
      connection.getSignaturesForAddress(publicKey, undefined, 'confirmed').then(signatures => {
        setSignatures(signatures);
        getDetailedLogs(signatures);
      });
    } else {
      setLoadingLogs(false);
    }
  }, [connected, publicKey, preferredNode]);

  return (
    <TransactionsContext.Provider
      value={{
        loadingLogs,
        logs,
        noMoreSignatures,
        addLog,
        searchMoreLogs: () => getDetailedLogs(signatures)
      }}>
      {props.children}
    </TransactionsContext.Provider>
  );
}

// Transaction logs hook
export const useTransactionLogs = () => {
  const context = useContext(TransactionsContext);
  return context;
};
