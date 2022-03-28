import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnectWalletModal } from '../contexts/connectWalletModal';
import { useDarkTheme } from '../contexts/darkTheme';
import { shortenPubkey } from '../utils/utils';
import { Button, Switch } from 'antd';
import { ReactComponent as AccountIcon } from '../styles/icons/account_icon.svg';
import { ReactComponent as WalletIcon } from '../styles/icons/wallet_icon.svg';

export function Navbar(): JSX.Element {
  const { pathname } = useLocation();
  const { connected, disconnect, publicKey } = useWallet();
  const { setConnecting } = useConnectWalletModal();
  const { darkTheme, toggleDarkTheme } = useDarkTheme();
  const [drawerOpened, setDrawerOpened] = useState(false);
  const navLinks = [
    { title: 'Components', route: '/' },
    { title: 'Variables', route: '/variables' }
  ];
  const mobileFooterLinks = [{ title: 'Website', url: 'https://www.jetprotocol.io/' }];
  const accountLink = { title: 'Components', route: '/' };

  return (
    <div className={`navbar-container flex-centered ${drawerOpened ? 'drawer-open' : ''}`}>
      {/* Desktop Nav */}
      <nav className="desktop flex align-center justify-between">
        <Link className="logo flex-centered" to="/">
          <img src="img/jet/jet_full_white.png" width="100%" height="auto" alt="Jet Protocol" />
        </Link>
        <div className="nav-links flex-centered">
          {navLinks.map(link => (
            <Link key={link.title} to={link.route} className={`nav-link ${pathname === link.route ? 'active' : ''}`}>
              {link.title}
            </Link>
          ))}
          <Button
            ghost
            className="flex-centered"
            style={{ textTransform: 'unset' }}
            title={connected ? 'Disconnect Wallet' : 'Connect Wallet'}
            onClick={() => (connected ? disconnect() : setConnecting(true))}>
            <WalletIcon width="20px" />
            {connected ? `${shortenPubkey(publicKey ? publicKey.toString() : '')} CONNECTED` : 'CONNECT'}
          </Button>
        </div>
      </nav>
      {/* Mobile Nav */}
      <nav className="mobile flex align-center justify-between">
        <Link className="account" to={accountLink.route}>
          <AccountIcon width="25px" />
        </Link>
        <Link className="logo flex-centered" to="/">
          <img className="logo" src="img/jet/jet_full_white.png" width="100%" height="auto" alt="Jet Protocol" />
        </Link>
        <div
          className={`hamburger flex align-center justify-between column ${drawerOpened ? 'close' : ''}`}
          onClick={() => setDrawerOpened(!drawerOpened)}>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="drawer flex align-center justify-between column">
          <div className="drawer-top flex-centered column">
            {navLinks.map(link => (
              <Link
                key={link.title}
                to={link.route}
                className={`nav-link ${pathname === link.route ? 'active' : ''}`}
                onClick={() => setDrawerOpened(false)}>
                {link.title}
              </Link>
            ))}
            <Button
              ghost
              className="flex-centered small-btn"
              style={{ textTransform: 'unset' }}
              title={connected ? 'Disconnect Wallet' : 'Connect Wallet'}
              onClick={() => {
                if (connected) {
                  disconnect();
                } else {
                  setConnecting(true);
                  setDrawerOpened(false);
                }
              }}>
              <WalletIcon width="20px" />
              {connected ? `${shortenPubkey(publicKey ? publicKey.toString() : '')} CONNECTED` : 'CONNECT'}
            </Button>
          </div>
          <div className="drawer-bottom flex-centered column">
            {mobileFooterLinks.map(link => (
              <a key={link.title} href={link.url} className="footer-link" rel="noopener noreferrer" target="_blank">
                {link.title}
              </a>
            ))}
            <Switch
              className="secondary-switch"
              onClick={() => toggleDarkTheme()}
              checked={darkTheme}
              checkedChildren="Dark"
              unCheckedChildren="Light"
            />
          </div>
        </div>
      </nav>
    </div>
  );
}
