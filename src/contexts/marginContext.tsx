import {
  JetClient,
  JetCluster,
  JetConfig,
  JetPrograms,
  JetTokens,
  MarginAccount,
  MarginPool
} from '@jet-lab/jet-engine';
import { useWallet } from '@solana/wallet-adapter-react';
import { createContext, useContext, useMemo } from 'react';
import { useQuery } from 'react-query';
import localnetIdl from '../hooks/jet-client/idl/localnet/jet.json';
import devnetIdl from '../hooks/jet-client/idl/devnet/jet.json';
import mainnetBetaIdl from '../hooks/jet-client/idl/mainnet-beta/jet.json';
import { BorshCoder, Provider } from '@project-serum/anchor';
import { ConfirmOptions, Connection } from '@solana/web3.js';
import { useRpcNode } from './rpcNode';

interface MarginContextState {
  connection: Connection;
  provider: Provider;
  config: JetConfig;
  programs?: JetPrograms;
  poolsFetched: boolean;
  pools: Record<JetTokens, MarginPool> | undefined;
  marginAccountFetched: boolean;
  marginAccount: MarginAccount | undefined;
}
const MarginContext = createContext<MarginContextState>({
  poolsFetched: false,
  marginAccountFetched: false
} as MarginContextState);

export let idl: any;
export const cluster = (process.env.REACT_APP_CLUSTER ?? 'devnet') as JetCluster;
if (cluster === 'localnet') {
  idl = localnetIdl;
} else if (cluster === 'mainnet-beta') {
  idl = mainnetBetaIdl;
} else {
  idl = devnetIdl;
}

export const coder = new BorshCoder(idl);

const confirmOptions = {
  skipPreflight: false,
  commitment: 'recent',
  preflightCommitment: 'recent'
} as ConfirmOptions;

function useProvider() {
  const { preferredNode } = useRpcNode();
  const connection = useMemo(() => new Connection(preferredNode ?? idl.metadata.cluster, 'recent'), [preferredNode]);
  const wallet = useWallet();

  const provider = useMemo(
    () => new Provider(connection, wallet as any, confirmOptions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [connection, confirmOptions]
  );
  (provider as any).wallet = wallet;
  return provider;
}

// Trade info context provider
export function MarginContextProvider(props: { children: JSX.Element }): JSX.Element {
  const { publicKey } = useWallet();

  const provider = useProvider();
  const { connection } = provider;
  const endpoint = connection.rpcEndpoint;

  const config = JetClient.getConfig(cluster);
  const { data: programs } = useQuery(['programs'], async () => {
    return await JetClient.connect(provider, config);
  });

  const { data: pools, isFetched: isPoolsFetched } = useQuery(
    ['pools', endpoint],
    async () => {
      if (!programs) {
        return;
      }
      return await MarginPool.loadAll(programs);
    },
    { enabled: !!programs }
  );

  const { data: marginAccount, isFetched: marginAccountFetched } = useQuery(
    ['user', endpoint, publicKey?.toBase58()],
    async () => {
      if (!programs || !publicKey) {
        return;
      }
      try {
        return await MarginAccount.load(programs.margin, publicKey, 0);
      } catch {
        console.log('no margin account');
      }
    },
    { enabled: !!programs && !!pools && !!publicKey }
  );

  return (
    <MarginContext.Provider
      value={{
        connection,
        provider,
        config,
        programs,
        poolsFetched: isPoolsFetched,
        pools,
        marginAccountFetched,
        marginAccount
      }}>
      {props.children}
    </MarginContext.Provider>
  );
}

// Trade info hook
export const useMargin = () => {
  const context = useContext(MarginContext);
  return context;
};
