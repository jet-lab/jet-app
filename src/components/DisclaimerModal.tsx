import { useState } from 'react';
import reactStringReplace from 'react-string-replace';
import { useLanguage } from '../contexts/localization/localization';
import { Button, Checkbox, Modal, Typography } from 'antd';
import { useClusterSetting } from '../contexts/clusterSetting';
import { useWallet } from '@solana/wallet-adapter-react';

export function DisclaimerModal(): JSX.Element {
  const { clusterSetting } = useClusterSetting();
  const { dictionary } = useLanguage();
  const { publicKey } = useWallet();
  const [disclaimersAccepted, setDisclaimersAccepted] = useState(
    JSON.parse(localStorage.getItem('jetV1DisclaimersAccepted') ?? '{}')
  );
  const [dislaimerChecked, setDisclaimerChecked] = useState(false);
  const { Text } = Typography;

  // Set up dislaimer with inline links
  let disclaimer = reactStringReplace(dictionary.copilot.alert.disclaimer.disclaimerDetail, '{{TERMS_LINK}}', () => (
    <a
      className="link-btn"
      key="tos"
      href="https://www.jetprotocol.io/legal/terms-of-service"
      target="_blank"
      rel="noopener noreferrer">
      {dictionary.termsPrivacy.termsOfService}
    </a>
  ));
  disclaimer = reactStringReplace(disclaimer, '{{PRIVACY_LINK}}', () => (
    <a
      className="link-btn"
      key="privacy"
      href="https://www.jetprotocol.io/legal/privacy-policy"
      target="_blank"
      rel="noopener noreferrer">
      {dictionary.termsPrivacy.privacyPolicy}
    </a>
  ));

  return (
    <Modal
      className="disclaimer-modal"
      footer={null}
      closable={false}
      visible={publicKey !== null && clusterSetting === 'mainnet-beta' && !disclaimersAccepted[publicKey.toBase58()]}>
      <div className="modal-content flex-centered column">
        <img src="img/jet/jet_logo.png" width="100px" height="auto" alt="Jet Protocol" />
        <br></br>
        <Text>{disclaimer}</Text>
        <br></br>
        <Checkbox onChange={e => setDisclaimerChecked(e.target.checked)}>
          {dictionary.copilot.alert.disclaimer.acceptRisks}
        </Checkbox>
        <br></br>
        <Button
          block
          size="small"
          disabled={!dislaimerChecked}
          onClick={() => {
            if (publicKey) {
              disclaimersAccepted[publicKey.toBase58()] = true;
              localStorage.setItem('jetV1DisclaimersAccepted', JSON.stringify(disclaimersAccepted));
              setDisclaimersAccepted({ ...disclaimersAccepted });
            }
          }}>
          {dictionary.copilot.alert.disclaimer.enterMainnet}
        </Button>
      </div>
    </Modal>
  );
}
