import '@dialectlabs/react-ui/lib/index.css';
import './styles/App.less';
import { useMemo } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { DarkThemeProvider } from './contexts/darkTheme';
import { LocalizationProvider } from './contexts/localization/localization';
import { WalletProvider } from '@solana/wallet-adapter-react';
import {
  PhantomWalletAdapter,
  MathWalletAdapter,
  SolflareWalletAdapter,
  SolongWalletAdapter,
  SolletWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { RpcNodeContextProvider } from './contexts/rpcNode';
import { BlockExplorerProvider } from './contexts/blockExplorer';
import { TransactionsProvider } from './contexts/transactionLogs';
import { TradeContextProvider } from './contexts/tradeContext';
import { NativeValuesProvider } from './contexts/nativeValues';
import { CopilotModalProvider } from './contexts/copilotModal';
import { ConnectWalletModalProvider } from './contexts/connectWalletModal';
import { RadarModalProvider } from './contexts/radarModal';
import { ConnectWalletModal } from './components/ConnectWalletModal';
import { CopilotModal } from './components/CopilotModal';
import { RadarModal } from './components/RadarModal';
import { TermsPrivacy } from './components/TermsPrivacy';
import { Navbar } from './components/Navbar';
import { NetworkWarningBanner } from './components/NetworkWarningBanner';
import { Cockpit } from './views/Cockpit';
import { TransactionLogs } from './views/TransactionLogs';
import { Settings } from './views/Settings';
import { GlobalNotification } from './components/GlobalNotification';

// Jet V1
import { UserContextProvider } from './v1/contexts/user';
import { MarketContextProvider } from './v1/contexts/market';

export function App(): JSX.Element {
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new MathWalletAdapter(),
      new SolflareWalletAdapter(),
      new SolongWalletAdapter(),
      new SolletWalletAdapter(),
      new SolletWalletAdapter()
    ],
    []
  );

  return (
    <HashRouter basename={'/'}>
      <LocalizationProvider>
        <MarketContextProvider>
          <WalletProvider wallets={wallets} autoConnect>
            <UserContextProvider>
              <ConnectWalletModalProvider>
                <RpcNodeContextProvider>
                  <BlockExplorerProvider>
                    <TransactionsProvider>
                      <TradeContextProvider>
                        <NativeValuesProvider>
                          <DarkThemeProvider>
                            <CopilotModalProvider>
                              <RadarModalProvider>
                                <Navbar />
                                <NetworkWarningBanner />
                                <GlobalNotification />
                                <Routes>
                                  <Route path="/" element={<Cockpit />} />
                                  <Route path="/transactions" element={<TransactionLogs />} />
                                  <Route path="/settings" element={<Settings />} />
                                </Routes>
                                <ConnectWalletModal />
                                <CopilotModal />
                                <RadarModal />
                                <TermsPrivacy />
                              </RadarModalProvider>
                            </CopilotModalProvider>
                          </DarkThemeProvider>
                        </NativeValuesProvider>
                      </TradeContextProvider>
                    </TransactionsProvider>
                  </BlockExplorerProvider>
                </RpcNodeContextProvider>
              </ConnectWalletModalProvider>
            </UserContextProvider>
          </WalletProvider>
        </MarketContextProvider>
      </LocalizationProvider>
    </HashRouter>
  );
}
