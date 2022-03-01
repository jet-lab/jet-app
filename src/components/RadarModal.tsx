import { useEffect, useState } from 'react';
import { useRadarModal } from '../contexts/radarModal';
import { useDarkTheme } from '../contexts/darkTheme';
import { useLanguage } from '../contexts/localization/localization';
import { useTradeContext } from '../contexts/tradeContext';
import { Modal } from 'antd';
import { RateObserver, ProtocolRates } from '@jet-lab/defi-yield-ts';
import { ReactComponent as RadarIcon } from '../styles/icons/radar_icon.svg';

export function RadarModal() {
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
      const rates: ProtocolRates[] = await rateObserver.fetchAll();
      for (let rate of rates) {
        for (let protocol of protocols) {
          if (rate.protocol === protocol.name) {
            for (let r of rate.rates) {
              protocol.rates[r.asset] = {
                deposit: r.deposit,
                borrow: r.borrow
              }
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
        <RadarIcon width="25px" />
        <h1>
          {dictionary.copilot.radar.toUpperCase()}
        </h1>
      </div>
      <div className="table-container">
        <table className="no-interaction">
          <thead>
            <tr>
              <th>
                {currentReserve && (
                  <div className="flex-centered">
                    <img src={`img/cryptos/${currentReserve.abbrev}.png`} alt={`${currentReserve.abbrev} Logo`} />
                    <h1>{currentReserve.abbrev}</h1>
                  </div>
                )}
              </th>
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
            {protocols.map(protocol => (
              <tr key={protocol.name} className="no-interaction">
                <td>
                  <img
                    src={`img/protocols/${protocol.name.toLowerCase()}_${darkTheme ? 'white' : 'black'}.png`}
                    alt={`${protocol.name} Logo`}
                  />
                </td>
                <td>
                  {currentReserve?.abbrev && protocol.rates[currentReserve.abbrev] 
                    ? `${Math.ceil((protocol.rates[currentReserve.abbrev].deposit * 100) * 100) / 100}%` 
                      : '--'}
                </td>
                <td>
                  {currentReserve?.abbrev && protocol.rates[currentReserve.abbrev] 
                    ? `-${Math.ceil((protocol.rates[currentReserve.abbrev].borrow * 100) * 100) / 100}%` 
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