import { createContext, useContext, useEffect, useState } from 'react';
import { TokenAmount } from '@jet-lab/jet-engine';
import { ConfirmedSignatureInfo, TransactionResponse } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { BN } from '@project-serum/anchor';
import bs58 from 'bs58';
import { idl, useProvider } from '../hooks/jet-client/useClient';
import { useRpcNode } from './rpcNode';
import { useLanguage } from './localization/localization';
import { timeout } from '../utils/utils';

// Transaction logs context
interface TransactionLog extends TransactionResponse {
  blockDate: string;
  signature: string;
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
  addLog: async () => {},
  searchMoreLogs: () => {}
});

// Transaction logs context provider
export function TransactionsProvider(props: { children: any }) {
  const { dictionary } = useLanguage();
  const { connection } = useProvider();
  const { connected, publicKey } = useWallet();
  const { preferredNode } = useRpcNode();
  const [signatures, setSignatures] = useState<ConfirmedSignatureInfo[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logs, setLogs] = useState<TransactionLog[]>([]);
  const [noMoreSignatures, setNoMoreSignatures] = useState(false);

  // Get transaction details from a signature
  async function getLogDetail(log: TransactionLog, signature: string) {
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
    for (let msg of log.meta.logMessages) {
      if (msg.indexOf(idl.metadata.address) !== -1) {
        for (let progInst in instructionBytes) {
          for (let inst of log.transaction.message.instructions) {
            // Get first 8 bytes from data
            const txInstBytes = [];
            for (let i = 0; i < 8; i++) {
              txInstBytes.push(bs58.decode(inst.data)[i]);
            }
            // If those bytes match any of our instructions label trade action
            if (JSON.stringify(instructionBytes[progInst]) === JSON.stringify(txInstBytes)) {
              log.tradeAction = dictionary.transactions[progInst];
              // Determine asset and trade amount
              for (let pre of log.meta.preTokenBalances as any[]) {
                for (let post of log.meta.postTokenBalances as any[]) {
                  if (pre.mint === post.mint && pre.uiTokenAmount.amount !== post.uiTokenAmount.amount) {
                    for (let reserve of idl.metadata.reserves) {
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
                        log.tokenAbbrev = reserve.abbrev;
                        log.tokenDecimals = reserve.decimals;
                        log.tokenPrice = reserve.price;
                        log.tradeAmount = new TokenAmount(
                          new BN(post.uiTokenAmount.amount - pre.uiTokenAmount.amount),
                          reserve.decimals,
                          reserve.tokenMint
                        );
                      }
                    }
                  }
                }
              }
              // Signature
              log.signature = signature;
              // UI date
              log.blockDate = new Date(log.blockTime * 1000).toLocaleDateString();
              // If we found mint match, add tx to logs
              if (log.tokenAbbrev) {
                return log;
              }
            }
          }
        }
      }
    }
  }

  // Get transaction details for multiple signatures
  async function getDetailedLogs(sigs: ConfirmedSignatureInfo[]) {
    // Begin loading transaction logs
    setLoadingLogs(true);

    // Iterate through signatures to get detailed logs
    let index = logs.length ? logs.length + 1 : 0;
    let newLogs: TransactionLog[] = [];
    while (newLogs.length < 10) {
      // Get current signature from index
      const currentSignature = sigs[index]?.signature;
      if (!currentSignature) {
        return;
      }

      // Get confirmed transaction for signature
      const log = await connection.getTransaction(currentSignature, {
        commitment: 'confirmed'
      });
      const detailedLog = log ? await getLogDetail(log as TransactionLog, currentSignature) : null;
      if (detailedLog) {
        newLogs.push(detailedLog);
      }

      // Increment current index
      index++;

      // If we run out of signatures, break
      if (index >= sigs.length) {
        setNoMoreSignatures(true);
        break;
      }
    }

    // Add transaction logs and stop loading
    setLogs([...logs, ...newLogs]);
    setLoadingLogs(false);
  }

  // Add new transaction log upon completing a new trade
  async function addLog(signature: string) {
    const txLogs = logs;
    // Set logs to load
    setLoadingLogs(true);

    // Keep trying to get confirmed log (may take a few seconds for validation)
    let log: TransactionLog | null = null;
    while (!log) {
      log = (await connection.getTransaction(signature, {
        commitment: 'confirmed'
      })) as unknown as TransactionLog | null;
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
    }
  }, [connected, preferredNode]);

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
