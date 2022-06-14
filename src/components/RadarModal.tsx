import { useRadarModal } from '../contexts/radarModal';
import { useLanguage } from '../contexts/localization/localization';
import { useTradeContext } from '../contexts/tradeContext';
import { Modal } from 'antd';
import { ReactComponent as RadarIcon } from '../styles/icons/radar_icon.svg';
import { AssetLogo } from './AssetLogo';

export function RadarModal(): JSX.Element {
  // const { darkTheme } = useDarkTheme();
  const { dictionary } = useLanguage();
  const { currentReserve } = useTradeContext();
  const { radarOpen, setRadarOpen } = useRadarModal();
  // const protocols = [
  //   {
  //     name: 'jet',
  //     rates: {} as any
  //   },
  //   {
  //     name: 'mango',
  //     rates: {} as any
  //   },
  //   {
  //     name: 'apricot',
  //     rates: {} as any
  //   },
  //   {
  //     name: 'port',
  //     rates: {} as any
  //   },
  //   {
  //     name: 'solend',
  //     rates: {} as any
  //   }
  // ];

  // Fetch/update rates on init and every 15 seconds
  // useEffect(() => {
  //   async function getRates() {
  //     const rateObserver = new RateObserver();
  //     const rates: ProtocolRates[] = await rateObserver.fetchAll(idl.metadata.cluster);
  //     for (const rate of rates) {
  //       for (const protocol of protocols) {
  //         if (rate.protocol === protocol.name) {
  //           for (const r of rate.rates) {
  //             protocol.rates[r.asset] = {
  //               deposit: r.depositRate,
  //               borrow: r.borrowRate
  //             };
  //           }
  //         }
  //       }
  //     }
  //   }

  //   getRates();
  //   setInterval(() => getRates(), 15000);
  // }, []);

  return (
    <Modal footer={null} visible={radarOpen} className="radar-modal" onCancel={() => setRadarOpen(false)}>
      <div className="radar-modal-header flex-centered">
        <RadarIcon width="20px" />
        <p>{dictionary.copilot.radar.interestRadar.toUpperCase()}</p>
      </div>
      <div className="radar-modal-asset flex-centered">
        <AssetLogo symbol={currentReserve?.abbrev ?? ''} height={30} style={{ marginRight: 5 }} />
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
            <h2>Radar is temporarily unavailable</h2>
            {/* {protocols.map((protocol, i) => (
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
                  {currentPool?.symbol && protocol.rates[currentPool.symbol]
                    ? `${Math.ceil(protocol.rates[currentPool.symbol].deposit * 100 * 100) / 100}%`
                    : '--'}
                </td>
                <td className="borrow-rate">
                  {currentPool?.symbol && protocol.rates[currentPool.symbol]
                    ? `${Math.ceil(protocol.rates[currentPool.symbol].borrow * 100 * 100) / 100}%`
                    : '--'}
                </td>
              </tr>
            ))} */}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
