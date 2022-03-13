import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/localization/localization';

// Jet V1
import { useUser } from '../v1/contexts/user';
import { useMarket } from '../v1/contexts/market';

export function HealthBar(props: { fullDetail?: boolean }): JSX.Element {
  const { dictionary } = useLanguage();
  const [healthGauge, setHealthGauge] = useState<Record<string, number | string>>({
    percentage: 0,
    standing: ''
  });

  // Jet V1
  const user = useUser();
  const market = useMarket();
  const { colRatio } = user.position;

  // Range of health meter is liquidation (125%) to 200%
  useEffect(() => {
    if (!colRatio) {
      return;
    }

    if (colRatio <= market.minColRatio + 0.1) {
      setHealthGauge({
        percentage: 0,
        standing: 'critical'
      });
    } else if (colRatio >= market.minColRatio + 0.6) {
      // Use 95 instead of 100 here for styling reasons
      setHealthGauge({
        percentage: 95,
        standing: 'good'
      });
    } else {
      setHealthGauge({
        percentage: colRatio * 100 - 100,
        standing: colRatio >= market.minColRatio + 0.25 ? 'moderate' : 'low'
      });
    }
  }, [colRatio]);

  return (
    <div className="healthbar flex-centered column">
      <div className="healthbar-bar">
        {user.position.borrowedValue ? (
          <div className="healthbar-bar-indicator flex-centered column" style={{ left: `${healthGauge.percentage}%` }}>
            <div className="healthbar-bar-indicator-arrow"></div>
            <span
              className="healthbar-bar-indicator-label"
              style={healthGauge.standing === 'critical' ? { left: 0 } : {}}>
              {dictionary.healthbar[healthGauge.standing]?.toUpperCase()}
            </span>
          </div>
        ) : <></>}
        <span className="healthbar-bar-range-value">≥{market.minColRatio * 100}%</span>
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
