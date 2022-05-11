import { useEffect, useMemo, useState } from 'react';
import { Connection, ConfirmOptions } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { JetClient, JetMarket, JetReserve, JetUser, JET_MARKET_ADDRESS } from '@jet-lab/jet-engine';
import { useRpcNode } from '../../contexts/rpcNode';
import localnetIdl from './idl/localnet/jet.json';
import devnetIdl from './idl/devnet/jet.json';
import mainnetBetaIdl from './idl/mainnet-beta/jet.json';
import { BorshCoder } from '@project-serum/anchor';

export let idl: any;
export const cluster = process.env.REACT_APP_CLUSTER ?? 'devnet';
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

export function useConfirmOptions() {
  return confirmOptions;
}

export function useWalletAddress() {
  const wallet = useWallet();
  return wallet.publicKey;
}

export function useProvider() {
  const { preferredNode } = useRpcNode();
  const connection = useMemo(() => new Connection(preferredNode ?? idl.metadata.cluster, 'recent'), [preferredNode]);
  const wallet = useWallet();
  const confirmOptions = useConfirmOptions();

  const provider = useMemo(
    () => new anchor.Provider(connection, wallet as any, confirmOptions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [connection, confirmOptions]
  );
  (provider as any).wallet = wallet;
  return provider;
}

export function useProgram() {
  const provider = useProvider();
  anchor.setProvider(provider);
  return new anchor.Program(idl, idl.metadata.address, provider);
}

export function useClient() {
  const provider = useProvider();
  const [client, setClient] = useState<JetClient | undefined>();

  useEffect(() => {
    let abort = false;
    JetClient.connect(provider)
      .then(newClient => !abort && setClient(newClient))
      .catch(console.error);

    return () => {
      abort = true;
    };
  }, [provider]);

  return client;
}

export function useMarket() {
  const client = useClient();
  const [market, setMarket] = useState<JetMarket | undefined>();
  useEffect(() => {
    let abort = false;
    if (client) {
      JetMarket.load(client, JET_MARKET_ADDRESS)
        .then(newMarket => !abort && setMarket(newMarket))
        .catch(console.error);
    }

    return () => {
      abort = true;
    };
  }, [client]);

  return market;
}

export function useReserves() {
  const client = useClient();
  const market = useMarket();
  const [reserves, setReserves] = useState<JetReserve[]>([]);
  useEffect(() => {
    let abort = false;
    if (client && market) {
      JetReserve.loadMultiple(client, market).then(reserves => !abort && setReserves(reserves));
    }
    return () => {
      abort = true;
    };
  }, [client, market]);

  return reserves;
}

export function useUser() {
  const client = useClient();
  const market = useMarket();
  const reserves = useReserves();
  const walletAddress = useWalletAddress();
  const [user, setUser] = useState<JetUser | undefined>();

  useEffect(() => {
    let abort = false;
    if (client && market && walletAddress) {
      JetUser.load(client, market, reserves, walletAddress)
        .then(newUser => !abort && setUser(newUser))
        .catch(console.error);
    }

    return () => {
      abort = true;
    };
  }, [client, market, walletAddress]);

  return user;
}
