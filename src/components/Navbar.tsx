import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnectWalletModal } from '../contexts/connectWalletModal';
import { useLanguage } from '../contexts/localization/localization';
import { useDarkTheme } from '../contexts/darkTheme';
import { shortenPubkey } from '../utils/utils';
import { Button, Switch } from 'antd';
import { ReactComponent as AccountIcon } from '../styles/icons/account_icon.svg';
import { ReactComponent as WalletIcon } from '../styles/icons/wallet_icon.svg';

import * as anchor from '@project-serum/anchor';
import { defaultVariables, IncomingThemeVariables, NotificationsButton } from '@dialectlabs/react-ui';

const DIALECT_PUBLIC_KEY = new anchor.web3.PublicKey('9dfi492rC6PhFVwg6sJLQYqSme4yTBZ9hdQvmQTCno6i');

export const themeVariables: IncomingThemeVariables = {
  dark: {
    bellButton:
      'w-10 h-10 shadow-xl shadow-neutral-800 border border-neutral-600 hover:shadow-neutral-700 bg-white text-black',
    modal: 'dialect-notfications', // 0.4 opacity based on trial-and-error
    textStyles: {
      body: 'bodyText',
      header: 'titleHeader'
    },
    header: 'header',
    scrollbar: 'scrollbar',
    divider: 'divider',
    section: 'section'
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

type ThemeType = 'light' | 'dark' | undefined;

export function Navbar(): JSX.Element {
  const { dictionary } = useLanguage();
  const { pathname } = useLocation();
  const wallet = useWallet();
  const { setConnecting } = useConnectWalletModal();
  const { darkTheme, toggleDarkTheme } = useDarkTheme();
  const [drawerOpened, setDrawerOpened] = useState(false);
  const navLinks = [
    { title: dictionary.cockpit.title, route: '/' },
    { title: dictionary.transactions.title, route: '/transactions' },
    { title: dictionary.settings.title, route: '/settings' }
  ];
  const mobileFooterLinks = [
    { title: dictionary.termsPrivacy.termsOfService, url: 'https://www.jetprotocol.io/legal/terms-of-service' },
    { title: dictionary.termsPrivacy.privacyPolicy, url: 'https://www.jetprotocol.io/legal/privacy-policy' },
    { title: dictionary.termsPrivacy.glossary, url: 'https://docs.jetprotocol.io/jet-protocol/terms-and-definitions' }
  ];
  const accountLink = { title: dictionary.account.title, route: '/' };

  const [theme, setTheme] = useState<ThemeType>('dark');

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
          <div style={{ position: 'relative' }}>
            <NotificationsButton
              wallet={wallet}
              network={'localnet'}
              publicKey={DIALECT_PUBLIC_KEY}
              theme={theme}
              variables={themeVariables}
              notifications={[{ name: 'Welcome message', detail: 'On thread creation' }]}
              channels={['web3', 'email', 'sms', 'telegram']}
            />
          </div>

          <Button
            ghost
            className="flex-centered"
            style={{ textTransform: 'unset' }}
            title={wallet.connected ? dictionary.settings.disconnect : dictionary.settings.connect}
            onClick={() => (wallet.connected ? wallet.disconnect() : setConnecting(true))}>
            <WalletIcon width="20px" />
            {wallet.connected
              ? `${shortenPubkey(
                  wallet.publicKey ? wallet.publicKey.toString() : ''
                )} ${dictionary.settings.connected.toUpperCase()}`
              : dictionary.settings.connect.toUpperCase()}
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
              title={wallet.connected ? dictionary.settings.disconnect : dictionary.settings.connect}
              onClick={() => {
                if (wallet.connected) {
                  wallet.disconnect();
                } else {
                  setConnecting(true);
                  setDrawerOpened(false);
                }
              }}>
              <WalletIcon width="20px" />
              {wallet.connected
                ? `${shortenPubkey(
                    wallet.publicKey ? wallet.publicKey.toString() : ''
                  )} ${dictionary.settings.connected.toUpperCase()}`
                : dictionary.settings.connect.toUpperCase()}
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
