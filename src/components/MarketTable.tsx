import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { currencyFormatter, totalAbbrev } from '../utils/currency';
import { useLanguage } from '../contexts/localization/localization';
import { useConnectWalletModal } from '../contexts/connectWalletModal';
import { useTradeContext } from '../contexts/tradeContext';
import { useNativeValues } from '../contexts/nativeValues';
import { useRadarModal } from '../contexts/radarModal';
import { cluster, useMargin } from '../contexts/marginContext';
import { Input, notification } from 'antd';
import { NativeToggle } from './NativeToggle';
import { Info } from './Info';
import { ReserveDetail } from './ReserveDetail';
import { ReactComponent as ArrowIcon } from '../styles/icons/arrow_icon.svg';
import { ReactComponent as RadarIcon } from '../styles/icons/radar_icon.svg';

// Jet V1
import { NATIVE_MINT } from '@solana/spl-token';
import { useUser } from '../v1/contexts/user';
import { useMarket } from '../v1/contexts/market';
import { Reserve } from '../v1/models/JetTypes';
import { TokenAmount } from '@jet-lab/margin';
import { FilterFilled } from '@ant-design/icons';
import { AssetLogo } from './AssetLogo';
import { TokenFaucet } from '@jet-lab/margin';

export function MarketTable(): JSX.Element {
  const { dictionary } = useLanguage();
  const { publicKey } = useWallet();
  const { setConnecting } = useConnectWalletModal();
  const { currentReserve, setCurrentReserve, setCurrentAction, setCurrentAmount } = useTradeContext();
  const { setRadarOpen } = useRadarModal();
  const { nativeValues } = useNativeValues();
  const [reservesArray, setReservesArray] = useState<Reserve[]>([]);
  const [filteredMarketTable, setFilteredMarketTable] = useState<Reserve[]>([]);
  const [reserveDetail, setReserveDetail] = useState<any | null>(null);
  const [hasSolletEth, setHasSolletEth] = useState(false);
  // Jet V1
  const user = useUser();
  const market = useMarket();

  // Jet V2
  const { config, provider, programs, poolsFetched, pools, marginAccount, walletBalances, userFetched, refresh } =
    useMargin();

  // If in development, can request airdrop for testing
  const doAirdrop = async (reserve: Reserve): Promise<void> => {
    let amount = TokenAmount.tokens('100', reserve.decimals);
    if (reserve.tokenMintPubkey.equals(NATIVE_MINT)) {
      amount = TokenAmount.tokens('1', reserve.decimals);
    }

    const token = config.tokens[reserve.abbrev];

    try {
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }
      await TokenFaucet.airdrop(provider, amount.lamports, token.mint, publicKey, token.faucet);
      notification.success({
        message: dictionary.copilot.alert.success,
        description: dictionary.copilot.alert.airdropSuccess
          .replaceAll('{{UI AMOUNT}}', amount.uiTokens)
          .replaceAll('{{RESERVE ABBREV}}', reserve.abbrev),
        placement: 'bottomLeft'
      });
    } catch (err: any) {
      console.log(err);
      notification.error({
        message: dictionary.copilot.alert.failed,
        description: dictionary.cockpit.txFailed,
        placement: 'bottomLeft'
      });
    } finally {
      refresh();
    }
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

    if (user.collateralBalances['ETH'] > 0 || user.loanBalances['ETH'] > 0) {
      setHasSolletEth(true);
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
                  if (reserve.name.toLowerCase().includes(i) || reserve.abbrev.toLowerCase().includes(i)) {
                    filteredMarket.push(reserve);
                  }
                }
              } else {
                filteredMarket = reservesArray;
              }

              setFilteredMarketTable(filteredMarket);
            }}
          />
          <FilterFilled />
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
              {filteredMarketTable.map((reserve, i) => {
                if (!hasSolletEth && reserve.abbrev === 'ETH') return
                return (
                  <tr
                    key={i}
                    className={currentReserve?.abbrev === reserve.abbrev ? 'active' : ''}
                    onClick={() => setCurrentReserve(reserve)}>
                    <td className="market-table-asset">
                      <AssetLogo symbol={reserve.abbrev} height={25} />
                      <span className="semi-bold-text">{reserve.name}</span>
                      <span>≈{market.marketInit ? currencyFormatter(reserve.price, true, 2) : '--'}</span>
                    </td>
                    <td onClick={() => setReserveDetail(reserve)} className="reserve-detail text-btn bold-text">
                      {reserve.abbrev} {dictionary.cockpit.detail}
                    </td>
                    <td className="cell-border-right">
                      {market.marketInit
                        ? `${totalAbbrev(reserve.availableLiquidity.tokens, reserve.price, nativeValues, 2)} ${nativeValues ? reserve.abbrev : ''
                        }`
                        : '--'}
                    </td>
                    <td>
                      {market.marketInit ? (reserve.depositRate ? (reserve.depositRate * 100).toFixed(2) : 0) : '--'}%
                    </td>
                    <td>
                      {market.marketInit ? (reserve.borrowRate ? (reserve.borrowRate * 100).toFixed(2) : 0) : '--'}%
                    </td>
                    <td className="clickable-icon cell-border-right" onClick={() => setRadarOpen(true)}>
                      <RadarIcon width="18px" />
                    </td>
                    <td
                      className={
                        user.walletInit && walletBalances[reserve.abbrev]
                          ? 'user-wallet-value text-btn semi-bold-text'
                          : ''
                      }
                      onClick={() => {
                        if (user.walletInit && walletBalances[reserve.abbrev]) {
                          setCurrentAction('deposit');
                          setCurrentAmount(walletBalances[reserve.abbrev].amount.tokens);
                        }
                      }}>
                      {user.walletInit
                        ? walletBalances[reserve.abbrev].amount.tokens > 0 &&
                          walletBalances[reserve.abbrev].amount.tokens < 0.0005
                          ? '~0'
                          : totalAbbrev(walletBalances[reserve.abbrev].amount.tokens ?? 0, reserve.price, nativeValues, 3)
                        : '--'}
                    </td>
                    <td
                      className={
                        user.walletInit && user.collateralBalances[reserve.abbrev]
                          ? 'user-collateral-value text-btn semi-bold-text'
                          : ''
                      }
                      onClick={() => {
                        if (user.walletInit && user.collateralBalances[reserve.abbrev]) {
                          setCurrentAction('withdraw');
                          setCurrentAmount(user.collateralBalances[reserve.abbrev]);
                        }
                      }}>
                      {user.walletInit
                        ? user.collateralBalances[reserve.abbrev] > 0 && user.collateralBalances[reserve.abbrev] < 0.0005
                          ? '~0'
                          : totalAbbrev(user.collateralBalances[reserve.abbrev] ?? 0, reserve.price, nativeValues, 3)
                        : '--'}
                    </td>
                    <td
                      className={
                        user.walletInit && user.loanBalances[reserve.abbrev]
                          ? 'user-loan-value text-btn semi-bold-text'
                          : ''
                      }
                      onClick={() => {
                        if (user.walletInit && user.loanBalances[reserve.abbrev]) {
                          setCurrentAction('repay');
                          setCurrentAmount(user.loanBalances[reserve.abbrev]);
                        }
                      }}>
                      {user.walletInit
                        ? user.loanBalances[reserve.abbrev] > 0 && user.loanBalances[reserve.abbrev] < 0.0005
                          ? '~0'
                          : totalAbbrev(user.loanBalances[reserve.abbrev] ?? 0, reserve.price, nativeValues, 3)
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
                          title={`Airdrop ${reserve.abbrev}`}></i>
                      </td>
                    ) : (
                      <td>
                        <ArrowIcon width="25px" />
                      </td>
                    )}
                  </tr>
                )
              }
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ReserveDetail reserve={reserveDetail} close={() => setReserveDetail(null)} />
    </>
  );
}
