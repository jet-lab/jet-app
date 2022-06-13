import {
  MarginCluster,
  MarginConfig,
  MarginTokens,
  MarginAccount,
  Pool,
  PoolManager,
  AssociatedToken,
  MarginClient
} from '@jet-lab/margin';
import { useWallet } from '@solana/wallet-adapter-react';
import { createContext, useContext, useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import localnetIdl from '../hooks/jet-client/idl/localnet/jet.json';
import devnetIdl from '../hooks/jet-client/idl/devnet/jet.json';
import mainnetBetaIdl from '../hooks/jet-client/idl/mainnet-beta/jet.json';
import { AnchorProvider } from '@project-serum/anchor';
import { ConfirmOptions, Connection, PublicKey } from '@solana/web3.js';
import { useRpcNode } from './rpcNode';

export let idl: any;
export const cluster = (process.env.REACT_APP_CLUSTER ?? 'devnet') as MarginCluster;
const config = MarginClient.getConfig(cluster);
if (cluster === 'localnet') {
  idl = localnetIdl;
} else if (cluster === 'mainnet-beta') {
  idl = mainnetBetaIdl;
} else {
  idl = devnetIdl;
}
const DEFAULT_WALLET_BALANCES = Object.fromEntries(
  Object.values(config.tokens).map(token => [token.symbol, AssociatedToken.zeroAux(PublicKey.default, token.decimals)])
) as Record<MarginTokens, AssociatedToken>;

interface MarginContextState {
  connection: Connection;
  manager: PoolManager;
  config: MarginConfig;
  poolsFetched: boolean;
  pools: Record<MarginTokens, Pool> | undefined;
  userFetched: boolean;
  marginAccount: MarginAccount | undefined;
  walletBalances: Record<MarginTokens, AssociatedToken>;
  refresh: () => void;
}

const MarginContext = createContext<MarginContextState>({
  poolsFetched: false,
  userFetched: false
} as MarginContextState);

const confirmOptions = {
  skipPreflight: true,
  commitment: 'recent',
  preflightCommitment: 'recent'
} as ConfirmOptions;

function useProvider() {
  const { preferredNode } = useRpcNode();
  const connection = useMemo(() => new Connection(preferredNode ?? config.url, 'recent'), [preferredNode]);
  const wallet = useWallet();

  const provider = useMemo(
    () => new AnchorProvider(connection, wallet as any, confirmOptions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [connection, confirmOptions]
  );
  (provider as any).wallet = wallet;

  const programs = MarginClient.getPrograms(provider, config);
  const manager = new PoolManager(programs, provider);
  return { manager };
}

// Trade info context provider
export function MarginContextProvider(props: { children: JSX.Element }): JSX.Element {
  const queryClient = useQueryClient();
  const { publicKey } = useWallet();

  const { manager } = useProvider();
  const { connection } = manager.provider;
  const endpoint = connection.rpcEndpoint;

  const { data: pools, isFetched: poolsFetched } = useQuery(
    ['pools', endpoint],
    async () => {
      return await manager.loadAll();
    },
    { enabled: !!manager.programs }
  );

  const { data: user, isFetched: userFetched } = useQuery(
    ['user', endpoint, publicKey?.toBase58()],
    async () => {
      if (!publicKey) return;
      const walletBalances = (await MarginAccount.loadTokens(manager.programs, publicKey)) as unknown as Record<
        MarginTokens,
        AssociatedToken
      >;
      let marginAccount: MarginAccount | undefined;
      try {
        marginAccount = await MarginAccount.load({
          programs: manager.programs,
          provider: manager.provider,
          owner: publicKey,
          seed: 0
        });
      } catch {
        // nothing
      }
      return { marginAccount, walletBalances };
    },
    { enabled: !!manager.programs && !!pools && !!publicKey }
  );

  function refresh() {
    setTimeout(() => {
      queryClient.invalidateQueries('user');
      queryClient.invalidateQueries('pools');
    }, 2000);
  }

  return (
    <MarginContext.Provider
      value={{
        connection,
        manager,
        config,
        poolsFetched,
        pools,
        userFetched,
        marginAccount: user?.marginAccount,
        walletBalances: user?.walletBalances ?? DEFAULT_WALLET_BALANCES,
        refresh
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
