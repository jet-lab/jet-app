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
import { Pool, MarginTokens, TokenAmount } from '@jet-lab/margin';
import { FilterFilled } from '@ant-design/icons';
import { AssetLogo } from './AssetLogo';
import { TokenFaucet } from '@jet-lab/margin';

export function MarketTable(): JSX.Element {
  const { dictionary } = useLanguage();
  const { publicKey } = useWallet();
  const { setConnecting } = useConnectWalletModal();
  const { currentReserve, setCurrentReserve, currentPool, setCurrentPool, setCurrentAction, setCurrentAmount } =
    useTradeContext();
  const { setRadarOpen } = useRadarModal();
  const { nativeValues } = useNativeValues();
  const [reservesArray, setReservesArray] = useState<Reserve[]>([]);
  const [filteredMarketTable, setFilteredMarketTable] = useState<Reserve[]>([]);
  const [reserveDetail, setReserveDetail] = useState<Reserve | undefined>();
  const [poolDetail, setPoolDetail] = useState<Pool | undefined>();
  // Jet V1
  const user = useUser();
  const market = useMarket();

  // Jet V2
  const { config, manager, poolsFetched, pools, marginAccount, walletBalances, userFetched, refresh } =
    useMargin();
  const [filter, setFilter] = useState('')

  // If in development, can request airdrop for testing
  const doAirdrop = async (pool: Pool): Promise<void> => {
    let amount = TokenAmount.tokens('100', pool.decimals);
    if (pool.addresses.tokenMint.equals(NATIVE_MINT)) {
      amount = TokenAmount.tokens('1', pool.decimals);
    }

    const token = config.tokens[pool.symbol as MarginTokens];

    try {
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }
      await TokenFaucet.airdrop(manager.programs, manager.provider, amount.lamports, token.mint, publicKey, token.faucet);
      notification.success({
        message: dictionary.copilot.alert.success,
        description: dictionary.copilot.alert.airdropSuccess
          .replaceAll('{{UI AMOUNT}}', amount.uiTokens)
          .replaceAll('{{RESERVE ABBREV}}', pool.symbol),
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

    // Initialize current reserve on first load
    if (!currentReserve) {
      setCurrentReserve(market.reserves['SOL']);
    }
    // Initialize current pool on first load
    if (!currentPool && pools) {
      setCurrentPool(pools.SOL);
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
              const val = e.target.value.toLowerCase();
              setFilter(val)
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
              {pools && (Object.keys(pools) as MarginTokens[]).map((poolKey, index) => {
                const pool = pools[poolKey];
                if (!pool.name?.toLocaleLowerCase().includes(filter) && !pool.symbol?.toLocaleLowerCase().includes(filter)) return null;
                return (
                  <tr
                    key={index}
                    className={currentReserve?.abbrev === pool.symbol ? 'active' : ''}
                    onClick={() => {
                      // setCurrentReserve(reserve);
                      // if (pool) {
                      //   setCurrentPool(pool);
                      // }
                    }}>
                    <td className="market-table-asset">
                      <AssetLogo symbol={String(pool.symbol)} height={25} />
                      <span className="semi-bold-text">{pool.name}</span>
                      <span>
                        ≈{pool && pool.tokenPrice !== undefined ? currencyFormatter(pool.tokenPrice, true, 2) : '--'}
                      </span>
                    </td>
                    <td
                      onClick={() => {
                        // setReserveDetail(reserve);
                        // setPoolDetail(pool);
                      }}
                      className="reserve-detail text-btn bold-text">
                      {pool.symbol} {dictionary.cockpit.detail}
                    </td>
                    <td className="cell-border-right">
                      {pool.availableLiquidity.uiTokens}
                    </td>
                    <td>
                    {`${(pool.depositApy * 100).toFixed(2)}%`}
                    </td>
                    <td>
                    {`${(pool.borrowApr * 100).toFixed(2)}%`}
                    </td>
                    <td className="clickable-icon cell-border-right" onClick={() => setRadarOpen(true)}>
                      <RadarIcon width="18px" />
                    </td>
                    <td
                      className={''
                        // userFetched && walletBalances[pool.symbol]
                        //   ? 'user-wallet-value text-btn semi-bold-text'
                        //   : ''
                      }
                      onClick={() => {
                        // if (userFetched && walletBalances[pool.symbol]) {
                        //   setCurrentAction('deposit');
                        //   setCurrentAmount(walletBalances[pool.symbol].amount.tokens);
                        // }
                      }}>
                      {/* {pool && pool.tokenPrice !== undefined
                        ? walletBalances[pool.symbol].amount.tokens > 0 &&
                          walletBalances[pool.symbol].amount.tokens < 0.0005
                          ? '~0'
                          : totalAbbrev(
                            walletBalances[pool.symbol].amount.tokens ?? 0,
                            pool.tokenPrice,
                            nativeValues,
                            3
                          )
                        : '--'} */}
                    </td>
                    <td
                      className={
                        userFetched && user.collateralBalances[String(pool.symbol)]
                          ? 'user-collateral-value text-btn semi-bold-text'
                          : ''
                      }
                      onClick={() => {
                        if (userFetched && user.collateralBalances[String(pool.symbol)]) {
                          setCurrentAction('withdraw');
                          setCurrentAmount(user.collateralBalances[String(pool.symbol)]);
                        }
                      }}>
                      {userFetched && pool && pool.tokenPrice !== undefined
                        ? user.collateralBalances[String(pool.symbol)] > 0 &&
                          user.collateralBalances[String(pool.symbol)] < 0.0005
                          ? '~0'
                          : totalAbbrev(user.collateralBalances[String(pool.symbol)] ?? 0, pool.tokenPrice, nativeValues, 3)
                        : '--'}
                    </td>
                    <td
                      className={
                        userFetched && user.loanBalances[String(pool.symbol)]
                          ? 'user-loan-value text-btn semi-bold-text'
                          : ''
                      }
                      onClick={() => {
                        if (userFetched && user.loanBalances[String(pool.symbol)]) {
                          setCurrentAction('repay');
                          setCurrentAmount(user.loanBalances[String(pool.symbol)]);
                        }
                      }}>
                      {userFetched && pool && pool.tokenPrice !== undefined
                        ? user.loanBalances[String(pool.symbol)] > 0 && user.loanBalances[String(pool.symbol)] < 0.0005
                          ? '~0'
                          : totalAbbrev(user.loanBalances[String(pool.symbol)] ?? 0, pool.tokenPrice, nativeValues, 3)
                        : '--'}
                    </td>
                    {/* Faucet for testing if in development */}
                    {cluster === 'devnet' ? (
                      <td
                        onClick={async () => {
                          if (userFetched && publicKey) {
                            doAirdrop(pool);
                          } else {
                            setConnecting(true);
                          }
                        }}>
                        <i
                          className="clickable-icon gradient-text fas fa-parachute-box"
                          title={`Airdrop ${pool.symbol}`}></i>
                      </td>
                    ) : (
                      <td>
                        <ArrowIcon width="25px" />
                      </td>
                    )}
                  </tr>
                );
              })}

            </tbody>
          </table>
        </div>
      </div>
      <ReserveDetail
        reserve={reserveDetail}
        pool={poolDetail}
        close={() => {
          setReserveDetail(undefined);
          setPoolDetail(undefined);
        }}
      />
    </>
  );
}
