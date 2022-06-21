import './styles/App.less';
import { useMemo } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
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
import { RpcNodeContextProvider } from './contexts/rpcNode';
import { BlockExplorerProvider } from './contexts/blockExplorer';
import { TransactionsProvider } from './contexts/transactionLogs';
import { TradeContextProvider } from './contexts/tradeContext';
import { NativeValuesProvider } from './contexts/nativeValues';
import { ConnectWalletModalProvider } from './contexts/connectWalletModal';
import { SettingsModalProvider } from './contexts/settingsModal';
import { RadarModalProvider } from './contexts/radarModal';
import { ConnectWalletModal } from './components/ConnectWalletModal';
import { Settings } from './views/Settings';
import { RadarModal } from './components/RadarModal';
import { TermsPrivacy } from './components/TermsPrivacy';
import { Navbar } from './components/Navbar';
import { NetworkWarningBanner } from './components/NetworkWarningBanner';
import { Cockpit } from './views/Cockpit';
import { TransactionLogs } from './views/TransactionLogs';

// Jet V1
import { UserContextProvider } from './v1/contexts/user';
import { MarketContextProvider } from './v1/contexts/market';
import { MarginContextProvider } from './contexts/marginContext';
import { QueryClient, QueryClientProvider } from 'react-query';

const queryClient = new QueryClient();
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
      <QueryClientProvider client={queryClient}>
        <LocalizationProvider>
          <WalletProvider wallets={wallets} autoConnect>
            <MarginContextProvider>
              <SettingsModalProvider>
                <MarketContextProvider>
                  <RpcNodeContextProvider>
                    <UserContextProvider>
                      <ConnectWalletModalProvider>
                        <BlockExplorerProvider>
                          <TransactionsProvider>
                            <TradeContextProvider>
                              <NativeValuesProvider>
                                <RadarModalProvider>
                                  <NetworkWarningBanner />
                                  <Navbar />
                                  <Routes>
                                    <Route path="/" element={<Cockpit />} />
                                    <Route path="/transactions" element={<TransactionLogs />} />
                                  </Routes>
                                  <ConnectWalletModal />
                                  <Settings />
                                  <RadarModal />
                                  <TermsPrivacy />
                                </RadarModalProvider>
                              </NativeValuesProvider>
                            </TradeContextProvider>
                          </TransactionsProvider>
                        </BlockExplorerProvider>
                      </ConnectWalletModalProvider>
                    </UserContextProvider>
                  </RpcNodeContextProvider>
                </MarketContextProvider>
              </SettingsModalProvider>
            </MarginContextProvider>
          </WalletProvider>
        </LocalizationProvider>
      </QueryClientProvider>
    </HashRouter>
  );
}
