import { Button } from 'antd';
import { useConnectWalletModal } from '../contexts/connectWalletModal';
import { useLanguage } from '../contexts/localization/localization';

export function ConnectMessage(): JSX.Element {
  const { dictionary } = useLanguage();
  const { setConnecting } = useConnectWalletModal();

  return (
    <div className="connect-message flex-centered" onClick={() => setConnecting(true)}>
      <Button type="dashed">
        {dictionary.settings.connect}&nbsp;{dictionary.settings.wallet}
      </Button>
    </div>
  );
}
