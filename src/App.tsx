import './styles/App.less';
import { useMemo } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { DarkThemeProvider } from './contexts/Settings/darkTheme';
import { LocalizationProvider } from './contexts/localization/localization';
import { WalletProvider } from '@solana/wallet-adapter-react';
import {
  getMathWallet,
  getPhantomWallet,
  getSolflareWallet,
  getSolletWallet,
  getSolongWallet,
  getSlopeWallet
} from '@solana/wallet-adapter-wallets';
import { ConnectWalletModalProvider } from './contexts/Modals/connectWalletModal';
import { SendingTransactionProvider } from './contexts/transactions/sendingTransaction';
import { NativeValuesProvider } from './contexts/BorrowView/nativeValues';
import { CopilotModalProvider } from './contexts/Modals/copilotModal';
import { RpcNodeContextProvider } from './contexts/Settings/rpcNode';
import { BlockExplorerProvider } from './contexts/Settings/blockExplorer';
import { ConnectWalletModal } from './components/Modals/ConnectWalletModal';
import { CopilotModal } from './components/Modals/CopilotModal';

import { TermsPrivacy } from './components/Misc/TermsPrivacy';
import { Navbar } from './components/Misc/Navbar';
import { NetworkBanner } from './components/Misc/NetworkBanner';
import { Disclaimer } from './components/Modals/DisclaimerModal';
import { BorrowView } from './views/BorrowView';

export function App(): JSX.Element {
  const wallets = useMemo(
    () => [
      getPhantomWallet(),
      getSolflareWallet(),
      getSolongWallet(),
      getMathWallet(),
      getSolletWallet(),
      getSlopeWallet()
    ],
    []
  );

  return (
    <HashRouter basename={'/'}>
      <DarkThemeProvider>
        <LocalizationProvider>
          <WalletProvider wallets={wallets} autoConnect>
            <ConnectWalletModalProvider>
              <RpcNodeContextProvider>
                <NativeValuesProvider>
                  <BlockExplorerProvider>
                    <SendingTransactionProvider>
                      <CopilotModalProvider>
                        <Navbar />
                        <Routes>
                          <Route path="/" element={<BorrowView />} />
                        </Routes>
                        <ConnectWalletModal />
                        <CopilotModal />
                        <NetworkBanner />
                        <Disclaimer />
                        <TermsPrivacy />
                      </CopilotModalProvider>
                    </SendingTransactionProvider>
                  </BlockExplorerProvider>
                </NativeValuesProvider>
              </RpcNodeContextProvider>
            </ConnectWalletModalProvider>
          </WalletProvider>
        </LocalizationProvider>
      </DarkThemeProvider>
    </HashRouter>
  );
}
