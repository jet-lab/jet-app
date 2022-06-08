import { useWallet } from '@solana/wallet-adapter-react';
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
import { AssetLogo } from './AssetLogo';
import { MarginPool } from '@jet-lab/margin';

export function ReserveDetail({
  reserve,
  pool,
  close
}: {
  reserve: Reserve | undefined;
  pool: MarginPool | undefined;
  close: () => void;
}): JSX.Element {
  const { dictionary } = useLanguage();
  const { connecting, setConnecting } = useConnectWalletModal();
  const { connected } = useWallet();
  const { definition } = useDefinition();
  const { nativeValues } = useNativeValues();
  const price = pool?.tokenPrice !== undefined ? pool.tokenPrice : 0;
  return (
    <Modal
      footer={null}
      className="reserve-detail"
      visible={reserve && pool && !connecting && !definition}
      onCancel={() => close()}>
      <div className="reserve-detail-modal modal-content flex-centered column">
        {reserve && pool && (
          <>
            <div className="flex-centered column">
              <div className="flex align-center-justify-center">
                <AssetLogo symbol={pool?.tokenConfig?.symbol ?? ''} height={45} style={{ marginRight: 10 }} />
                <h1 className="modal-content-header">{pool?.tokenConfig?.symbol}</h1>
              </div>
              <span>
                1 {pool?.tokenConfig?.symbol} ≈ {currencyFormatter(price, true, 2)}
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
                  nativeValues ? reserve.marketSize.tokens : reserve.marketSize.muln(price).tokens,
                  !nativeValues,
                  2
                )}
              </h1>
            </div>
            <Divider />
            <div className="reserve-subdetails flex align-center justify-evenly">
              <PercentageChart
                percentage={reserve.utilizationRate * 100}
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
                      {pool.tokenPrice !== undefined
                        ? currencyFormatter(
                            nativeValues
                              ? reserve.outstandingDebt.tokens
                              : reserve.outstandingDebt.muln(pool.tokenPrice).tokens,
                            !nativeValues,
                            2
                          )
                        : '--'}
                      {nativeValues && ' ' + pool?.tokenConfig?.symbol}
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
                          ? reserve.availableLiquidity.tokens
                          : reserve.availableLiquidity.muln(price).tokens,
                        !nativeValues,
                        2
                      )}
                      {nativeValues && ' ' + pool?.tokenConfig?.symbol}
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
                <p>{reserve.maximumLTV / 100}%</p>
              </div>
              <div className="modal-detail reserve-subdetail flex-centered column">
                <span>
                  {dictionary.reserveDetail.liquidationPremium.toUpperCase()}
                  <Info term="liquidationPremium" />
                </span>
                <p>{reserve.liquidationPremium / 100}%</p>
              </div>
            </div>
          </>
        )}
        <Button
          block
          onClick={() => {
            if (connected) {
              close();
            } else {
              setConnecting(true);
            }
          }}>
          {connected
            ? dictionary.reserveDetail.tradeAsset.replace('{{ASSET}}', reserve?.abbrev)
            : dictionary.settings.connect}
        </Button>
      </div>
    </Modal>
  );
}
