import { Checkbox } from 'antd';
import { useEffect, useState } from 'react';
import { useAlert } from '../../contexts/Modals/copilotModal';
import { useLanguage } from '../../contexts/localization/localization';
import { cluster } from '../../hooks/jet-engine/useClient';

export function Disclaimer(): JSX.Element {
  const { dictionary } = useLanguage();
  const { setAlert } = useAlert();

  const acceptedDisclaimer = localStorage.getItem('jetDisclaimerAccepted') === 'true';
  const [dislaimerChecked, setDisclaimerChecked] = useState(false);
  useEffect(() => {
    if (cluster === 'mainnet-beta' && !acceptedDisclaimer) {
      setAlert({
        status: 'failure',
        overview: dictionary.copilot.alert.warning,
        detail: (
          <span>
            {dictionary.copilot.alert.disclaimer}
            <br />
            <br />
            <a href="https://www.jetprotocol.io/legal/terms-of-service" target="_blank" rel="noopener noreferrer">
              <span className="gradient-text link-btn">{dictionary.termsPrivacy.termsOfService}</span>
            </a>
            &nbsp;&nbsp;
            <a href="https://www.jetprotocol.io/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
              <span className="gradient-text link-btn">{dictionary.termsPrivacy.privacyPolicy}</span>
            </a>
            <br />
            <br />
            <Checkbox onChange={e => setDisclaimerChecked(e.target.checked)}>
              {dictionary.copilot.alert.acceptDisclaimer}
            </Checkbox>
          </span>
        ),
        closeable: false,
        action: {
          text: dictionary.copilot.alert.accept,
          onClick: () => localStorage.setItem('jetDisclaimerAccepted', 'true'),
          disabled: !dislaimerChecked
        }
      });
    }
  }, [acceptedDisclaimer, setAlert, dictionary, dislaimerChecked]);

  return <></>;
}
