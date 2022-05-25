import {
  MarginCluster,
  MarginConfig,
  MarginTokens,
  MarginAccount,
  MarginPool,
  AssociatedToken,
  MarginClient,
  MarginPrograms
} from '@jet-lab/margin';
import { useWallet } from '@solana/wallet-adapter-react';
import { createContext, useContext, useMemo } from 'react';
import { useQuery } from 'react-query';
import localnetIdl from '../hooks/jet-client/idl/localnet/jet.json';
import devnetIdl from '../hooks/jet-client/idl/devnet/jet.json';
import mainnetBetaIdl from '../hooks/jet-client/idl/mainnet-beta/jet.json';
import { AnchorProvider, BorshCoder } from '@project-serum/anchor';
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
  provider: AnchorProvider;
  config: MarginConfig;
  programs?: MarginPrograms;
  poolsFetched: boolean;
  pools: Record<MarginTokens, MarginPool> | undefined;
  userFetched: boolean;
  marginAccount: MarginAccount | undefined;
  walletBalances: Record<MarginTokens, AssociatedToken>;
}

const MarginContext = createContext<MarginContextState>({
  poolsFetched: false,
  userFetched: false
} as MarginContextState);

export const coder = new BorshCoder(idl);

const confirmOptions = {
  skipPreflight: true,
  commitment: 'recent',
  preflightCommitment: 'recent'
} as ConfirmOptions;

function useProvider() {
  const { preferredNode } = useRpcNode();
  const connection = useMemo(() => new Connection(preferredNode ?? idl.metadata.cluster, 'recent'), [preferredNode]);
  const wallet = useWallet();

  const provider = useMemo(
    () => new AnchorProvider(connection, wallet as any, confirmOptions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [connection, confirmOptions]
  );
  (provider as any).wallet = wallet;

  const programs = MarginClient.getPrograms(provider, config);
  return { programs, provider };
}

// Trade info context provider
export function MarginContextProvider(props: { children: JSX.Element }): JSX.Element {
  const { publicKey } = useWallet();

  const { provider, programs } = useProvider();
  const { connection } = provider;
  const endpoint = connection.rpcEndpoint;

  const { data: pools, isFetched: poolsFetched } = useQuery(
    ['pools', endpoint],
    async () => {
      if (!programs) {
        return;
      }
      console.log('Fetching pools');
      return await MarginPool.loadAll(programs);
    },
    { enabled: !!programs }
  );

  const { data: user, isFetched: userFetched } = useQuery(
    ['user', endpoint, publicKey?.toBase58()],
    async () => {
      if (!programs || !publicKey) {
        return;
      }
      console.log('Fetching user');
      const walletBalances = await MarginAccount.loadTokens(programs, publicKey);
      let marginAccount: MarginAccount | undefined;
      try {
        marginAccount = await MarginAccount.load(programs, provider, publicKey, 0);
      } catch {
        // nothing
      }
      return { marginAccount, walletBalances };
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
        poolsFetched,
        pools,
        userFetched,
        marginAccount: user?.marginAccount,
        walletBalances: user?.walletBalances ?? DEFAULT_WALLET_BALANCES
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