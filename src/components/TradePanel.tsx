import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { MarginAccount, PoolAmount, TokenAmount } from '@jet-lab/margin';
import { TxnResponse } from '../models/JetTypes';
import { useMargin } from '../contexts/marginContext';
import type { TradeAction } from '../contexts/tradeContext';
import { useTradeContext } from '../contexts/tradeContext';
import { useLanguage } from '../contexts/localization/localization';
import { useTransactionLogs } from '../contexts/transactionLogs';
import { useMarginActions } from '../hooks/useMarginActions';
import { currencyFormatter } from '../utils/currency';
import { notification, Select, Slider } from 'antd';
import { JetInput } from './JetInput';
import { ConnectMessage } from './ConnectMessage';

export function TradePanel(): JSX.Element {
  const { dictionary } = useLanguage();
  const { pools, marginAccount, walletBalances, userFetched } = useMargin();
  const { refreshLogs } = useTransactionLogs();
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
  const accountPoolPosition = marginAccount && currentPool?.symbol && marginAccount.poolPositions[currentPool.symbol];
  const accountSummary = marginAccount && marginAccount.summary;
  const adjustedRiskIndicator = 0; /* TODO: getadjustedRiskIndicator() from lib */
  const maxInput = accountPoolPosition?.maxTradeAmounts[currentAction].tokens ?? 0;
  const [disabledInput, setDisabledInput] = useState<boolean>(false);
  const [disabledMessage, setDisabledMessage] = useState<string>('');
  const [disabledButton, setDisabledButton] = useState<boolean>(false);
  const [inputError, setInputError] = useState<string>('');
  const tradeActions: TradeAction[] = ['deposit', 'withdraw', 'borrow', 'repay'];
  const { deposit, withdraw, borrow, repay } = useMarginActions();
  const { Option } = Select;

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
      } else {
        setDisabledInput(false);
      }
      // Withdrawing
    } else if (currentAction === 'withdraw') {
      // No collateral to withdraw
      if (!accountPoolPosition?.depositBalance.tokens) {
        setDisabledMessage(dictionary.cockpit.noDepositsForWithdraw.replaceAll('{{ASSET}}', currentPool.symbol));
        // User is above max risk
      } else if (marginAccount && marginAccount.riskIndicator >= MarginAccount.RISK_LIQUIDATION_LEVEL) {
        setDisabledMessage(dictionary.cockpit.aboveMaxRiskLevel);
      } else {
        setDisabledInput(false);
      }
      // Borrowing
    } else if (currentAction === 'borrow') {
      // User has not deposited any collateral
      if (!accountSummary?.depositedValue) {
        setDisabledMessage(dictionary.cockpit.noDepositsForBorrow);
        // User is above max risk
      } else if (marginAccount && marginAccount.riskIndicator >= MarginAccount.RISK_LIQUIDATION_LEVEL) {
        setDisabledMessage(dictionary.cockpit.aboveMaxRiskLevel);
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

  // Check user input and for Copilot warning
  // Then submit trade RPC call
  async function submitTrade() {
    if (!currentPool?.symbol || !accountPoolPosition || !accountSummary || !currentAmount) {
      return;
    }

    const tradeAction = currentAction;
    const tradeAmount = TokenAmount.tokens(currentAmount.toString(), currentPool.decimals);
    let res: TxnResponse = TxnResponse.Cancelled;
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
        res = await deposit(currentPool.symbol, depositAmount);
      }
      // Withdrawing sollet ETH
    } else if (tradeAction === 'withdraw') {
      // User is withdrawing more than liquidity in market
      if (tradeAmount.gt(currentPool.depositedTokens)) {
        tradeError = dictionary.cockpit.noLiquidity;
        // User is withdrawing more than they've deposited
      } else if (tradeAmount.tokens > accountPoolPosition.depositBalance.tokens) {
        tradeError = dictionary.cockpit.lessFunds;
        // Otherwise, send withdraw
      } else {
        // If user is withdrawing all, use collateral notes
        const withdrawAmount =
          tradeAmount.tokens === accountPoolPosition.depositBalance.tokens
            ? PoolAmount.notes(accountPoolPosition.depositBalanceNotes)
            : PoolAmount.tokens(tradeAmount.lamports);
        res = await withdraw(currentPool.symbol, withdrawAmount);
      }
      // Borrowing
    } else if (tradeAction === 'borrow') {
      // User is borrowing more than liquidity in market
      if (tradeAmount.gt(currentPool.depositedTokens)) {
        tradeError = dictionary.cockpit.noLiquidity;
        // User is above max risk
      } else if (marginAccount && marginAccount.riskIndicator >= MarginAccount.RISK_LIQUIDATION_LEVEL) {
        tradeError = dictionary.cockpit.aboveMaxRiskLevel;
        // Otherwise, send borrow
      } else {
        res = await borrow(currentPool.symbol, tradeAmount.lamports);
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
        // FIXME! Bring back repay all
        // const repayAmount =
        //   tradeAmount.tokens === accountPoolPosition.loanBalance.tokens
        //     ? PoolAmount.notes(accountPoolPosition.loanBalanceNotes)
        //     : PoolAmount.tokens(tradeAmount.lamports);
        res = await repay(currentPool.symbol, tradeAmount.lamports);
      }
    }

    // If input error, remove trade amount and return`
    if (tradeError) {
      setInputError(tradeError);
      setSendingTrade(false);
      return;
    }

    // Notify user of successful/unsuccessful trade
    if (res === TxnResponse.Success) {
      notification.success({
        message: dictionary.cockpit.txSuccessShort.replaceAll(
          '{{TRADE ACTION}}',
          tradeAction[0].toUpperCase() + tradeAction.substring(1)
        ),
        description: dictionary.cockpit.txSuccess
          .replaceAll('{{TRADE ACTION}}', currentAction)
          .replaceAll('{{AMOUNT AND ASSET}}', `${currentAmount}${currentPool.symbol}`),
        placement: 'bottomLeft'
      });

      // Add Tx Log
      refreshLogs();
      setCurrentAmount(null);
    } else if (res === TxnResponse.Failed) {
      notification.error({
        message: dictionary.cockpit.txFailedShort,
        description: dictionary.cockpit.txFailed,
        placement: 'bottomLeft'
      });
    } else if (res === TxnResponse.Cancelled) {
      notification.error({
        message: dictionary.cockpit.txFailedShort,
        description: dictionary.cockpit.txCancelled,
        placement: 'bottomLeft'
      });
    }

    // Readjust interface
    checkDisabledInput();
    // End trade submit
    setSendingTrade(false);
  }

  // Readjust interface onmount
  // and current reserve change
  useEffect(() => {
    checkDisabledInput();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPool, accountPoolPosition, accountSummary, currentAction]);

  // If user disconnects wallet, reset inputs
  useEffect(() => {
    setCurrentAmount(null);
  }, [setCurrentAmount, userFetched]);

  // On user input, check for error
  useEffect(() => {
    setDisabledButton(false);
    setInputError('');
    if (!currentPool || !currentAmount) {
      return;
    }

    // Withdrawing
    if (currentAction === 'withdraw') {
      if (
        adjustedRiskIndicator >= MarginAccount.RISK_WARNING_LEVEL &&
        adjustedRiskIndicator <= MarginAccount.RISK_LIQUIDATION_LEVEL
      ) {
        setInputError(
          dictionary.cockpit.subjectToLiquidation.replaceAll(
            '{{NEW-RISK}}',
            currencyFormatter(adjustedRiskIndicator, false, 1)
          )
        );
      }
      // Borrowing
    } else if (currentAction === 'borrow') {
      if (
        adjustedRiskIndicator >= MarginAccount.RISK_WARNING_LEVEL &&
        adjustedRiskIndicator <= MarginAccount.RISK_LIQUIDATION_LEVEL
      ) {
        setInputError(
          dictionary.cockpit.subjectToLiquidation.replaceAll(
            '{{NEW-RISK}}',
            currencyFormatter(adjustedRiskIndicator, false, 1)
          )
        );
      } else if (adjustedRiskIndicator >= MarginAccount.RISK_LIQUIDATION_LEVEL) {
        setInputError(
          dictionary.cockpit.rejectTrade
            .replaceAll('{{NEW_RISK}}', currencyFormatter(adjustedRiskIndicator, false, 1))
            .replaceAll('{{MAX_RISK}}', currencyFormatter(1 / MarginAccount.RISK_LIQUIDATION_LEVEL, false, 1))
        );
        setDisabledButton(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAmount, currentAction]);

  return (
    <div className="trade-panel flex align-center justify-start">
      <div className="trade-select-container flex align-center justify-between">
        {tradeActions.map(action => (
          <div
            key={action}
            onClick={() => {
              if (!sendingTrade) {
                setCurrentAction(action);
                checkDisabledInput();
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
                checkDisabledInput();
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
      {disabledMessage.length || inputError.length ? (
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
              <p className="center-text max-amount" onClick={() => setCurrentAmount(maxInput)}>
                {userFetched && currentPool
                  ? currencyFormatter(maxInput, false, currentPool.decimals) + ' ' + currentPool.symbol
                  : '--'}
              </p>
            </div>
          </div>
          <div className={`trade-section flex-centered column ${disabledInput ? 'disabled' : ''}`}>
            <div className="flex-centered">
              <span className="center-text bold-text">{dictionary.cockpit.adjustedRiskLevel.toUpperCase()}</span>
            </div>
            <p>{userFetched && currentAmount ? adjustedRiskIndicator : '--'}</p>
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
          disabledButton={disabledButton}
          loading={sendingTrade}
          error={inputError}
          onChange={(value: number) => {
            const newAmount = value;
            if (newAmount < 0) {
              setCurrentAmount(0);
            } else {
              setCurrentAmount(newAmount);
            }
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
            if (!currentPool) {
              return;
            }

            const value = maxInput * ((percent ?? 0) / 100);
            const newAmount = (value * 10 ** currentPool.decimals) / 10 ** currentPool.decimals;
            setCurrentAmount(parseFloat(newAmount.toFixed(currentPool.decimals)));
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
