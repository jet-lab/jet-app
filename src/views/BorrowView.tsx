import { useLanguage } from '../contexts/localization/localization';
import { BorrowRepayInputProvider } from '../contexts/BorrowView/borrowRepayInput';
import { market, user } from '../hooks/jet-engine/useClient';
import { currencyFormatter, totalAbbrev } from '../utils/currency';
import { Info } from '../components/Misc/Info';
import { HealthBar } from '../components/BorrowView/HealthBar';
import { BorrowPanel } from '../components/BorrowView/BorrowPanel';
import { MarketTable } from '../components/BorrowView/BorrowMarketTable';

export function BorrowView(): JSX.Element {
  const { dictionary } = useLanguage();

  return (
    <BorrowRepayInputProvider>
      <div className="cockpit view flex justify-center column">
        <div className="cockpit-top flex align-center justify-between">
          <div className="trade-market-tvl flex align-start justify-center column">
            <h2 className="view-subheader">{dictionary.cockpit.totalSupply}</h2>
            <h1 className={`view-header ${market.marketInit ? 'gradient-text' : ''}`}>
              {market.marketInit ? totalAbbrev(market.totalSupply) : '--'}
            </h1>
          </div>
          <div className="trade-market-tvl flex align-start justify-center column">
            <h2 className="view-subheader">{dictionary.reserveDetail.totalBorrowed}</h2>
            <h1 className={`view-header ${market.marketInit ? 'gradient-text' : ''}`}>
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
                        ? 'danger-text'
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
                  <p className="gradient-text">{currencyFormatter(user.position.depositedValue ?? 0, true)}</p>
                ) : (
                  <p>--</p>
                )}
              </div>
              <div className="trade-position-value flex-centered column">
                <h2 className="view-subheader">{dictionary.cockpit.totalBorrowedValue}</h2>
                {user.walletInit ? (
                  <p className="gradient-text">{currencyFormatter(user.position.borrowedValue ?? 0, true)}</p>
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
          <BorrowPanel />
          <MarketTable />
        </div>
      </div>
    </BorrowRepayInputProvider>
  );
}
