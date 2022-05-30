import { useEffect, useState } from 'react';
import type { TradeAction } from '../contexts/tradeContext';
import { useTradeContext } from '../contexts/tradeContext';
import { useDarkTheme } from '../contexts/darkTheme';
import { useLanguage } from '../contexts/localization/localization';
import { useBlockExplorer } from '../contexts/blockExplorer';
import { Alert, useAlert } from '../contexts/copilotModal';
import { useTransactionLogs } from '../contexts/transactionLogs';
import { currencyFormatter } from '../utils/currency';
import { notification, Select, Slider } from 'antd';
import { Info } from './Info';
import { JetInput } from './JetInput';
import { shortenPubkey } from '../utils/utils';

// Jet V1
import { useUser } from '../v1/contexts/user';
import { useMarket } from '../v1/contexts/market';
import { useJetV1 } from '../v1/hooks/useJetV1';
import { PoolAmount, TokenAmount } from '@jet-lab/margin';
import { TxnResponse } from '../v1/models/JetTypes';
import { useMargin } from '../contexts/marginContext';

export function TradePanel(): JSX.Element {
  const { darkTheme } = useDarkTheme();
  const { dictionary } = useLanguage();
  const { setAlert } = useAlert();
  const { getExplorerUrl } = useBlockExplorer();
  const { addLog } = useTransactionLogs();
  const {
    currentReserve,
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
  const { deposit, withdraw, borrow, repay } = useJetV1();

  // Jet V2
  const { config, programs, poolsFetched, pools, marginAccount, walletBalances, userFetched } = useMargin();

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
    if (!userV1.assets || !currentReserve) {
      return;
    }

    // Depositing
    if (currentAction === 'deposit') {
      // No wallet balance to deposit
      if (!walletBalances[currentReserve.abbrev].amount.tokens) {
        setDisabledMessage(dictionary.cockpit.noBalanceForDeposit.replaceAll('{{ASSET}}', currentReserve.abbrev));
      } else if (currentReserve.abbrev === 'ETH') {
        setDisabledMessage('Sollet ETH will be sunset at the end of April. We do not accept Sollet ETH');
      } else {
        setDisabledInput(false);
      }
      // Withdrawing
    } else if (currentAction === 'withdraw') {
      // No collateral to withdraw
      if (!userV1.collateralBalances[currentReserve.abbrev]) {
        setDisabledMessage(dictionary.cockpit.noDepositsForWithdraw.replaceAll('{{ASSET}}', currentReserve.abbrev));
        // User is below PROGRAM minimum c-ratio
      } else if (userV1.position.borrowedValue && userV1.position.colRatio <= market.minColRatio) {
        setDisabledMessage(dictionary.cockpit.belowMinCRatio);
      } else {
        setDisabledInput(false);
      }
      // Borrowing
    } else if (currentAction === 'borrow') {
      // User has not deposited any collateral
      if (!userV1.position.depositedValue) {
        setDisabledMessage(dictionary.cockpit.noDepositsForBorrow);
        // User is below minimum c-ratio
      } else if (currentReserve.abbrev === 'ETH') {
        setDisabledMessage('Sollet ETH will be sunset at the end of April. Borrowing ETH is not available');
      } else if (userV1.position.borrowedValue && userV1.position.colRatio <= market.minColRatio) {
        setDisabledMessage(dictionary.cockpit.belowMinCRatio);
        // No liquidity in market to borrow from
      } else if (currentReserve.availableLiquidity.lamports.isZero()) {
        setDisabledMessage(dictionary.cockpit.noLiquidity);
      } else {
        setDisabledInput(false);
      }
      // Repaying
    } else if (currentAction === 'repay') {
      // User has no loan balance to repay
      if (!userV1.loanBalances[currentReserve.abbrev]) {
        setDisabledMessage(dictionary.cockpit.noDebtForRepay.replaceAll('{{ASSET}}', currentReserve.abbrev));
      } else {
        setDisabledInput(false);
      }
    }
  }

  // Get max input for current trade action and reserve
  function getMaxInput() {
    if (!currentReserve) {
      return;
    }

    let max = 0;
    if (userV1.assets?.tokens) {
      if (currentAction === 'deposit') {
        max = userV1.assets.tokens[currentReserve.abbrev].maxDepositAmount;
      } else if (currentAction === 'withdraw') {
        max = userV1.assets.tokens[currentReserve.abbrev].maxWithdrawAmount;
      } else if (currentAction === 'borrow') {
        max = userV1.assets.tokens[currentReserve.abbrev].maxBorrowAmount;
      } else if (currentAction === 'repay') {
        max = userV1.assets.tokens[currentReserve.abbrev].maxRepayAmount;
      }
    }
    setMaxInput(max);
  }

  // Adjust user input and calculate updated c-ratio if
  // they were to submit current trade
  function adjustCollateralizationRatio(currentAmount = 0) {
    if (!currentReserve || !userV1.assets) {
      return;
    }

    // Depositing
    if (currentAction === 'deposit') {
      setAdjustedRatio(
        (userV1.position.depositedValue + currentAmount * currentReserve.price) /
          (userV1.position.borrowedValue > 0 ? userV1.position.borrowedValue : 1)
      );
      // Withdrawing
    } else if (currentAction === 'withdraw') {
      setAdjustedRatio(
        (userV1.position.depositedValue - currentAmount * currentReserve.price) /
          (userV1.position.borrowedValue > 0 ? userV1.position.borrowedValue : 1)
      );
      // Borrowing
    } else if (currentAction === 'borrow') {
      setAdjustedRatio(
        userV1.position.depositedValue /
          (userV1.position.borrowedValue + currentAmount * currentReserve.price > 0
            ? userV1.position.borrowedValue + currentAmount * currentReserve.price
            : 1)
      );
      // Repaying
    } else if (currentAction === 'repay') {
      setAdjustedRatio(
        userV1.position.depositedValue /
          (userV1.position.borrowedValue - currentAmount * currentReserve.price > 0
            ? userV1.position.borrowedValue - currentAmount * currentReserve.price
            : 1)
      );
    }
  }

  // Check user's trade and offer Copilot warning
  // if necessary, otherwise begin trade submit
  function checkCopilotTradeWarning() {
    let copilotAlert: Alert | undefined = undefined;
    if (!currentReserve) {
      return;
    }

    if (!currentAmount) {
      setInputError(dictionary.cockpit.nocurrentAmount);
      setCurrentAmount(null);
      return;
    }

    // Depositing
    if (currentAction === 'deposit') {
      // User is opening an account, inform them of rent fee
      /* TODO add this back in for rent fee
      if (!user.position.loanNoteMintPubkey) {
        copilotAlert = {
          status: 'neutral',
          overview: dictionary.cockpit.welcomeAboard,
          detail: <span>dictionary.cockpit.rentFeeDescription</span>,
          solution: <span>dictionary.cockpit.rentFeeDetail
            .replace('{{RENT_FEE}}', 0) //TODO: Rent fee here
            .replace('{{TRADE ACTION}}', dictionary.transactions.withdraw)</span>,
          action: {
            text: dictionary.cockpit.confirm,
            onClick: () => submitTrade()
          }
        };

      // Depositing all SOL leaving no lamports for fees, inform and reject
      } else */ if (
        currentReserve.abbrev === 'SOL' &&
        currentAmount <= walletBalances[currentReserve.abbrev].amount.tokens &&
        currentAmount > walletBalances[currentReserve.abbrev].amount.tokens - 0.02
      ) {
        copilotAlert = {
          status: 'danger',
          detail: <span>{dictionary.cockpit.insufficientLamports}</span>,
          closeable: true
        };
      }
      // Withdrawing
    } else if (currentAction === 'withdraw') {
      // User is withdrawing between 125% and 130%, allow trade but warn them
      if (userV1.position.borrowedValue && adjustedRatio > 0 && adjustedRatio <= market.minColRatio + 0.05) {
        copilotAlert = {
          status: 'danger',
          detail: (
            <span>
              {dictionary.cockpit.subjectToLiquidation
                .replaceAll('{{NEW-C-RATIO}}', currencyFormatter(adjustedRatio * 100, false, 1))
                .replaceAll('{{MIN-C-RATIO}}', currencyFormatter(market.minColRatio * 100, false, 1))
                .replaceAll('{{TRADE ACTION}}', dictionary.cockpit.withdraw.toLowerCase())}
            </span>
          ),
          closeable: true,
          action: {
            text: dictionary.cockpit.confirm,
            onClick: () => submitTrade()
          }
        };
      }
      // Borrowing
    } else if (currentAction === 'borrow') {
      // User is opening an account, inform them of rent fee
      /* TODO add this back in for rent fee
      if (!user.position.loanNoteMintPubkey) {
        copilotAlert = {
          status: 'neutral',
          overview: dictionary.cockpit.welcomeAboard,
          detail: <span>dictionary.cockpit.rentFeeDescription</span>,
          solution: <span>dictionary.cockpit.rentFeeDetail
            .replace('{{RENT_FEE}}', 0) //TODO: Rent fee here
            .replace('{{TRADE ACTION}}', dictionary.transactions.repay.toLowerCase())</span>,
          action: {
            text: dictionary.cockpit.confirm,
            onClick: () => submitTrade()
          }
        };
      // In danger of liquidation
      } else */ if (adjustedRatio <= market.minColRatio + 0.2) {
        // but not below min-ratio, warn and allow trade
        if (adjustedRatio >= market.minColRatio || !userV1.position.borrowedValue) {
          copilotAlert = {
            status: 'danger',
            detail: (
              <span>
                {dictionary.cockpit.subjectToLiquidation
                  .replaceAll('{{NEW-C-RATIO}}', currencyFormatter(adjustedRatio * 100, false, 1))
                  .replaceAll('{{MIN-C-RATIO}}', currencyFormatter(market.minColRatio * 100, false, 1))
                  .replaceAll('{{TRADE ACTION}}', dictionary.cockpit.borrow.toLowerCase())}
              </span>
            ),
            closeable: true,
            action: {
              text: dictionary.cockpit.confirm,
              onClick: () => submitTrade()
            }
          };
          // and below minimum ratio, inform and reject
        } else if (adjustedRatio < market.minColRatio && adjustedRatio < userV1.position.colRatio) {
          copilotAlert = {
            status: 'danger',
            detail: (
              <span>
                {dictionary.cockpit.rejectTrade
                  .replaceAll('{{NEW-C-RATIO}}', currencyFormatter(adjustedRatio * 100, false, 1))
                  .replaceAll('{{JET MIN C-RATIO}}', market.minColRatio * 100)}
              </span>
            ),
            closeable: true
          };
        }
      }
    }

    // If no alert, submit trade
    if (copilotAlert) {
      setAlert(copilotAlert);
    } else {
      submitTrade();
    }
  }

  // Check user input and for Copilot warning
  // Then submit trade RPC call
  async function submitTrade() {
    if (!currentReserve || !userV1.assets || !currentAmount) {
      return;
    }

    const tradeAction = currentAction;
    const tradeAmount = TokenAmount.tokens(currentAmount.toString(), currentReserve.decimals);
    let res: TxnResponse = TxnResponse.Cancelled;
    let txids: string[] = [];
    let inputError = '';
    setSendingTrade(true);
    // Depositing
    if (tradeAction === 'deposit') {
      // User is depositing more than they have in their wallet
      if (tradeAmount.tokens > walletBalances[currentReserve.abbrev].amount.tokens) {
        inputError = dictionary.cockpit.notEnoughAsset.replaceAll('{{ASSET}}', currentReserve.abbrev);
        // Otherwise, send deposit
      } else {
        const depositAmount = tradeAmount.lamports;
        [res, txids] = await deposit(currentReserve.abbrev, depositAmount);
      }
      // Withdrawing sollet ETH
    } else if (tradeAction === 'withdraw') {
      // User is withdrawing more than liquidity in market
      if (tradeAmount.gt(currentReserve.availableLiquidity)) {
        inputError = dictionary.cockpit.noLiquidity;
        // User is withdrawing more than they've deposited
      } else if (tradeAmount.tokens > userV1.collateralBalances[currentReserve.abbrev]) {
        inputError = dictionary.cockpit.lessFunds;
        // User is below PROGRRAM minimum c-ratio
      } else if (userV1.position.borrowedValue && userV1.position.colRatio <= 1.25) {
        inputError = dictionary.cockpit.belowMinCRatio;
        // Otherwise, send withdraw
      } else {
        // If user is withdrawing all, use collateral notes
        const withdrawAmount =
          tradeAmount.tokens === userV1.collateralBalances[currentReserve.abbrev]
            ? PoolAmount.notes(userV1.assets.tokens[currentReserve.abbrev].collateralNoteBalance.lamports)
            : PoolAmount.tokens(tradeAmount.lamports);
        [res, txids] = await withdraw(currentReserve.abbrev, withdrawAmount);
      }
      // Borrowing
    } else if (tradeAction === 'borrow') {
      // User is borrowing more than liquidity in market
      if (tradeAmount.gt(currentReserve.availableLiquidity)) {
        inputError = dictionary.cockpit.noLiquidity;
        // User is below the minimum c-ratio
      } else if (userV1.position.borrowedValue && userV1.position.colRatio <= market.minColRatio) {
        inputError = dictionary.cockpit.belowMinCRatio;
        // Otherwise, send borrow
      } else {
        [res, txids] = await borrow(currentReserve.abbrev, tradeAmount.lamports);
      }
      // Repaying
    } else if (tradeAction === 'repay') {
      // User is repaying more than they owe
      if (tradeAmount.tokens > userV1.loanBalances[currentReserve.abbrev]) {
        inputError = dictionary.cockpit.oweLess;
        // User input amount is larger than wallet balance
      } else if (tradeAmount.tokens > walletBalances[currentReserve.abbrev].amount.tokens) {
        inputError = dictionary.cockpit.notEnoughAsset.replaceAll('{{ASSET}}', currentReserve.abbrev);
        // Otherwise, send repay
      } else {
        // If user is repaying all, use loan notes
        const repayAmount =
          tradeAmount.tokens === userV1.loanBalances[currentReserve.abbrev]
            ? PoolAmount.notes(userV1.assets.tokens[currentReserve.abbrev].loanNoteBalance.lamports)
            : PoolAmount.tokens(tradeAmount.lamports);
        [res, txids] = await repay(currentReserve.abbrev, repayAmount);
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
  }, [userV1.assets, currentReserve, currentAction]);

  // If user disconnects wallet, reset inputs
  useEffect(() => {
    setCurrentAmount(null);
  }, [userFetched]);

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
            className={`trade-select flex justify-center align-center ${currentAction === action ? 'active' : ''} ${
              darkTheme ? 'dark' : ''
            }`}>
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
        ;
      </div>
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
                ? currentReserve && maxInput <= currentReserve.availableLiquidity.tokens
                  ? dictionary.cockpit.maxBorrowAmount.toUpperCase()
                  : dictionary.cockpit.availableLiquidity.toUpperCase()
                : dictionary.cockpit.amountOwed.toUpperCase()}
            </span>
            <div className="flex-centered">
              <p className="center-text">
                {userFetched && currentReserve
                  ? currencyFormatter(maxInput, false, currentReserve.decimals) + ' ' + currentReserve.abbrev
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
          submit={() => checkCopilotTradeWarning()}
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
