import { useEffect, useState } from 'react';
import { useInitFailed } from '../contexts/init';
import { useGeoban, useLanguage } from '../contexts/localization/localization';
import { useTradeContext } from '../contexts/tradeContext';
import { useMargin } from '../contexts/marginContext';
import { currencyFormatter, totalAbbrev } from '../utils/currency';
import { InitFailed } from '../components/InitFailed';
import { Info } from '../components/Info';
import { HealthBar } from '../components/HealthBar';
import { TradePanel } from '../components/TradePanel';
import { MarketTable } from '../components/MarketTable';
import { Skeleton } from 'antd';
import { WarningFilled } from '@ant-design/icons';

export function Cockpit(): JSX.Element {
  const isGeobanned = useGeoban();
  const { dictionary } = useLanguage();
  const { initFailed } = useInitFailed();
  const { currentPool } = useTradeContext();
  const { poolsFetched, pools, marginAccount, userFetched } = useMargin();
  const accountSummary = marginAccount?.summary;
  const [totalSupply, setTotalSupply] = useState(0);
  const [totalBorrowed, setTotalBorrowed] = useState(0);

  useEffect(() => {
    if (pools) {
      let totalSupply = 0;
      let totalBorrowed = 0;
      for (const token of Object.values(pools)) {
        if (!token.symbol) {
          return;
        }

        const tokenPrice = pools[token.symbol].tokenPrice;
        const depositedTokens = pools[token.symbol].depositedTokens.tokens;
        const borrowedTokens = pools[token.symbol].borrowedTokens.tokens;

        totalSupply += depositedTokens * tokenPrice;
        totalBorrowed += borrowedTokens * tokenPrice;
      }
      setTotalSupply(totalSupply);
      setTotalBorrowed(totalBorrowed);
    }
  }, [pools]);

  if (initFailed || isGeobanned) {
    return <InitFailed />;
  } else {
    return (
      <div className="cockpit view flex justify-center column">
        <div className="cockpit-top flex align-center justify-between">
          <div className="trade-market-tvl flex align-start justify-center column">
            <h2 className="view-subheader">{dictionary.cockpit.totalSupply}</h2>
            <h1 className={poolsFetched ? 'green-text' : ''}>
              {poolsFetched ? totalAbbrev(totalSupply) : <Skeleton paragraph={false} active />}
            </h1>
          </div>
          <div className="trade-market-tvl flex align-start justify-center column">
            <h2 className="view-subheader">{dictionary.reserveDetail.totalBorrowed}</h2>
            <h1 className={poolsFetched ? 'green-text' : ''}>
              {poolsFetched ? totalAbbrev(totalBorrowed) : <Skeleton paragraph={false} active />}
            </h1>
          </div>
          <div className="trade-position-snapshot flex-centered">
            <div className="trade-position-ratio flex align-start justify-center column">
              <div className="flex-centered">
                <h2 className="view-subheader">{dictionary.cockpit.yourRatio}</h2>
                <Info term="collateralizationRatio" />
              </div>
              {userFetched && accountSummary && currentPool ? (
                <>
                  <h1
                    className={`c-ratio
                    ${
                      !accountSummary.borrowedValue || accountSummary.cRatio >= currentPool.minCRatio + 0.25
                        ? 'success-text'
                        : accountSummary.cRatio <= currentPool.minCRatio + 0.1
                        ? 'danger-text'
                        : 'warning-text'
                    }`}
                    style={{ pointerEvents: 'none', fontSize: !accountSummary.borrowedValue ? '80px' : '' }}>
                    {accountSummary.borrowedValue > 0
                      ? accountSummary.cRatio > 10
                        ? '>1000'
                        : currencyFormatter(accountSummary.cRatio * 100, false, 1)
                      : '∞'}
                    {accountSummary.borrowedValue > 0 && (
                      <span style={{ color: 'inherit', paddingLeft: '2px' }}>%</span>
                    )}
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
                {userFetched && accountSummary ? (
                  <p className="gradient-text">{currencyFormatter(accountSummary.depositedValue, true)}</p>
                ) : (
                  <p>--</p>
                )}
              </div>
              <div className="trade-position-value flex-centered column">
                <h2 className="view-subheader">{dictionary.cockpit.totalBorrowedValue}</h2>
                {userFetched && accountSummary ? (
                  <p className="gradient-text">{currencyFormatter(accountSummary.borrowedValue, true)}</p>
                ) : (
                  <p>--</p>
                )}
              </div>
              {userFetched && currentPool && (
                <div className="trade-position-value min-c-note flex align-start justify-center">
                  <WarningFilled style={{ margin: '2px 5px 0 0' }} />
                  <span>
                    {dictionary.cockpit.minColRatioNote.replace('{{MIN_COL_RATIO}}', currentPool.minCRatio * 100)}
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
