import { useWallet } from '@solana/wallet-adapter-react';
import { ReserveData } from '@jet-lab/jet-engine';
import { useConnectWalletModal } from '../../contexts/Modals/connectWalletModal';
import { useDefinition } from '../../contexts/Modals/copilotModal';
import { useLanguage } from '../../contexts/localization/localization';
import { useNativeValues } from '../../contexts/BorrowView/nativeValues';
import { market } from '../../hooks/jet-engine/useClient';
import { currencyFormatter } from '../../utils/currency';
import { Modal, Button, Divider } from 'antd';
import { NativeToggle } from './NativeToggle';
import { PercentageChart } from './PercentageChart';
import { Info } from '../Misc/Info';

export function ReserveDetail(props: { reserve: ReserveData; close: () => void }): JSX.Element {
  const { dictionary } = useLanguage();
  const { connecting, setConnecting } = useConnectWalletModal();
  const { connected } = useWallet();
  const { definition } = useDefinition();
  const { nativeValues } = useNativeValues();

  return (
    <Modal
      footer={null}
      className="reserve-detail"
      visible={props.reserve && !connecting && !definition}
      onCancel={() => props.close()}>
      <div className="reserve-detail-modal modal-content flex-centered column">
        <div className="flex-centered column">
          <div className="flex align-center-justify-center">
            <img src={`img/cryptos/${props.reserve?.symbol}.png`} alt={`${props.reserve?.symbol} Logo`} />
            <h1 className="modal-content-header">{props.reserve?.name.toUpperCase()}</h1>
          </div>
          <span>
            1 {props.reserve?.symbol} ≈ {currencyFormatter(props.reserve?.priceData.price ?? 0, true, 2)}
          </span>
        </div>
        <div className="native-toggle-container">
          <Divider />
          <div className="toggler">
            <NativeToggle />
          </div>
        </div>
        <div className="flex-centered column">
          <span className="flex-centered">{dictionary.reserveDetail.reserveSize.toUpperCase()}</span>
          <h1 className="gradient-text">
            {currencyFormatter(
              nativeValues
                ? props.reserve?.marketSize.tokens
                : props.reserve?.marketSize.muln(props.reserve?.priceData.price ?? 0).tokens,
              !nativeValues,
              2
            )}
          </h1>
        </div>
        <Divider />
        <div className="reserve-subdetails flex align-center justify-evenly">
          <PercentageChart
            percentage={props.reserve?.utilizationRate * 100}
            text={dictionary.reserveDetail.utilisationRate.toUpperCase()}
            term="utilisationRate"
          />
          <div className="reserve-subdetail flex align-start justify-center column">
            <div className="totals flex align-start justify-center">
              <div className="asset-info-color borrowed"></div>
              <span>
                {dictionary.reserveDetail.totalBorrowed.toUpperCase()}
                <br></br>
                <p>
                  {currencyFormatter(
                    nativeValues
                      ? props.reserve?.state.outstandingDebt.tokens
                      : props.reserve?.state.outstandingDebt.muln(props.reserve?.priceData.price ?? 0).tokens,
                    !nativeValues,
                    2
                  )}
                  {nativeValues && ' ' + props.reserve?.symbol}
                </p>
              </span>
            </div>
            <div className="totals flex align-start justify-center">
              <div className="asset-info-color liquid"></div>
              <span>
                {dictionary.reserveDetail.availableLiquidity.toUpperCase()}
                <br></br>
                <p>
                  {currencyFormatter(
                    nativeValues
                      ? props.reserve?.availableLiquidity.tokens
                      : props.reserve?.availableLiquidity.muln(props.reserve?.priceData.price ?? 0).tokens,
                    !nativeValues,
                    2
                  )}
                  {nativeValues && ' ' + props.reserve?.symbol}
                </p>
              </span>
            </div>
          </div>
        </div>
        <Divider />
        <div className="reserve-subdetails flex-centered">
          <div className="modal-detail reserve-subdetail flex-centered column">
            <span>
              {dictionary.reserveDetail.minimumCollateralizationRatio.toUpperCase()}
              <Info term="collateralizationRatio" />
            </span>
            <p>{market.minColRatio / 100}%</p>
          </div>
          <div className="modal-detail reserve-subdetail flex-centered column">
            <span>
              {dictionary.reserveDetail.liquidationPremium.toUpperCase()}
              <Info term="liquidationPremium" />
            </span>
            <p>{/* TODO: Add Liquidation premium props.reserve?.state. / 100 */}%</p>
          </div>
        </div>
        <Divider />
        <Button
          onClick={() => {
            if (connected) {
              props.close();
            } else {
              setConnecting(true);
            }
          }}>
          {connected
            ? dictionary.reserveDetail.tradeAsset.replace('{{ASSET}}', props.reserve?.symbol)
            : dictionary.settings.connect}
        </Button>
      </div>
    </Modal>
  );
}
