import {
  DialectUiManagementProvider,
  DialectContextProvider,
  DialectThemeProvider,
  DialectWalletAdapter,
  Backend,
  Config
} from '@dialectlabs/react-ui';
// import type { FC } from 'react';
// import { useWallet, WalletContextState } from '@solana/wallet-adapter-react';
// import { useMemo } from 'react';

// // Dialect needs the connected wallet information from your wallet adapter, wrapping in a separate component for composition
// export const DialectProviders: FC = ({ children }) => {
//   const { wallets, select, connected, wallet, publicKey } = useWallet();

//   const convertWalletForDialect = (wallet: WalletContextState): DialectWalletAdapter => {
//     if(connected) {
//       return {
//         connected:true
//     }
//   };
//   // We need to create an adapter for Dialect to support any type of wallet
//   // `convertWalletForDialect` is a function that needs to be implemented to convert `WalletContextState` to `DialectWalletAdapter` type.
//   // Please navigate to any example in `examples` folder and find an example implementation there.
//   const dialectWallet = useMemo(() => convertWalletForDialect(wallet), [wallet]);

//   // Basic configuration for dialect. Target mainnet-beta and dialect cloud production environment
//   const dialectConfig = useMemo(
//     (): Config => ({
//       backends: [Backend.DialectCloud, Backend.Solana],
//       environment: 'production',
//     }),
//     []
//   );
//   return (
//     // We are missing some props for now, we will add them in the next step
//     <DialectContextProvider>
//       <DialectThemeProvider>
//         <DialectUiManagementProvider>
//           {children}
//         </DialectUiManagementProvider>
//       </DialectThemeProvider>
//     </DialectContextProvider>
//   );
// }
