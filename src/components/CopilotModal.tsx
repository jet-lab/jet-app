import { useEffect, useState } from 'react';
import { useLanguage, definitions } from '../contexts/localization/localization';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAlert, useDefinition } from '../contexts/copilotModal';
//TODO: import { market } from "../hooks/jet-client/useClient";
import { Modal, Button } from 'antd';
import { HealthBar } from './HealthBar';

export function CopilotModal() {
  const { connected } = useWallet();
  const { language, dictionary } = useLanguage();
  const { alert, setAlert } = useAlert();
  const { definition, setDefinition } = useDefinition();
  const [collateralDetail, setCollateralDetail] = useState(false);

  // Using this to check if we're currently on c-ratio definition
  // would be better to add a 'key' property to each definition and just check that.
  useEffect(() => {
    setCollateralDetail(false);
    for (let key of Object.keys(definitions[language])) {
      if (key === 'collateralizationRatio' && definitions[language][key].term === definition?.term) {
        setCollateralDetail(true);
      }
    }
  }, [definition]);

  return (
    <>
      {/* Alert Modal */}
      <Modal
        footer={null}
        closable={false}
        visible={alert !== undefined}
        className="copilot-modal"
        onCancel={() => setAlert(undefined)}>
        <div className="modal-content flex-centered column">
          <img
            src={`img/copilot/${alert?.status === 'neutral' ? 'copilot' : 'copilot_white'}.png`}
            className={alert?.status === 'neutral' ? '' : alert?.status}
            alt="Copilot Icon"
          />
          <div className="body flex align-start justify-center column">
            <h2 className={alert?.status === 'neutral' ? 'text-gradient' : alert?.status + '-text'}>
              {alert?.overview ?? dictionary.copilot.header}
            </h2>
            <span dangerouslySetInnerHTML={{ __html: alert?.detail ?? '' }}></span>
            {alert?.solution && (
              <span className="semi-bold-text" dangerouslySetInnerHTML={{ __html: alert?.solution }}></span>
            )}
            <Button
              className={`small-btn ${alert?.status === 'failure' ? 'error-btn' : ''}`}
              onClick={() => {
                if (alert?.action) {
                  alert?.action.onClick();
                }
                setAlert(undefined);
              }}>
              {alert?.action?.text ?? dictionary.copilot.okay}
            </Button>
          </div>
        </div>
      </Modal>
      {/* Definition Modal */}
      <Modal
        footer={null}
        visible={definition !== undefined}
        className="copilot-modal"
        onCancel={() => setDefinition(undefined)}>
        <div className="modal-content flex-centered column">
          <img src={`img/copilot/copilot.png`} alt="Copilot Icon" />
          <div className="body flex align-start justify-center column">
            {collateralDetail && connected && <HealthBar fullDetail />}
            <h2 className="text-gradient">{definition?.term}</h2>
            <span dangerouslySetInnerHTML={{ __html: definition?.definition ?? '' }}></span>
            <Button className="small-btn" onClick={() => setDefinition(undefined)}>
              {dictionary.copilot.okay}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
