import './styles/App.less';
import '@dialectlabs/react-ui/lib/index.css';
import { useMemo } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { LocalizationProvider } from './contexts/localization/localization';
import { WalletProvider } from '@solana/wallet-adapter-react';
import {
  PhantomWalletAdapter,
  MathWalletAdapter,
  SolflareWalletAdapter,
  SolongWalletAdapter,
  SolletWalletAdapter,
  SlopeWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { MarginContextProvider } from './contexts/marginContext';
import { RpcNodeContextProvider } from './contexts/rpcNode';
import { BlockExplorerProvider } from './contexts/blockExplorer';
import { TransactionsProvider } from './contexts/transactionLogs';
import { TradeContextProvider } from './contexts/tradeContext';
import { NativeValuesProvider } from './contexts/nativeValues';
import { ConnectWalletModalProvider } from './contexts/connectWalletModal';
import { LiquidationModalProvider } from './contexts/LiquidationModal';
import { SettingsModalProvider } from './contexts/settingsModal';
import { RadarModalProvider } from './contexts/radarModal';
import { ConnectWalletModal } from './components/ConnectWalletModal';
import { Settings } from './views/Settings';
import { RadarModal } from './components/RadarModal';
import { DisclaimerModal } from './components/DisclaimerModal';
import { TermsPrivacy } from './components/TermsPrivacy';
import { Navbar } from './components/Navbar';
import { NetworkWarningBanner } from './components/NetworkWarningBanner';
import { Cockpit } from './views/Cockpit';
import { TransactionLogs } from './views/TransactionLogs';
import { DialectProviders } from './contexts/dialectContext';
import { LiquidationModal } from './components/LiquidationModal';

const queryClient = new QueryClient();
export function App(): JSX.Element {
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new MathWalletAdapter(),
      new SolflareWalletAdapter(),
      new SolongWalletAdapter(),
      new SolletWalletAdapter(),
      new SlopeWalletAdapter()
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
                <RpcNodeContextProvider>
                  <ConnectWalletModalProvider>
                    <DialectProviders>
                      <LiquidationModalProvider>
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
                                  <DisclaimerModal />
                                  <LiquidationModal />
                                  <TermsPrivacy />
                                </RadarModalProvider>
                              </NativeValuesProvider>
                            </TradeContextProvider>
                          </TransactionsProvider>
                        </BlockExplorerProvider>
                      </LiquidationModalProvider>
                    </DialectProviders>
                  </ConnectWalletModalProvider>
                </RpcNodeContextProvider>
              </SettingsModalProvider>
            </MarginContextProvider>
          </WalletProvider>
        </LocalizationProvider>
      </QueryClientProvider>
    </HashRouter>
  );
}
