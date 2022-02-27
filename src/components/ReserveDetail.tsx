import { useWallet } from '@solana/wallet-adapter-react';
//TODO: import type { JetReserve } from "@jet-lab/jet-engine";
import { useConnectWalletModal } from '../contexts/connectWalletModal';
import { useDefinition } from '../contexts/copilotModal';
import { useLanguage } from '../contexts/localization/localization';
import { useNativeValues } from '../contexts/nativeValues';
import { currencyFormatter } from '../utils/currency';
import { Modal, Button, Divider } from 'antd';
import { NativeToggle } from './NativeToggle';
import { PercentageChart } from './PercentageChart';
import { Info } from './Info';

// Jet V1
import { Reserve } from '../v1/models/JetTypes';

export function ReserveDetail(props: {
  reserve: Reserve;
  close: Function;
}) {
  const { dictionary } = useLanguage();
  const { connecting, setConnecting } = useConnectWalletModal();
  const { connected } = useWallet();
  const { definition } = useDefinition();
  const { nativeValues } = useNativeValues();

  //TODO: Check all market/user properties,
  //especially for BN's like the marketSize.mul used here
  return (
    <Modal
      footer={null}
      className="reserve-detail"
      visible={props.reserve && !connecting && !definition}
      onCancel={() => props.close()}>
      <div className="reserve-detail-modal modal-content flex-centered column">
        <div className="flex-centered column">
          <div className="flex align-center-justify-center">
            <img src={`img/cryptos/${props.reserve?.abbrev}.png`} alt={`${props.reserve?.abbrev} Logo`} />
            <h1 className="modal-content-header">{props.reserve?.name.toUpperCase()}</h1>
          </div>
          <span>
            1 {props.reserve?.abbrev} ≈ {currencyFormatter(props.reserve?.price, true, 2)}
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
          <h1 className="text-gradient">
            {currencyFormatter(
              nativeValues
                ? props.reserve?.marketSize.tokens
                : props.reserve?.marketSize.muln(props.reserve?.price).tokens,
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
                      ? props.reserve?.outstandingDebt.tokens
                      : props.reserve?.outstandingDebt.muln(props.reserve?.price).tokens,
                    !nativeValues,
                    2
                  )}
                  {nativeValues && ' ' + props.reserve?.abbrev}
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
                      : props.reserve?.availableLiquidity.muln(props.reserve?.price).tokens,
                    !nativeValues,
                    2
                  )}
                  {nativeValues && ' ' + props.reserve?.abbrev}
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
            <p>{props.reserve?.maximumLTV / 100}%</p>
          </div>
          <div className="modal-detail reserve-subdetail flex-centered column">
            <span>
              {dictionary.reserveDetail.liquidationPremium.toUpperCase()}
              <Info term="liquidationPremium" />
            </span>
            <p>{props.reserve?.liquidationPremium / 100}%</p>
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
            ? dictionary.reserveDetail.tradeAsset.replace('{{ASSET}}', props.reserve?.abbrev)
            : dictionary.settings.connect}
        </Button>
      </div>
    </Modal>
  );
}
