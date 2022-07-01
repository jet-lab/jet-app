import { createContext, useContext, useEffect, useState } from 'react';
import { TokenAmount, MarginClient } from '@jet-lab/margin';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { useMargin } from './marginContext';
import { useRpcNode } from './rpcNode';

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
}

interface TransactionLogs {
  loadingLogs: boolean;
  logs: TransactionLog[];
  refreshLogs: () => void;
}

const TransactionsContext = createContext<TransactionLogs>({
  loadingLogs: false,
  logs: [],
  refreshLogs: async () => {}
});

// Transaction logs context provider
export function TransactionsProvider(props: { children: JSX.Element }): JSX.Element {
  const { pools, manager, cluster, poolsFetched, userFetched } = useMargin();
  const { connected, publicKey } = useWallet();
  const { preferredNode } = useRpcNode();
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logs, setLogs] = useState<TransactionLog[]>([]);

  const loadLogs = () => {
    if (pools && publicKey) {
      setLoadingLogs(true);
      const mints = Object.entries(pools).reduce((acc, [pool, poolInfo]) => {
        acc[pool] = {
          tokenMint: poolInfo.addresses.tokenMint,
          depositNoteMint: poolInfo.addresses.depositNoteMint,
          loanNoteMint: poolInfo.addresses.loanNoteMint
        };
        return acc;
      }, {} as Record<string, { tokenMint: PublicKey; depositNoteMint: PublicKey; loanNoteMint: PublicKey }>);
      MarginClient.getFlightLogs(manager.provider, publicKey, mints, cluster).then(logs => {
        setLoadingLogs(false);
        setLogs(logs.filter(tx => tx.status !== 'error'));
      });
    }
  };

  // Once we have a pubkey for user's wallet, init their logs
  // Call reset on any new pubkey or rpc node change
  useEffect(() => {
    setLogs([]);
    if (publicKey && poolsFetched && userFetched && pools) {
      loadLogs();
    } else {
      setLoadingLogs(false);
    }
  }, [connected, publicKey, preferredNode, poolsFetched, userFetched]);

  return (
    <TransactionsContext.Provider
      value={{
        loadingLogs,
        logs,
        refreshLogs: () => loadLogs()
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
