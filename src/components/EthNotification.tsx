import { Modal } from 'antd';
import { useState } from 'react';
import { useMarket } from '../v1/contexts/market';
import { useTradeContext } from '../contexts/tradeContext';
import { useMargin } from '../contexts/marginContext';

export const EthNotification = () => {
  const [modalVisible, setModalVisible] = useState(true);

  // Jet V1
  const market = useMarket();
  const { setCurrentReserve, setCurrentPool, setCurrentAction } = useTradeContext();

  // Jet V2
  const { pools } = useMargin();

  return (
    <Modal
      title={<div className="flex warning-text">IMPORTANT</div>}
      visible={modalVisible}
      okText={'Withdraw & Repay ETH'}
      onOk={() => {
        setModalVisible(false);
        setCurrentReserve(market.reserves['ETH']);
        if (pools) {
          setCurrentPool(pools.ETH);
        }
        setCurrentAction('withdraw');
      }}
      cancelButtonProps={{ style: { display: 'none' } }}
      onCancel={() => setModalVisible(false)}>
      <div>
        <div style={{ marginBottom: '5px' }}>
          <span className="bold-text">
            {
              'Sollet wrapped ETH will be sunset at the end of April. You currently have deposited or borrowed ETH. Please withdraw or repay any ETH positions on Jet Protocol immediately.'
            }
          </span>
        </div>
        <div className="flex">
          <span className="link-btn" id="learn-link">
            <a
              href="https://jet-association.gitbook.io/jet-association-1.0.0/collateral-off-boarding/sunsetting-sollet-wrapped-eth"
              target="_blank"
              rel="noopener noreferrer">
              Click here to learn more
            </a>
          </span>
        </div>
      </div>
    </Modal>
  );
};
