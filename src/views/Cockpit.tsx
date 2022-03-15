import { useEffect } from 'react';
import { useInitFailed } from '../contexts/init';
import { useGeoban, useLanguage } from '../contexts/localization/localization';
import { useAlert } from '../contexts/copilotModal';
import { cluster } from '../hooks/jet-client/useClient';
import { currencyFormatter, totalAbbrev } from '../utils/currency';
import { InitFailed } from '../components/InitFailed';
import { Info } from '../components/Info';
import { HealthBar } from '../components/HealthBar';
import { TradePanel } from '../components/TradePanel';
import { MarketTable } from '../components/MarketTable';

// Jet V1
import { useUser } from '../v1/contexts/user';
import { useMarket } from '../v1/contexts/market';

export function Cockpit(): JSX.Element {
  const isGeobanned = useGeoban();
  const { dictionary } = useLanguage();
  const { initFailed } = useInitFailed();
  const { setAlert } = useAlert();

  // Jet V1
  const user = useUser();
  const market = useMarket();

  // If user has not accepted disclaimer, alert them to accept
  const acceptedDisclaimer = localStorage.getItem('jetDisclaimerAccepted') === 'true';
  useEffect(() => {
    if (cluster === 'mainnet-beta' && !acceptedDisclaimer) {
      setAlert({
        status: 'failure',
        overview: dictionary.copilot.alert.warning,
        detail: dictionary.copilot.alert.disclaimer,
        closeable: false,
        action: {
          text: dictionary.copilot.alert.accept,
          onClick: () => localStorage.setItem('jetDisclaimerAccepted', 'true')
        }
      });
    }
  }, [acceptedDisclaimer, setAlert, dictionary]);

  if (initFailed || isGeobanned) {
    return <InitFailed />;
  } else {
    return (
      <div className="cockpit view-container flex justify-center column">
        <div className="cockpit-top flex align-center justify-between">
          <div className="trade-market-tvl flex align-start justify-center column">
            <h2 className="view-subheader">{dictionary.cockpit.totalSupply}</h2>
            <h1 className={`view-header ${market.marketInit ? 'text-gradient' : ''}`}>
              {market.marketInit ? totalAbbrev(market.totalSupply) : '--'}
            </h1>
          </div>
          <div className="trade-market-tvl flex align-start justify-center column">
            <h2 className="view-subheader">{dictionary.reserveDetail.totalBorrowed}</h2>
            <h1 className={`view-header ${market.marketInit ? 'text-gradient' : ''}`}>
              {market.marketInit ? totalAbbrev(market.totalBorrowed) : '--'}
            </h1>
          </div>
          <div className="trade-position-snapshot flex-centered">
            <div className="trade-position-ratio flex align-start justify-center column">
              <div className="flex-centered">
                <h2 className="view-subheader">{dictionary.cockpit.yourRatio}</h2>
                <Info term="collateralizationRatio" />
              </div>
              {user.walletInit ? (
                <>
                  <h1
                    className={`view-header 
                    ${
                      !user.position.borrowedValue || user.position.colRatio >= market.minColRatio + 0.25
                        ? 'success-text'
                        : user.position.colRatio <= market.minColRatio + 0.1
                        ? 'failure-text'
                        : 'warning-text'
                    }`}
                    style={{ pointerEvents: 'none', fontSize: !user.position.borrowedValue ? '125px' : '' }}>
                    {user.position.borrowedValue > 0
                      ? user.position.colRatio > 10
                        ? '>1000'
                        : currencyFormatter(user.position.colRatio * 100, false, 1)
                      : '∞'}
                    {user.position.borrowedValue > 0 && <span style={{ color: 'inherit', paddingLeft: '2px' }}>%</span>}
                  </h1>
                  <HealthBar />
                </>
              ) : (
                <p>--</p>
              )}
            </div>
            <div className="flex-centered column">
              <div className="trade-position-value flex-centered column">
                <h2 className="view-subheader">{dictionary.cockpit.totalDepositedValue}</h2>
                {user.walletInit ? (
                  <p className="text-gradient">{currencyFormatter(user.position.depositedValue ?? 0, true)}</p>
                ) : (
                  <p>--</p>
                )}
              </div>
              <div className="trade-position-value flex-centered column">
                <h2 className="view-subheader">{dictionary.cockpit.totalBorrowedValue}</h2>
                {user.walletInit ? (
                  <p className="text-gradient">{currencyFormatter(user.position.borrowedValue ?? 0, true)}</p>
                ) : (
                  <p>--</p>
                )}
              </div>
              {user.walletInit && (
                <div className="trade-position-value min-c-note flex align-start justify-center">
                  <i className="fas fa-exclamation-triangle"></i>
                  <span>
                    {dictionary.cockpit.minColRatioNote.replace('{{MIN_COL_RATIO}}', market.minColRatio * 100)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="trade-table-container">
          <TradePanel />
          <MarketTable />
        </div>
      </div>
    );
  }
}
