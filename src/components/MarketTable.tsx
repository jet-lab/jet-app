import { useEffect, useState } from 'react';
import { NATIVE_MINT } from '@solana/spl-token-latest';
import { useWallet } from '@solana/wallet-adapter-react';
import { Pool, MarginPools, TokenAmount, TokenFaucet } from '@jet-lab/margin';
import { CloudFilled, FilterFilled } from '@ant-design/icons';
import { currencyFormatter, totalAbbrev } from '../utils/currency';
import { useLanguage } from '../contexts/localization/localization';
import { useConnectWalletModal } from '../contexts/connectWalletModal';
import { useTradeContext } from '../contexts/tradeContext';
import { useNativeValues } from '../contexts/nativeValues';
import { useRadarModal } from '../contexts/radarModal';
import { cluster, useMargin } from '../contexts/marginContext';
import { Input, notification } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { NativeToggle } from './NativeToggle';
import { Info } from './Info';
import { PoolDetail } from './PoolDetail';
import { AssetLogo } from './AssetLogo';
import { ReactComponent as ArrowIcon } from '../styles/icons/arrow_icon.svg';
import { ReactComponent as RadarIcon } from '../styles/icons/radar_icon.svg';

export function MarketTable(): JSX.Element {
  const { dictionary } = useLanguage();
  const { config, manager, pools, marginAccount, walletBalances, userFetched, refresh } = useMargin();
  const { publicKey } = useWallet();
  const { setConnecting } = useConnectWalletModal();
  const { currentPool, setCurrentPool, setCurrentAction, setCurrentAmount } = useTradeContext();
  const { setRadarOpen } = useRadarModal();
  const { nativeValues } = useNativeValues();
  const [poolsArray, setPoolsArray] = useState<Pool[]>([]);
  const [filteredMarketTable, setFilteredMarketTable] = useState<Pool[]>([]);
  const [poolDetail, setPoolDetail] = useState<Pool | undefined>();
  const [filter, setFilter] = useState('');

  // If in development, can request airdrop for testing
  const doAirdrop = async (pool: Pool): Promise<void> => {
    let amount = TokenAmount.tokens('100', pool.decimals);
    if (pool.addresses.tokenMint.equals(NATIVE_MINT)) {
      amount = TokenAmount.tokens('1', pool.decimals);
    }

    const token = config.tokens[pool.symbol as MarginPools];

    try {
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }
      await TokenFaucet.airdrop(
        manager.programs,
        manager.provider,
        amount.lamports,
        token.mint,
        publicKey,
        token.faucet
      );
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

  // Update pools array on market changes
  useEffect(() => {
    if (pools) {
      const poolsArray = [];
      for (const pool of Object.values(pools)) {
        poolsArray.push(pool);
      }
      setPoolsArray(poolsArray);

      if (!filteredMarketTable.length) {
        setFilteredMarketTable(poolsArray);
      }

      // Initialize current pool on first load
      if (!currentPool) {
        setCurrentPool(pools.SOL);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPool, pools]);

  // Get max input for SOL only to account for 0.07 reserve
  const accountPoolPosition = marginAccount && currentPool?.symbol && marginAccount.poolPositions[currentPool.symbol];
  const maxSolInput = accountPoolPosition?.maxTradeAmounts['deposit'].tokens ?? 0;

  return (
    <>
      <div className="market-table">
        <div className="table-search">
          <Input
            type="text"
            placeholder={dictionary.cockpit.search + '...'}
            onChange={e => {
              const val = e.target.value.toLowerCase();
              setFilter(val);
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
              {poolsArray.length ? (
                poolsArray.map((pool, index) => {
                  const walletBalance =
                    userFetched && pool.symbol !== undefined ? walletBalances[pool.symbol] : undefined;
                  if (
                    !pool.name?.toLocaleLowerCase().includes(filter) &&
                    !pool.symbol?.toLocaleLowerCase().includes(filter)
                  )
                    return null;
                  return (
                    <tr
                      key={index}
                      className={currentPool?.symbol === pool.symbol ? 'active' : ''}
                      onClick={() => {
                        setCurrentPool(pool);
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
                          setPoolDetail(pool);
                          setCurrentPool(pool);
                        }}
                        className="reserve-detail text-btn bold-text">
                        {pool.symbol} {dictionary.cockpit.detail}
                      </td>
                      <td className="cell-border-right">
                        {totalAbbrev(
                          nativeValues ? pool.vault.tokens : pool.vault.muln(pool.tokenPrice).tokens,
                          pool.tokenPrice,
                          nativeValues,
                          2
                        )}
                      </td>
                      <td>{`${(pool.depositApy * 100).toFixed(2)}%`}</td>
                      <td>{`${(pool.borrowApr * 100).toFixed(2)}%`}</td>
                      <td className="clickable-icon cell-border-right">
                        <RadarIcon width="18px" onClick={() => setRadarOpen(true)} />
                      </td>
                      <td>
                        {pool && walletBalance ? (
                          <p
                            className={walletBalance ? 'user-wallet-value text-btn semi-bold-text' : ''}
                            onClick={() => {
                              if (walletBalance && currentPool?.tokenMint.equals(NATIVE_MINT)) {
                                setCurrentAction('deposit');
                                setCurrentAmount(maxSolInput);
                              } else if (walletBalance) {
                                setCurrentAction('deposit');
                                setCurrentAmount(walletBalance.amount.tokens);
                              }
                            }}>
                            {walletBalance.amount.tokens > 0 && walletBalance.amount.tokens < 0.0005
                              ? '~0'
                              : totalAbbrev(walletBalance.amount.tokens ?? 0, pool.tokenPrice, nativeValues, 3)}
                          </p>
                        ) : (
                          '--'
                        )}
                      </td>
                      <td>
                        {userFetched &&
                        pool.symbol &&
                        pool.tokenPrice !== undefined &&
                        marginAccount?.poolPositions?.[pool.symbol]?.depositBalance.tokens ? (
                          <p
                            className={
                              userFetched &&
                              pool.symbol &&
                              marginAccount?.poolPositions?.[pool.symbol]?.depositBalance.tokens
                                ? 'user-collateral-value text-btn semi-bold-text'
                                : ''
                            }
                            onClick={() => {
                              if (
                                userFetched &&
                                pool.symbol &&
                                marginAccount?.poolPositions?.[pool.symbol]?.depositBalance.tokens
                              ) {
                                setCurrentAction('withdraw');
                                setCurrentAmount(marginAccount.poolPositions[pool.symbol].depositBalance.tokens);
                              }
                            }}>
                            {marginAccount.poolPositions[pool.symbol].depositBalance.tokens > 0 &&
                            marginAccount.poolPositions[pool.symbol].depositBalance.tokens < 0.0005
                              ? '~0'
                              : totalAbbrev(
                                  marginAccount.poolPositions[pool.symbol].depositBalance.tokens,
                                  pool.tokenPrice,
                                  nativeValues,
                                  3
                                )}
                          </p>
                        ) : (
                          '--'
                        )}
                      </td>
                      <td>
                        {userFetched &&
                        pool.symbol &&
                        pool.tokenPrice !== undefined &&
                        marginAccount?.poolPositions?.[pool.symbol]?.loanBalance.tokens ? (
                          <p
                            className={
                              userFetched &&
                              pool.symbol &&
                              marginAccount?.poolPositions?.[pool.symbol]?.loanBalance.tokens
                                ? 'user-loan-value text-btn semi-bold-text'
                                : ''
                            }
                            onClick={() => {
                              if (
                                userFetched &&
                                pool.symbol &&
                                marginAccount?.poolPositions?.[pool.symbol]?.loanBalance.tokens
                              ) {
                                setCurrentAction('repay');
                                setCurrentAmount(marginAccount.poolPositions[pool.symbol].loanBalance.tokens);
                              }
                            }}>
                            {marginAccount.poolPositions[pool.symbol].loanBalance.tokens > 0 &&
                            marginAccount.poolPositions[pool.symbol].loanBalance.tokens < 0.0005
                              ? '~0'
                              : totalAbbrev(
                                  marginAccount.poolPositions[pool.symbol].loanBalance.tokens,
                                  pool.tokenPrice,
                                  nativeValues,
                                  3
                                )}
                          </p>
                        ) : (
                          '--'
                        )}
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
                          <CloudFilled />
                        </td>
                      ) : (
                        <td>
                          <ArrowIcon width="25px" />
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr className="no-interaction">
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td>
                    <LoadingOutlined className="green-text" style={{ fontSize: 25, marginLeft: -35 }} />
                  </td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <PoolDetail pool={poolDetail} close={() => setPoolDetail(undefined)} />
    </>
  );
}
