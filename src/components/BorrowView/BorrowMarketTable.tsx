import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { ReserveData } from '@jet-lab/jet-engine';
import { currencyFormatter, totalAbbrev } from '../../utils/currency';
import { useLanguage } from '../../contexts/localization/localization';
import { useConnectWalletModal } from '../../contexts/Modals/connectWalletModal';
import { useNativeValues } from '../../contexts/BorrowView/nativeValues';
import { cluster, market, user } from '../../hooks/jet-engine/useClient';
import { Input } from 'antd';
import { NativeToggle } from './NativeToggle';
import { Info } from '../Misc/Info';
import { ReserveDetail } from './ReserveDetail';
import { Radar } from './Radar';
import { ReactComponent as ArrowIcon } from '../styles/icons/arrow_icon.svg';
import { ReactComponent as RadarIcon } from '../styles/icons/radar_icon.svg';
import { useCurrentReserve } from '../../contexts/transactions/currentReserve';

export function MarketTable(): JSX.Element {
  const { dictionary } = useLanguage();
  const { publicKey } = useWallet();
  const { setConnecting } = useConnectWalletModal();
  const { currentReserve, setCurrentReserve } = useCurrentReserve();
  const { nativeValues } = useNativeValues();
  const [reservesArray, setReservesArray] = useState<ReserveData[]>([]);
  const [filteredMarketTable, setFilteredMarketTable] = useState<ReserveData[]>([]);
  const [radarOpen, setRadarOpen] = useState(false);
  const [reserveDetail, setReserveDetail] = useState<any | null>(null);

  // If in development, can request airdrop for testing
  const doAirdrop = async (reserve: ReserveData): Promise<void> => {
    console.log('TODO: Implement airdrops from engine');
  };

  // Update reserves array on market changes
  useEffect(() => {
    const reserves = [];
    for (const reserve of Object.values(market.reserves)) {
      reserves.push(reserve);
    }
    setReservesArray(reserves);
    if (!filteredMarketTable.length) {
      setFilteredMarketTable(reserves);
    }

    // Initialize current reserve on first load
    if (!currentReserve) {
      setCurrentReserve(market.reserves['SOL']);
    }
  }, [market.reserves]);

  return (
    <>
      <div className="market-table">
        <div className="table-search">
          <Input
            type="text"
            placeholder={dictionary.cockpit.search + '...'}
            onChange={e => {
              const i = e.target.value.toLowerCase();
              let filteredMarket = [];
              if (i.length) {
                for (const reserve of reservesArray) {
                  if (reserve.name.toLowerCase().includes(i) || reserve.symbol.toLowerCase().includes(i)) {
                    filteredMarket.push(reserve);
                  }
                }
              } else {
                filteredMarket = reservesArray;
              }

              setFilteredMarketTable(filteredMarket);
            }}
          />
          <i className="gradient-text fas fa-search"></i>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{dictionary.cockpit.asset}</th>
                <th className="native-toggle-container">
                  <NativeToggle />
                </th>
                <th className="cell-border-right">{dictionary.cockpit.availableLiquidity}</th>
                <th>
                  {dictionary.cockpit.depositRate}
                  <Info term="depositRate" />
                </th>
                <th>
                  {dictionary.cockpit.borrowRate}
                  <Info term="borrowRate" />
                </th>
                <th className="cell-border-right">{dictionary.copilot.radar.title}</th>
                <th>{dictionary.cockpit.walletBalance}</th>
                <th>{dictionary.cockpit.amountDeposited}</th>
                <th>{dictionary.cockpit.amountBorrowed}</th>
                <th>{/* Empty column for arrow */}</th>
              </tr>
            </thead>
            <tbody>
              {filteredMarketTable.map((reserve, i) => (
                <tr
                  key={i}
                  className={currentReserve?.symbol === reserve.symbol ? 'active' : ''}
                  onClick={() => setCurrentReserve(reserve)}>
                  <td className="market-table-asset">
                    <img src={`img/cryptos/${reserve.symbol}.png`} alt={`${reserve.symbol} Icon`} />
                    <span className="semi-bold-text">{reserve.name}</span>
                    <span>≈{market.marketInit ? currencyFormatter(reserve.priceData.price ?? 0, true, 2) : '--'}</span>
                  </td>
                  <td onClick={() => setReserveDetail(reserve)} className="reserve-detail text-btn bold-text">
                    {reserve.symbol} {dictionary.cockpit.detail}
                  </td>
                  <td className="cell-border-right">
                    {market.marketInit
                      ? `${totalAbbrev(reserve.availableLiquidity.tokens, reserve.priceData.price, nativeValues, 2)} ${
                          nativeValues ? reserve.symbol : ''
                        }`
                      : '--'}
                  </td>
                  <td>
                    {market.marketInit ? (reserve.depositApy ? (reserve.depositApy * 100).toFixed(2) : 0) : '--'}%
                  </td>
                  <td>{market.marketInit ? (reserve.borrowApr ? (reserve.borrowApr * 100).toFixed(2) : 0) : '--'}%</td>
                  <td className="clickable-icon cell-border-right" onClick={() => setRadarOpen(true)}>
                    <RadarIcon width="18px" />
                  </td>
                  <td
                    className={
                      user.walletInit && user.walletBalances[reserve.symbol]
                        ? 'user-wallet-value text-btn semi-bold-text'
                        : ''
                    }
                    onClick={() => {
                      if (user.walletInit && user.walletBalances[reserve.symbol]) {
                        console.log('TODO: set current wallet balance and open deposit modal');
                      }
                    }}>
                    {user.walletInit
                      ? user.walletBalances[reserve.symbol] > 0 && user.walletBalances[reserve.symbol] < 0.0005
                        ? '~0'
                        : totalAbbrev(
                            user.walletBalances[reserve.symbol] ?? 0,
                            reserve.priceData.price,
                            nativeValues,
                            3
                          )
                      : '--'}
                  </td>
                  <td
                    className={
                      user.walletInit && user.collateralBalances[reserve.symbol]
                        ? 'user-collateral-value text-btn semi-bold-text'
                        : ''
                    }
                    onClick={() => {
                      if (user.walletInit && user.collateralBalances[reserve.symbol]) {
                        console.log('TODO: set current collateral balance and open withdraw modal');
                      }
                    }}>
                    {user.walletInit
                      ? user.collateralBalances[reserve.symbol] > 0 && user.collateralBalances[reserve.symbol] < 0.0005
                        ? '~0'
                        : totalAbbrev(
                            user.collateralBalances[reserve.symbol] ?? 0,
                            reserve.priceData.price,
                            nativeValues,
                            3
                          )
                      : '--'}
                  </td>
                  <td
                    className={
                      user.walletInit && user.loanBalances[reserve.symbol]
                        ? 'user-loan-value text-btn semi-bold-text'
                        : ''
                    }
                    onClick={() => {
                      if (user.walletInit && user.loanBalances[reserve.symbol]) {
                        console.log('TODO: set current loan balance and open repay modal');
                      }
                    }}>
                    {user.walletInit
                      ? user.loanBalances[reserve.symbol] > 0 && user.loanBalances[reserve.symbol] < 0.0005
                        ? '~0'
                        : totalAbbrev(user.loanBalances[reserve.symbol] ?? 0, reserve.priceData.price, nativeValues, 3)
                      : '--'}
                  </td>
                  {/* Faucet for testing if in development */}
                  {cluster === 'devnet' ? (
                    <td
                      onClick={async () => {
                        if (user.walletInit && publicKey) {
                          doAirdrop(reserve);
                        } else {
                          setConnecting(true);
                        }
                      }}>
                      <i
                        className="clickable-icon gradient-text fas fa-parachute-box"
                        title={`Airdrop ${reserve.symbol}`}></i>
                    </td>
                  ) : (
                    <td>
                      <ArrowIcon width="25px" />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Radar radarOpen={radarOpen} close={() => setRadarOpen(false)} />
      <ReserveDetail reserve={reserveDetail} close={() => setReserveDetail(null)} />
    </>
  );
}
