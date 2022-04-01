import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useDarkTheme } from '../contexts/darkTheme';
import { useLanguage, uiDictionary } from '../contexts/localization/localization';
import { useConnectWalletModal } from '../contexts/connectWalletModal';
import { useRpcNode } from '../contexts/rpcNode';
import { useBlockExplorer } from '../contexts/blockExplorer';
import { shortenPubkey, isValidHttpUrl } from '../utils/utils';
import { Button, Select, Switch, Divider } from 'antd';
import { JetInput } from '../components/JetInput';
import { ReactComponent as WalletIcon } from '../styles/icons/wallet_icon.svg';

export function Settings(): JSX.Element {
  const { dictionary, language, changeLanguage } = useLanguage();
  const { darkTheme, toggleDarkTheme } = useDarkTheme();
  const { preferredNode, ping, updateRpcNode } = useRpcNode();
  const { blockExplorers, preferredExplorer, changePreferredExplorer } = useBlockExplorer();
  const { connected, wallet, publicKey, disconnect } = useWallet();
  const { setConnecting } = useConnectWalletModal();
  const { Option } = Select;

  // RPC node input checking
  const [rpcNodeInput, setRpcNodeInput] = useState<string>('');
  const [rpcInputError, setRpcInputError] = useState<string>('');
  function checkRPC() {
    if (!rpcNodeInput || !isValidHttpUrl(rpcNodeInput)) {
      setRpcNodeInput('');
      setRpcInputError(dictionary.settings.noUrl);
      return;
    }

    setRpcInputError('');
    setRpcNodeInput('');
    updateRpcNode(rpcNodeInput);
  }

  return (
    <div className="view flex justify-center column">
      <div className="settings">
        <div className="setting flex align-start justify-center column">
          <span className="setting-title bold-text">{dictionary.settings.rpcNode.toUpperCase()}</span>
          <div className="rpc-info flex align-center justify-start" style={{ padding: 'var(--spacing-xs) 0' }}>
            <span>{preferredNode ?? dictionary.settings.defaultNode}</span>
            {ping > 0 && (
              <>
                <div
                  className="ping-indicator"
                  style={{
                    background: ping < 1000 ? 'var(--success)' : 'var(--failure)'
                  }}></div>
                <span className={ping < 1000 ? 'success-text' : 'danger-text'}>({ping}ms)</span>
              </>
            )}
            {preferredNode && (
              <span className="reset-rpc gradient-text semi-bold-text" onClick={() => updateRpcNode()}>
                {dictionary.settings.reset.toUpperCase()}
              </span>
            )}
          </div>
          <JetInput
            type="text"
            value={rpcNodeInput || ''}
            error={rpcInputError}
            placeholder="ex: https://api.devnet.solana.com/"
            onClick={() => setRpcInputError('')}
            onChange={(value: string) => setRpcNodeInput(value.toString())}
            submit={checkRPC}
          />
        </div>
        <Divider />
        <div className="setting wallet flex align-start justify-center column">
          <span className="setting-title bold-text">{dictionary.settings.wallet.toUpperCase()}</span>
          {wallet && connected && publicKey ? (
            <div className="flex-centered">
              <img
                width="20px"
                height="auto"
                src={`img/wallets/${wallet.name.replace(' ', '_').toLowerCase()}.png`}
                alt={`${wallet.name} Logo`}
              />
              <span className="wallet-address">{shortenPubkey(publicKey.toString(), 4)}</span>
              <Button ghost size="small" onClick={() => disconnect()}>
                {dictionary.settings.disconnect}
              </Button>
            </div>
          ) : (
            <div>
              <Button ghost className="flex-centered small-btn" onClick={() => setConnecting(true)}>
                <WalletIcon width="17px" />
                {dictionary.settings.connect}
              </Button>
            </div>
          )}
        </div>
        <Divider />
        <div className="setting flex align-start justify-center column">
          <span className="setting-title bold-text">{dictionary.settings.theme.toUpperCase()}</span>
          <div className="theme-toggle-container flex align-center justify-start">
            <Switch
              onClick={() => toggleDarkTheme()}
              checkedChildren="Dark"
              unCheckedChildren="Light"
              checked={darkTheme}
            />
          </div>
        </div>
        <Divider />
        <div className="setting flex align-start justify-center column">
          <span className="setting-title bold-text">{dictionary.settings.language.toUpperCase()}</span>
          <Select value={language} onChange={value => changeLanguage(value)}>
            {Object.keys(uiDictionary).map(lang => (
              <Option key={lang} value={lang}>
                {uiDictionary[lang].language}
              </Option>
            ))}
          </Select>
        </div>
        <Divider />
        <div className="setting flex align-start justify-center column">
          <span className="setting-title bold-text">{dictionary.settings.explorer.toUpperCase()}</span>
          <Select value={blockExplorers[preferredExplorer].name} onChange={value => changePreferredExplorer(value)}>
            {Object.keys(blockExplorers).map(explorer => (
              <Option key={explorer} value={explorer}>
                {blockExplorers[explorer].name}
              </Option>
            ))}
          </Select>
        </div>
        <Divider />
        <div className="socials flex align-center justify-start">
          <a href="https://twitter.com/jetprotocol" target="_blank" rel="noopener noreferrer">
            <i className="gradient-text fab fa-twitter"></i>
          </a>
          <a href="https://discord.gg/RW2hsqwfej" target="_blank" rel="noopener noreferrer">
            <i className="gradient-text fab fa-discord"></i>
          </a>
          <a href="https://github.com/jet-lab" target="_blank" rel="noopener noreferrer">
            <i className="gradient-text fab fa-github"></i>
          </a>
        </div>
      </div>
    </div>
  );
}
