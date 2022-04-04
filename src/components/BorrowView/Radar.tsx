import { useEffect, useState } from 'react';
import { RateObserver, ProtocolRates } from '@jet-lab/defi-yield-ts';
import { useCurrentReserve } from '../../contexts/transactions/currentReserve';
import { useDarkTheme } from '../../contexts/Settings/darkTheme';
import { useLanguage } from '../../contexts/localization/localization';
import { Modal } from 'antd';
import { ReactComponent as RadarIcon } from '../styles/icons/radar_icon.svg';

export function Radar(props: { radarOpen: boolean; close: () => void }): JSX.Element {
  const { darkTheme } = useDarkTheme();
  const { dictionary } = useLanguage();
  const { currentReserve } = useCurrentReserve();
  const [protocols, setProtocols] = useState([
    {
      name: 'jet',
      rates: {} as any
    },
    {
      name: 'mango',
      rates: {} as any
    },
    {
      name: 'apricot',
      rates: {} as any
    },
    {
      name: 'port',
      rates: {} as any
    },
    {
      name: 'solend',
      rates: {} as any
    }
  ]);

  // Fetch/update rates on init and every 15 seconds
  useEffect(() => {
    async function getRates() {
      const rateObserver = new RateObserver();
      const rates: ProtocolRates[] = await rateObserver.fetchAll();
      for (const rate of rates) {
        for (const protocol of protocols) {
          if (rate.protocol === protocol.name) {
            for (const r of rate.rates) {
              protocol.rates[r.asset] = {
                deposit: r.depositRate,
                borrow: r.borrowRate
              };
            }
          }
        }
      }

      setProtocols([...protocols]);
    }

    getRates();
    setInterval(() => getRates(), 15000);
  }, []);

  return (
    <Modal footer={null} visible={props.radarOpen} className="radar-modal" onCancel={() => props.close()}>
      <div className="radar-modal-header flex-centered">
        <RadarIcon width="20px" />
        <p>{dictionary.copilot.radar.interestRadar.toUpperCase()}</p>
      </div>
      <div className="radar-modal-asset flex-centered">
        <img src={`img/cryptos/${currentReserve?.symbol}.png`} alt={`${currentReserve?.symbol} Logo`} />
        <h1>{currentReserve?.symbol}</h1>
      </div>
      <div className="table-container">
        <table className="no-interaction">
          <thead>
            <tr>
              <th>{dictionary.copilot.radar.protocol}</th>
              <th>
                {dictionary.cockpit.depositRate}
                <span>(%)</span>
              </th>
              <th>
                {dictionary.cockpit.borrowRate}
                <span>(%)</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {protocols.map((protocol, i) => (
              <tr
                key={protocol.name}
                className={`no-interaction ${(i + 1) % 2 === 0 ? 'row-bg' : ''} ${darkTheme ? '' : 'white'}`}>
                <td>
                  <img
                    src={`img/protocols/${protocol.name.toLowerCase()}_${darkTheme ? 'white' : 'black'}.png`}
                    alt={`${protocol.name} Logo`}
                  />
                </td>
                <td className="deposit-rate">
                  {currentReserve?.symbol && protocol.rates[currentReserve.symbol]
                    ? `${Math.ceil(protocol.rates[currentReserve.symbol].deposit * 100 * 100) / 100}%`
                    : '--'}
                </td>
                <td className="borrow-rate">
                  {currentReserve?.symbol && protocol.rates[currentReserve.symbol]
                    ? `${Math.ceil(protocol.rates[currentReserve.symbol].borrow * 100 * 100) / 100}%`
                    : '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
