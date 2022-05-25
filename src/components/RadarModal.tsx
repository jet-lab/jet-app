import { useEffect, useState } from 'react';
import { useRadarModal } from '../contexts/radarModal';
import { useDarkTheme } from '../contexts/darkTheme';
import { useLanguage } from '../contexts/localization/localization';
import { useTradeContext } from '../contexts/tradeContext';
import { Modal } from 'antd';
import { RateObserver, ProtocolRates } from '@jet-lab/defi-yield-ts';
import { ReactComponent as RadarIcon } from '../styles/icons/radar_icon.svg';
import { idl } from '../hooks/jet-client/useClient';

export function RadarModal(): JSX.Element {
  const { darkTheme } = useDarkTheme();
  const { dictionary } = useLanguage();
  const { currentReserve } = useTradeContext();
  const { radarOpen, setRadarOpen } = useRadarModal();
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
      const rates: ProtocolRates[] = await rateObserver.fetchAll(idl.metadata.cluster);
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
    <Modal footer={null} visible={radarOpen} className="radar-modal" onCancel={() => setRadarOpen(false)}>
      <div className="radar-modal-header flex-centered">
        <RadarIcon width="20px" />
        <p>{dictionary.copilot.radar.interestRadar.toUpperCase()}</p>
      </div>
      <div className="radar-modal-asset flex-centered">
        <img src={`img/cryptos/${currentReserve?.abbrev}.png`} alt={`${currentReserve?.abbrev} Logo`} />
        <h1>{currentReserve?.abbrev}</h1>
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
                  {currentReserve?.abbrev && protocol.rates[currentReserve.abbrev]
                    ? `${Math.ceil(protocol.rates[currentReserve.abbrev].deposit * 100 * 100) / 100}%`
                    : '--'}
                </td>
                <td className="borrow-rate">
                  {currentReserve?.abbrev && protocol.rates[currentReserve.abbrev]
                    ? `${Math.ceil(protocol.rates[currentReserve.abbrev].borrow * 100 * 100) / 100}%`
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
