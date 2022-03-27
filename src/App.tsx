import './styles/App.less';
import { useMemo } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { DarkThemeProvider } from './contexts/darkTheme';
import { WalletProvider } from '@solana/wallet-adapter-react';
import {
  getMathWallet,
  getPhantomWallet,
  getSolflareWallet,
  getSolletWallet,
  getSolongWallet,
  getSlopeWallet
} from '@solana/wallet-adapter-wallets';
import { ConnectWalletModalProvider } from './contexts/connectWalletModal';
import { ConnectWalletModal } from './components/ConnectWalletModal';
import { Navbar } from './components/Navbar';
import { Antd } from './views/Antd';

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
      <WalletProvider wallets={wallets} autoConnect>
        <ConnectWalletModalProvider>
          <DarkThemeProvider>
            <Navbar />
            <Routes>
              <Route path="/" element={<Antd />} />
            </Routes>
            <ConnectWalletModal />
          </DarkThemeProvider>
        </ConnectWalletModalProvider>
      </WalletProvider>
    </HashRouter>
  );
}
