import { useEffect, useState } from 'react';
import type { TradeAction } from '../contexts/tradeContext';
import { useTradeContext } from '../contexts/tradeContext';
import { useLanguage } from '../contexts/localization/localization';
import { useBlockExplorer } from '../contexts/blockExplorer';
import { useTransactionLogs } from '../contexts/transactionLogs';
import { currencyFormatter } from '../utils/currency';
import { shortenPubkey } from '../utils/utils';
import { notification, Select, Slider } from 'antd';
import { Info } from './Info';
import { JetInput } from './JetInput';
import { ConnectMessage } from './ConnectMessage';

// Jet V1
import { useUser } from '../v1/contexts/user';
import { useMarket } from '../v1/contexts/market';
import { useMarginActions } from '../hooks/useMarginActions';
import { PoolAmount, TokenAmount } from '@jet-lab/margin';
import { TxnResponse } from '../v1/models/JetTypes';
import { useMargin } from '../contexts/marginContext';
import { useWallet } from '@solana/wallet-adapter-react';

export function TradePanel(): JSX.Element {
  const { dictionary } = useLanguage();
  const { getExplorerUrl } = useBlockExplorer();
  const { addLog } = useTransactionLogs();
  const { connected } = useWallet();
  const {
    currentReserve,
    currentPool,
    currentAction,
    setCurrentAction,
    currentAmount,
    setCurrentAmount,
    sendingTrade,
    setSendingTrade
  } = useTradeContext();
  const { Option } = Select;
  const tradeActions: TradeAction[] = ['deposit', 'withdraw', 'borrow', 'repay'];

  // Jet V1 Trade Actions
  const userV1 = useUser();
  const market = useMarket();
  const { deposit, withdraw, borrow, repay } = useMarginActions();

  // Jet V2
  const { config, manager, poolsFetched, pools, marginAccount, walletBalances, userFetched } = useMargin();

  // Input values
  const [maxInput, setMaxInput] = useState<number>(0);

  // Disabled components / errors
  const [disabledInput, setDisabledInput] = useState<boolean>(false);
  const [disabledMessage, setDisabledMessage] = useState<string>('');
  const [inputError, setInputError] = useState<string>('');

  // Adjusted c-ratio if trade were to be submitted
  const [adjustedRatio, setAdjustedRatio] = useState<number>(0);

  // Adjust interface
  function adjustInterface() {
    setInputError('');
    getMaxInput();
    adjustCollateralizationRatio();
    checkDisabledInput();
  }

  // Check if user input should be disabled
  // depending on wallet balance and position
  function checkDisabledInput() {
    // Initially set to true and reset message
    setDisabledMessage('');
    setDisabledInput(true);
    if (!userV1 || !currentPool || currentPool === undefined || !currentPool.symbol) {
      return;
    }

    // Depositing
    if (currentAction === 'deposit') {
      // No wallet balance to deposit
      if (walletBalances[currentPool.symbol].amount.isZero()) {
        setDisabledMessage(dictionary.cockpit.noBalanceForDeposit.replaceAll('{{ASSET}}', currentPool.symbol));
      } else if (currentPool.symbol === 'ETH') {
        setDisabledMessage('Sollet ETH will be sunset at the end of April. We do not accept Sollet ETH');
      } else {
        setDisabledInput(false);
      }
      // Withdrawing
    } else if (currentAction === 'withdraw') {
      // No collateral to withdraw
      if (!userV1.collateralBalances[currentPool.symbol]) {
        setDisabledMessage(dictionary.cockpit.noDepositsForWithdraw.replaceAll('{{ASSET}}', currentPool.symbol));
        // User is below PROGRAM minimum c-ratio
      } else if (userV1.position.borrowedValue && userV1.position.colRatio <= market.minColRatio) {
        setDisabledMessage(dictionary.cockpit.belowMinCRatio);
      } else {
        setDisabledInput(false);
      }
      // Borrowing
    } else if (currentAction === 'borrow') {
      // User has not deposited any collateral
      if (walletBalances[currentPool.symbol].amount.isZero()) {
        setDisabledMessage(dictionary.cockpit.noDepositsForBorrow);

        // User is below minimum c-ratio
      } else if (userV1.position.borrowedValue && userV1.position.colRatio <= market.minColRatio) {
        setDisabledMessage(dictionary.cockpit.belowMinCRatio);
        // No liquidity in market to borrow from
      } else if (currentPool.depositedTokens.lamports.isZero()) {
        setDisabledMessage(dictionary.cockpit.noLiquidity);
      } else {
        setDisabledInput(false);
      }
      // Repaying
    } else if (currentAction === 'repay') {
      // User has no loan balance to repay
      if (!userV1.loanBalances[currentPool.symbol]) {
        setDisabledMessage(dictionary.cockpit.noDebtForRepay.replaceAll('{{ASSET}}', currentPool.symbol));
      } else {
        setDisabledInput(false);
      }
    }
  }

  // Get max input for current trade action and reserve
  function getMaxInput() {
    if (!currentPool || currentPool === undefined || !currentPool.symbol) {
      return;
    }

    let max = 0;
    if (userV1.assets?.tokens) {
      if (currentAction === 'deposit') {
        max = walletBalances[currentPool.symbol].amount.tokens;
      } else if (currentAction === 'withdraw') {
        max = userV1.assets.tokens[currentPool.symbol].maxWithdrawAmount;
      } else if (currentAction === 'borrow') {
        max = walletBalances[currentPool.symbol].amount.tokens;
      } else if (currentAction === 'repay') {
        max = userV1.assets.tokens[currentPool.symbol].maxRepayAmount;
      }
    }
    setMaxInput(max);
  }

  // Adjust user input and calculate updated c-ratio if
  // they were to submit current trade
  function adjustCollateralizationRatio(currentAmount = 0) {
    if (!currentReserve || !currentPool || !currentPool.tokenPrice || !userV1.assets) {
      return;
    }

    // Depositing
    if (currentAction === 'deposit') {
      setAdjustedRatio(
        (userV1.position.depositedValue + currentAmount * currentPool.tokenPrice) /
          (userV1.position.borrowedValue > 0 ? userV1.position.borrowedValue : 1)
      );
      // Withdrawing
    } else if (currentAction === 'withdraw') {
      setAdjustedRatio(
        (userV1.position.depositedValue - currentAmount * currentPool.tokenPrice) /
          (userV1.position.borrowedValue > 0 ? userV1.position.borrowedValue : 1)
      );
      // Borrowing
    } else if (currentAction === 'borrow') {
      setAdjustedRatio(
        userV1.position.depositedValue /
          (userV1.position.borrowedValue + currentAmount * currentPool.tokenPrice > 0
            ? userV1.position.borrowedValue + currentAmount * currentPool.tokenPrice
            : 1)
      );
      // Repaying
    } else if (currentAction === 'repay') {
      setAdjustedRatio(
        userV1.position.depositedValue /
          (userV1.position.borrowedValue - currentAmount * currentPool.tokenPrice > 0
            ? userV1.position.borrowedValue - currentAmount * currentPool.tokenPrice
            : 1)
      );
    }
  }

  // Check user input and for Copilot warning
  // Then submit trade RPC call
  async function submitTrade() {
    if (!currentPool || currentPool === undefined || !currentPool.symbol || !userV1.assets || !currentAmount) {
      return;
    }

    const tradeAction = currentAction;
    const tradeAmount = TokenAmount.tokens(currentAmount.toString(), currentPool.decimals);
    let res: TxnResponse = TxnResponse.Cancelled;
    let txids: string[] = [];
    let inputError = '';
    setSendingTrade(true);

    // Depositing
    if (tradeAction === 'deposit') {
      // User is depositing more than they have in their wallet
      if (tradeAmount.tokens > walletBalances[currentPool.symbol].amount.tokens) {
        inputError = dictionary.cockpit.notEnoughAsset.replaceAll('{{ASSET}}', currentPool.symbol);
        // Otherwise, send deposit
      } else {
        const depositAmount = tradeAmount.lamports;
        [res, txids] = await deposit(currentPool.symbol, depositAmount);
      }
      // Withdrawing sollet ETH
    } else if (tradeAction === 'withdraw') {
      // User is withdrawing more than liquidity in market
      if (tradeAmount.gt(currentPool.depositedTokens)) {
        inputError = dictionary.cockpit.noLiquidity;
        // User is withdrawing more than they've deposited
      } else if (tradeAmount.tokens > userV1.collateralBalances[currentPool.symbol]) {
        inputError = dictionary.cockpit.lessFunds;
        // User is below PROGRRAM minimum c-ratio
      } else if (userV1.position.borrowedValue && userV1.position.colRatio <= 1.25) {
        inputError = dictionary.cockpit.belowMinCRatio;
        // Otherwise, send withdraw
      } else {
        // If user is withdrawing all, use collateral notes
        const withdrawAmount =
          tradeAmount.tokens === userV1.collateralBalances[currentPool.symbol]
            ? PoolAmount.notes(userV1.assets.tokens[currentPool.symbol].collateralNoteBalance.lamports)
            : PoolAmount.tokens(tradeAmount.lamports);
        [res, txids] = await withdraw(currentPool.symbol, withdrawAmount);
      }
      // Borrowing
    } else if (tradeAction === 'borrow') {
      // User is borrowing more than liquidity in market
      if (tradeAmount.gt(currentPool.depositedTokens)) {
        inputError = dictionary.cockpit.noLiquidity;
        // User is below the minimum c-ratio
      } else if (userV1.position.borrowedValue && userV1.position.colRatio <= market.minColRatio) {
        inputError = dictionary.cockpit.belowMinCRatio;
        // Otherwise, send borrow
      } else {
        [res, txids] = await borrow(currentPool.symbol, tradeAmount.lamports);
      }
      // Repaying
    } else if (tradeAction === 'repay') {
      // User is repaying more than they owe
      if (tradeAmount.tokens > userV1.loanBalances[currentPool.symbol]) {
        inputError = dictionary.cockpit.oweLess;
        // User input amount is larger than wallet balance
      } else if (tradeAmount.tokens > walletBalances[currentPool.symbol].amount.tokens) {
        inputError = dictionary.cockpit.notEnoughAsset.replaceAll('{{ASSET}}', currentPool.symbol);
        // Otherwise, send repay
      } else {
        // If user is repaying all, use loan notes
        const repayAmount =
          tradeAmount.tokens === userV1.loanBalances[currentPool.symbol]
            ? PoolAmount.notes(userV1.assets.tokens[currentPool.symbol].loanNoteBalance.lamports)
            : PoolAmount.tokens(tradeAmount.lamports);
        [res, txids] = await repay(currentPool.symbol, repayAmount);
      }
    }

    // If input error, remove trade amount and return
    if (inputError) {
      setInputError(inputError);
      setCurrentAmount(null);
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
            className="gradient-text flex align-center justify-between"
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
  }, [userV1.assets, currentReserve, currentAction, currentPool]);

  // If user disconnects wallet, reset inputs
  useEffect(() => {
    setCurrentAmount(null);
  }, [setCurrentAmount, userFetched]);

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
      {!connected ? <ConnectMessage /> : <></>}
      {disabledMessage ? (
        <div className="trade-section trade-section-disabled-message flex-centered column">
          <span className="center-text">{disabledMessage}</span>
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
                  : dictionary.cockpit.depositedTokens.toUpperCase()
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
                ? (userV1.position.borrowedValue || (currentAction === 'borrow' && currentAmount)) && adjustedRatio > 10
                  ? '>1000%'
                  : (userV1.position.borrowedValue || (currentAction === 'borrow' && currentAmount)) &&
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
