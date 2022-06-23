import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/localization/localization';
import { useMargin } from '../contexts/marginContext';
import { useTradeContext } from '../contexts/tradeContext';

export function HealthBar(props: { fullDetail?: boolean }): JSX.Element {
  const { dictionary } = useLanguage();
  const { currentPool } = useTradeContext();
  const { marginAccount } = useMargin();
  const [healthGauge, setHealthGauge] = useState<Record<string, number | string>>({
    percentage: 0,
    standing: ''
  });

  // Range of health meter is liquidation (125%) to 200%
  useEffect(() => {
    if (!marginAccount?.summary.cRatio || !currentPool) {
      return;
    }

    if (marginAccount?.summary.cRatio <= currentPool.minCRatio + 0.1) {
      setHealthGauge({
        percentage: 0,
        standing: 'critical'
      });
    } else if (marginAccount?.summary.cRatio >= currentPool.minCRatio + 0.6) {
      // Use 95 instead of 100 here for styling reasons
      setHealthGauge({
        percentage: 95,
        standing: 'good'
      });
    } else {
      setHealthGauge({
        percentage: marginAccount?.summary.cRatio * 100 - 100,
        standing: marginAccount?.summary.cRatio >= currentPool.minCRatio + 0.25 ? 'moderate' : 'low'
      });
    }
  }, [marginAccount?.summary.cRatio, currentPool]);

  return (
    <div className="healthbar flex-centered column">
      <div className="healthbar-bar">
        {marginAccount?.summary.borrowedValue ? (
          <div className="healthbar-bar-indicator flex-centered column" style={{ left: `${healthGauge.percentage}%` }}>
            <div className="healthbar-bar-indicator-arrow"></div>
            <span
              className="healthbar-bar-indicator-label"
              style={healthGauge.standing === 'critical' ? { left: 0 } : {}}>
              {dictionary.healthbar[healthGauge.standing]?.toUpperCase()}
            </span>
          </div>
        ) : (
          <></>
        )}
        <span className="healthbar-bar-range-value">≥{(currentPool?.minCRatio ?? 0) * 100}%</span>
      </div>
      {props.fullDetail && (
        <div className="healthbar-full-detail flex justify-evenly align-start">
          {['critical', 'low', 'moderate', 'good'].map(standing => (
            <div
              key={standing}
              className={`healthbar-full-detail-status flex-centered column
              ${healthGauge.standing === standing ? 'active' : ''}`}>
              <p>{dictionary.healthbar[standing]?.toUpperCase()}</p>
              <span className="center-text">{dictionary.healthbar[`${standing}Detail`]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
