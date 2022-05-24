import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnectWalletModal } from '../contexts/connectWalletModal';
import { useLanguage } from '../contexts/localization/localization';
import { Modal, Divider } from 'antd';
import { ReactComponent as ArrowIcon } from '../styles/icons/arrow_icon.svg';

export function ConnectWalletModal(): JSX.Element {
  const { dictionary } = useLanguage();
  const { wallets, select, connected, wallet } = useWallet();
  const { connecting, setConnecting } = useConnectWalletModal();
  useEffect(() => {
    if (connected) {
      setConnecting(false);
    }
  }, [connected, setConnecting]);

  return (
    <Modal
      footer={null}
      visible={connecting && !connected}
      className="connect-wallet-modal"
      onCancel={() => setConnecting(false)}>
      <div className="flex-centered column">
        <img src="img/jet/jet_logo.png" width="120px" height="auto" alt="Jet Protocol" />
        <span>{dictionary.settings.worldOfDefi}</span>
        <Divider />
        <div className="wallets flex-centered column">
          {wallets.map(w => (
            <div
              key={w.name}
              className={`wallet flex align-center justify-between 
                ${wallet?.name === w.name ? 'active' : ''}`}
              onClick={() => {
                select(w.name);
              }}>
              <div className="flex-centered">
                <img
                  src={`img/wallets/${w.name.toLowerCase()}.png`}
                  width="30px"
                  height="auto"
                  alt={`${w.name} Logo`}
                />
                <p className="center-text">{w.name}</p>
              </div>
              <ArrowIcon width="25px" />
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
