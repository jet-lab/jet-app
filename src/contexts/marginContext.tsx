import { MarginAccount, MarginClient, MarginCluster, MarginPool, MarginPrograms } from '@jet-lab/jet-engine';
import { createContext, useContext } from 'react';
import { useQuery } from 'react-query';
import { useProvider, useWalletAddress } from '../hooks/jet-client/useClient';

interface MarginContextState {
  programs?: MarginPrograms;
  poolsFetched: boolean;
  userFetched: boolean;
  pools?: {
    pool: MarginPool;
  };
  user?: {
    marginAccount: MarginAccount;
  };
}
const MarginContext = createContext<MarginContextState>({
  poolsFetched: false,
  userFetched: false
});

// Trade info context provider
export function MarginContextProvider(props: { children: JSX.Element }): JSX.Element {
  const walletAddress = useWalletAddress();
  const { connection } = useProvider();
  const endpoint = connection.rpcEndpoint;
  const provider = useProvider();

  const cluster = process.env.REACT_APP_CLUSTER as MarginCluster;

  const { data: programs } = useQuery(['programs'], async () => {
    const programs = await MarginClient.connect(provider, cluster);
    return programs;
  });

  const { data: pools, isFetched: isPoolsFetched } = useQuery(
    ['pools', endpoint],
    async () => {
      if (!programs) {
        return;
      }
      const config = MarginClient.getConfig(cluster);
      const btc = config.tokens.find(token => token.symbol === 'BTC');
      if (!btc) {
        return;
      }
      const pool = await MarginPool.load(programs.marginPool, btc.mint);
      return { pool };
    },
    { enabled: !!programs }
  );

  const { data: user, isFetched: isUserFetched } = useQuery(
    ['user', endpoint, walletAddress?.toBase58()],
    async () => {
      if (!programs || !walletAddress) {
        return;
      }
      let marginAccount: MarginAccount | undefined;
      try {
        marginAccount = await MarginAccount.load(programs.margin, walletAddress, 0);
      } catch {
        console.log('no margin account');
      }
      return { marginAccount };
    },
    { enabled: !!programs && !!pools && !!walletAddress }
  );

  return (
    <MarginContext.Provider
      value={{
        programs,
        poolsFetched: isPoolsFetched,
        pools,
        userFetched: isUserFetched,
        user: user?.marginAccount ? { marginAccount: user.marginAccount } : undefined
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
