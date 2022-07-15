import {
  DialectUiManagementProvider,
  DialectContextProvider,
  DialectThemeProvider,
  DialectWalletAdapter,
  Backend,
  Config
} from '@dialectlabs/react-ui';
import type { FC } from 'react';
import { useWallet, WalletContextState } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';
import { PublicKey } from '@solana/web3.js';
import { IncomingThemeVariables, defaultVariables } from '@dialectlabs/react-ui';

const DIALECT_PUBLIC_KEY = new PublicKey('AainXWecQt5TjGQgw5R6oLNu9zvvQcS1kkVbG9UQqaP8');
const dialectThemeVariables: IncomingThemeVariables = {
  light: {
    bellButton: `w-10 h-10 border border-neutral-600 bg-white text-black jet-transparent jet-shadow-none jet-text-primary jet-nav-icon`,
    modal: `${defaultVariables.light.modal} jet-modal-bg-custom sm:rounded-3xl shadow-xl shadow-neutral-900 sm:border border-[#ABABAB]/40`, // 0.4 opacity based on trial-and-error
    button: 'jet-button jet-bg-green jet-pd-05',
    secondaryButton: 'jet-bg-transparent jet-border-green jet-text-green',
    secondaryDangerButton: 'jet-bg-transparent jet-border-red jet-text-red jet-pd-05',
    disabledButton: 'jet-bg-green jet-opacity-75 jet-pd-05',
    divider: 'jet-divider',
    iconButton: 'jet-icon jet-text-primary',
    section: 'jet-bg-light-gray jet-pd-05 jet-br-rd-1',
    // body: 'jet-text-break',
    textStyles: {
      body: 'jet-text-break'
    },
    colors: {
      bg: 'jet-bg',
      secondary: 'jet-text-green',
      brand: 'jet-bg-green',
      errorBg: 'dt-bg-transparent',
      primary: 'jet-text-primary',
      accent: '',
      accentSolid: 'dt-text-[#5895B9]',
      highlight: 'dt-bg-subtle-day',
      highlightSolid: 'jet-bg',
      toggleBackgroundActive: 'jet-bg-green',
      toggleThumb: 'dt-bg-[#EEEEEE]'
    }
  },

  animations: {
    popup: {
      enter: 'transition-all duration-300 origin-top-right',
      enterFrom: 'opacity-0 scale-75',
      enterTo: 'opacity-100 scale-100',
      leave: 'transition-all duration-100 origin-top-right',
      leaveFrom: 'opacity-100 scale-100',
      leaveTo: 'opacity-0 scale-75'
    }
  }
};

// Dialect needs the connected wallet information from your wallet adapter, wrapping in a separate component for composition
export const DialectProviders: FC = ({ children }) => {
  const wallet = useWallet();

  //Function to convert WalletContextState to DialectWalletAdapter
  const convertWalletToDialectWallet = (
    wallet: WalletContextState
  ): DialectWalletAdapter => ({
    publicKey: wallet.publicKey!,
    connected:
      wallet.connected &&
      !wallet.connecting &&
      !wallet.disconnecting &&
      Boolean(wallet.publicKey),
    signMessage: wallet.signMessage,
    signTransaction: wallet.signTransaction,
    signAllTransactions: wallet.signAllTransactions,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    diffieHellman: wallet.wallet?.adapter?._wallet?.diffieHellman
      ? async (pubKey) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          return wallet.wallet?.adapter?._wallet?.diffieHellman(pubKey);
        }
      : undefined,
  });

  //Convert WalletContextState to DialectWalletAdapter
  const dialectWallet = useMemo(() => {
      return convertWalletToDialectWallet(wallet)
  }, [wallet]);

  // Basic configuration for dialect. Target mainnet-beta and dialect cloud production environment
  const dialectConfig = useMemo(
    (): Config => ({
      backends: [Backend.DialectCloud, Backend.Solana],
      environment: 'development',
    }),
    []
  );
  return (
    <DialectContextProvider config={dialectConfig} wallet={dialectWallet} dapp={DIALECT_PUBLIC_KEY}>
      <DialectThemeProvider theme="dark" variables={dialectThemeVariables} >
        <DialectUiManagementProvider>
          {children}
        </DialectUiManagementProvider>
      </DialectThemeProvider>
    </DialectContextProvider>
  );
}
