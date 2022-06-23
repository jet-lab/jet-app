import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PoolAmount, TokenAmount } from '@jet-lab/margin';
import { TxnResponse } from '../models/JetTypes';
import { useMargin } from '../contexts/marginContext';
import type { TradeAction } from '../contexts/tradeContext';
import { useTradeContext } from '../contexts/tradeContext';
import { useLanguage } from '../contexts/localization/localization';
import { useBlockExplorer } from '../contexts/blockExplorer';
import { useTransactionLogs } from '../contexts/transactionLogs';
import { useMarginActions } from '../hooks/useMarginActions';
import { currencyFormatter } from '../utils/currency';
import { shortenPubkey } from '../utils/utils';
import { notification, Select, Slider } from 'antd';
import { Info } from './Info';
import { JetInput } from './JetInput';
import { ConnectMessage } from './ConnectMessage';

export function TradePanel(): JSX.Element {
  const { dictionary } = useLanguage();
  const { pools, marginAccount, walletBalances, userFetched } = useMargin();
  const { getExplorerUrl } = useBlockExplorer();
  const { addLog } = useTransactionLogs();
  const { connected } = useWallet();
  const {
    currentPool,
    currentAction,
    setCurrentAction,
    currentAmount,
    setCurrentAmount,
    sendingTrade,
    setSendingTrade
  } = useTradeContext();
  const accountPoolPosition = marginAccount && currentPool?.symbol && marginAccount.positions[currentPool.symbol];
  const accountSummary = marginAccount && marginAccount.summary;
  const [adjustedRatio, setAdjustedRatio] = useState<number>(0);
  const maxInput = accountPoolPosition?.maxTradeAmounts[currentAction].tokens ?? 0;
  const [disabledInput, setDisabledInput] = useState<boolean>(false);
  const [disabledMessage, setDisabledMessage] = useState<string>('');
  const [inputError, setInputError] = useState<string>('');
  const tradeActions: TradeAction[] = ['deposit', 'withdraw', 'borrow', 'repay'];
  const { deposit, withdraw, borrow, repay } = useMarginActions();
  const { Option } = Select;

  // Adjust interface
  function adjustInterface() {
    setInputError('');
    adjustCollateralizationRatio();
    checkDisabledInput();
  }

  // Check if user input should be disabled
  // depending on wallet balance and position
  function checkDisabledInput() {
    // Initially set to true and reset message
    setDisabledMessage('');
    setDisabledInput(true);
    if (!currentPool || currentPool === undefined || !currentPool.symbol) {
      return;
    }

    // Depositing
    if (currentAction === 'deposit') {
      // No wallet balance to deposit
      if (!walletBalances[currentPool.symbol].amount.tokens) {
        setDisabledMessage(dictionary.cockpit.noBalanceForDeposit.replaceAll('{{ASSET}}', currentPool.symbol));
      } else if (currentPool.symbol === 'ETH') {
        setDisabledMessage('Sollet ETH will be sunset at the end of April. We do not accept Sollet ETH');
      } else {
        setDisabledInput(false);
      }
      // Withdrawing
    } else if (currentAction === 'withdraw') {
      // No collateral to withdraw
      if (!accountPoolPosition?.depositBalance.tokens) {
        setDisabledMessage(dictionary.cockpit.noDepositsForWithdraw.replaceAll('{{ASSET}}', currentPool.symbol));
        // User is below PROGRAM minimum c-ratio
      } else if (accountSummary?.borrowedValue && accountSummary.cRatio <= currentPool.minCRatio) {
        setDisabledMessage(dictionary.cockpit.belowMinCRatio);
      } else {
        setDisabledInput(false);
      }
      // Borrowing
    } else if (currentAction === 'borrow') {
      // User has not deposited any collateral
      if (!walletBalances[currentPool.symbol].amount.tokens) {
        setDisabledMessage(dictionary.cockpit.noDepositsForBorrow);

        // User is below minimum c-ratio
      } else if (accountSummary?.borrowedValue && accountSummary?.cRatio <= currentPool.minCRatio) {
        setDisabledMessage(dictionary.cockpit.belowMinCRatio);
        // No liquidity in market to borrow from
      } else if (!currentPool.depositedTokens.tokens) {
        setDisabledMessage(dictionary.cockpit.noLiquidity);
      } else {
        setDisabledInput(false);
      }
      // Repaying
    } else if (currentAction === 'repay') {
      // User has no loan balance to repay
      if (!accountPoolPosition?.loanBalance.tokens) {
        setDisabledMessage(dictionary.cockpit.noDebtForRepay.replaceAll('{{ASSET}}', currentPool.symbol));
      } else {
        setDisabledInput(false);
      }
    }
  }

  // Adjust user input and calculate updated c-ratio if
  // they were to submit current trade
  function adjustCollateralizationRatio(currentAmount = 0) {
    if (!currentPool || !currentPool.tokenPrice || !accountSummary) {
      return;
    }

    // Depositing
    if (currentAction === 'deposit') {
      setAdjustedRatio(
        (accountSummary.depositedValue + currentAmount * currentPool.tokenPrice) /
          (accountSummary.borrowedValue > 0 ? accountSummary.borrowedValue : 1)
      );
      // Withdrawing
    } else if (currentAction === 'withdraw') {
      setAdjustedRatio(
        (accountSummary.depositedValue - currentAmount * currentPool.tokenPrice) /
          (accountSummary.borrowedValue > 0 ? accountSummary.borrowedValue : 1)
      );
      // Borrowing
    } else if (currentAction === 'borrow') {
      setAdjustedRatio(
        accountSummary.depositedValue /
          (accountSummary.borrowedValue + currentAmount * currentPool.tokenPrice > 0
            ? accountSummary.borrowedValue + currentAmount * currentPool.tokenPrice
            : 1)
      );
      // Repaying
    } else if (currentAction === 'repay') {
      setAdjustedRatio(
        accountSummary.depositedValue /
          (accountSummary.borrowedValue - currentAmount * currentPool.tokenPrice > 0
            ? accountSummary.borrowedValue - currentAmount * currentPool.tokenPrice
            : 1)
      );
    }
  }

  // Check user input and for Copilot warning
  // Then submit trade RPC call
  async function submitTrade() {
    if (!currentPool?.symbol || !accountPoolPosition || !accountSummary || !currentAmount || inputError) {
      return;
    }

    const tradeAction = currentAction;
    const tradeAmount = TokenAmount.tokens(currentAmount.toString(), currentPool.decimals);
    let res: TxnResponse = TxnResponse.Cancelled;
    let txids: string[] = [];
    let tradeError = '';
    setSendingTrade(true);

    // Depositing
    if (tradeAction === 'deposit') {
      // User is depositing more than they have in their wallet
      if (tradeAmount.tokens > walletBalances[currentPool.symbol].amount.tokens) {
        tradeError = dictionary.cockpit.notEnoughAsset.replaceAll('{{ASSET}}', currentPool.symbol);
        // Otherwise, send deposit
      } else {
        const depositAmount = tradeAmount.lamports;
        [res, txids] = await deposit(currentPool.symbol, depositAmount);
      }
      // Withdrawing sollet ETH
    } else if (tradeAction === 'withdraw') {
      // User is withdrawing more than liquidity in market
      if (tradeAmount.gt(currentPool.depositedTokens)) {
        tradeError = dictionary.cockpit.noLiquidity;
        // User is withdrawing more than they've deposited
      } else if (tradeAmount.tokens > accountPoolPosition.depositBalance.tokens) {
        tradeError = dictionary.cockpit.lessFunds;
        // User is below PROGRRAM minimum c-ratio
      } else if (accountSummary.borrowedValue && accountSummary.cRatio <= 1.25) {
        tradeError = dictionary.cockpit.belowMinCRatio;
        // Otherwise, send withdraw
      } else {
        // If user is withdrawing all, use collateral notes
        const withdrawAmount =
          tradeAmount.tokens === accountPoolPosition.depositBalance.tokens
            ? PoolAmount.notes(accountPoolPosition.depositBalanceNotes)
            : PoolAmount.tokens(tradeAmount.lamports);
        [res, txids] = await withdraw(currentPool.symbol, withdrawAmount);
      }
      // Borrowing
    } else if (tradeAction === 'borrow') {
      // User is borrowing more than liquidity in market
      if (tradeAmount.gt(currentPool.depositedTokens)) {
        tradeError = dictionary.cockpit.noLiquidity;
        // User is below the minimum c-ratio
      } else if (accountSummary.borrowedValue && accountSummary.cRatio <= currentPool.minCRatio) {
        tradeError = dictionary.cockpit.belowMinCRatio;
        // Otherwise, send borrow
      } else {
        [res, txids] = await borrow(currentPool.symbol, tradeAmount.lamports);
      }
      // Repaying
    } else if (tradeAction === 'repay') {
      // User is repaying more than they owe
      if (tradeAmount.tokens > accountPoolPosition.loanBalance.tokens) {
        tradeError = dictionary.cockpit.oweLess;
        // User input amount is larger than wallet balance
      } else if (tradeAmount.tokens > walletBalances[currentPool.symbol].amount.tokens) {
        tradeError = dictionary.cockpit.notEnoughAsset.replaceAll('{{ASSET}}', currentPool.symbol);
        // Otherwise, send repay
      } else {
        // If user is repaying all, use loan notes
        const repayAmount =
          tradeAmount.tokens === accountPoolPosition.loanBalance.tokens
            ? PoolAmount.notes(accountPoolPosition.loanBalanceNotes)
            : PoolAmount.tokens(tradeAmount.lamports);
        [res, txids] = await repay(currentPool.symbol, repayAmount);
      }
    }

    // If input error, remove trade amount and return
    if (tradeError) {
      setInputError(tradeError);
      setSendingTrade(false);
      return;
    }

    // Notify user of successful/unsuccessful trade
    const lastTxn = txids[txids.length - 1];
    if (res === TxnResponse.Success) {
      notification.success({
        message: dictionary.cockpit.txSuccessShort.replaceAll(
          '{{TRADE ACTION}}',
          tradeAction[0].toUpperCase() + tradeAction.substring(1)
        ),
        description: (
          <a
            href={getExplorerUrl(lastTxn)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex align-center justify-between"
            style={{ width: '100%' }}>
            {shortenPubkey(lastTxn, 8)}
            <i className="fas fa-external-link-alt"></i>
          </a>
        ),
        placement: 'bottomLeft'
      });

      // Add Tx Log
      addLog(lastTxn);
      setCurrentAmount(null);
    } else if (res === TxnResponse.Failed) {
      notification.error({
        message: dictionary.copilot.alert.failed,
        description: dictionary.cockpit.txFailed,
        placement: 'bottomLeft'
      });
    } else if (res === TxnResponse.Cancelled) {
      notification.error({
        message: dictionary.copilot.alert.failed,
        description: dictionary.cockpit.txCancelled,
        placement: 'bottomLeft'
      });
    }

    // Readjust interface
    adjustInterface();
    // End trade submit
    setSendingTrade(false);
  }

  // Readjust interface onmount
  // and current reserve change
  useEffect(() => {
    adjustInterface();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPool, accountPoolPosition, accountSummary, currentAction]);

  // If user disconnects wallet, reset inputs
  useEffect(() => {
    setCurrentAmount(null);
  }, [setCurrentAmount, userFetched]);

  // On user input, check for error
  useEffect(() => {
    if (currentAmount) {
      if (!currentPool) {
        return;
      }

      // Depositing
      if (currentAction === 'deposit') {
        if (
          currentPool.symbol === 'SOL' &&
          currentAmount <= walletBalances[currentPool.symbol].amount.tokens &&
          currentAmount > walletBalances[currentPool.symbol].amount.tokens - 0.02
        ) {
          setInputError(dictionary.cockpit.insufficientLamports);
        }
        // Withdrawing
      } else if (currentAction === 'withdraw') {
        // User is withdrawing between 125% and 130%, allow trade but warn them
        if (accountSummary?.borrowedValue && adjustedRatio > 0 && adjustedRatio <= currentPool.minCRatio + 0.05) {
          setInputError(
            dictionary.cockpit.subjectToLiquidation
              .replaceAll('{{NEW-C-RATIO}}', currencyFormatter(adjustedRatio * 100, false, 1))
              .replaceAll('{{MIN-C-RATIO}}', currencyFormatter(currentPool.minCRatio * 100, false, 1))
              .replaceAll('{{TRADE ACTION}}', dictionary.cockpit.withdraw.toLowerCase())
          );
        }
        // Borrowing
      } else if (currentAction === 'borrow') {
        if (adjustedRatio <= currentPool.minCRatio + 0.2) {
          // but not below min-ratio, warn and allow trade
          if (adjustedRatio >= currentPool.minCRatio || !accountSummary?.borrowedValue) {
            setInputError(
              dictionary.cockpit.subjectToLiquidation
                .replaceAll('{{NEW-C-RATIO}}', currencyFormatter(adjustedRatio * 100, false, 1))
                .replaceAll('{{MIN-C-RATIO}}', currencyFormatter(currentPool.minCRatio * 100, false, 1))
                .replaceAll('{{TRADE ACTION}}', dictionary.cockpit.borrow.toLowerCase())
            );
            // and below minimum ratio, inform and reject
          } else if (adjustedRatio < currentPool.minCRatio && adjustedRatio < accountSummary.cRatio) {
            setInputError(dictionary.cockpit.rejectTrade);
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAmount]);

  return (
    <div className="trade-panel flex align-center justify-start">
      <div className="trade-select-container flex align-center justify-between">
        {tradeActions.map(action => (
          <div
            key={action}
            onClick={() => {
              if (!sendingTrade) {
                setCurrentAction(action);
                adjustInterface();
              }
            }}
            className={`trade-select flex justify-center align-center ${currentAction === action ? 'active' : ''}`}>
            <p className="semi-bold-text">{dictionary.cockpit[action].toUpperCase()}</p>
          </div>
        ))}
        <div className="mobile-trade-select flex-centered">
          <Select
            value={currentAction}
            onChange={action => {
              if (!sendingTrade) {
                setCurrentAction(action);
                adjustInterface();
              }
            }}>
            {tradeActions.map(action => (
              <Option key={action} value={action}>
                {action.toUpperCase()}
              </Option>
            ))}
          </Select>
        </div>
      </div>
      {!connected || !pools ? <ConnectMessage /> : <></>}
      {disabledMessage || inputError ? (
        <div className="trade-section trade-section-disabled-message flex-centered column">
          <span className={`center-text ${inputError ? 'danger-text' : ''}`}>{disabledMessage || inputError}</span>
        </div>
      ) : (
        <>
          <div className={`trade-section flex-centered column ${disabledInput ? 'disabled' : ''}`}>
            <span className="center-text bold-text">
              {currentAction === 'deposit'
                ? dictionary.cockpit.walletBalance.toUpperCase()
                : currentAction === 'withdraw'
                ? dictionary.cockpit.availableFunds.toUpperCase()
                : currentAction === 'borrow'
                ? currentPool && maxInput <= currentPool.depositedTokens.tokens
                  ? dictionary.cockpit.maxBorrowAmount.toUpperCase()
                  : dictionary.cockpit.availableLiquidity.toUpperCase()
                : dictionary.cockpit.amountOwed.toUpperCase()}
            </span>
            <div className="flex-centered">
              <p className="center-text">
                {userFetched && currentPool
                  ? currencyFormatter(maxInput, false, currentPool.decimals) + ' ' + currentPool.symbol
                  : '--'}
              </p>
            </div>
          </div>
          <div className={`trade-section flex-centered column ${disabledInput ? 'disabled' : ''}`}>
            <div className="flex-centered">
              <span className="center-text bold-text">
                {dictionary.cockpit.adjustedCollateralization.toUpperCase()}
              </span>
              <Info term="adjustedCollateralizationRatio" />
            </div>
            <p>
              {userFetched
                ? (accountSummary?.borrowedValue || (currentAction === 'borrow' && currentAmount)) && adjustedRatio > 10
                  ? '>1000%'
                  : (accountSummary?.borrowedValue || (currentAction === 'borrow' && currentAmount)) &&
                    adjustedRatio < 10
                  ? currencyFormatter(adjustedRatio * 100, false, 1) + '%'
                  : '∞'
                : '--'}
            </p>
          </div>
        </>
      )}
      <div className="trade-section flex-centered column">
        <JetInput
          type="number"
          currency
          value={currentAmount}
          maxInput={maxInput}
          disabled={!userFetched || disabledInput}
          loading={sendingTrade}
          error={inputError}
          onClick={() => setInputError('')}
          onChange={(value: number) => {
            const currentAmount = value;
            if (currentAmount < 0) {
              setCurrentAmount(0);
            } else {
              setCurrentAmount(currentAmount);
            }

            adjustCollateralizationRatio(currentAmount);
          }}
          submit={submitTrade}
        />
        <Slider
          dots
          value={((currentAmount ?? 0) / maxInput) * 100}
          min={0}
          max={100}
          step={1}
          disabled={!userFetched || disabledInput}
          onChange={percent => {
            const currentAmount = maxInput * (percent / 100);
            setCurrentAmount(currentAmount);
            adjustCollateralizationRatio(currentAmount);
          }}
          tipFormatter={value => value + '%'}
          tooltipPlacement="bottom"
          marks={{
            0: '0%',
            25: '25%',
            50: '50%',
            75: '75%',
            100: dictionary.cockpit.max
          }}
        />
      </div>
    </div>
  );
}
