import { useEffect, useState } from 'react';
import type { TradeAction } from '../contexts/tradeContext';
import { useTradeContext } from '../contexts/tradeContext';
import { useDarkTheme } from '../contexts/darkTheme';
import { useLanguage } from '../contexts/localization/localization';
import { useBlockExplorer } from '../contexts/blockExplorer';
import { useAlert } from '../contexts/copilotModal';
import { useTransactionLogs } from '../contexts/transactionLogs';
import { currencyFormatter } from '../utils/currency';
import { notification, Slider } from 'antd';
import { Info } from './Info';
import { JetInput } from './JetInput';
import { shortenPubkey } from '../utils/utils';

// Jet V1
import { useUser } from '../v1/contexts/user';
import { useMarket } from '../v1/contexts/market';
import { useJetV1 } from '../v1/hooks/useJetV1';
import { Amount, TokenAmount } from '../v1/util/tokens';
import { TxnResponse } from '../v1/models/JetTypes';

export function TradePanel(): JSX.Element {
  const { darkTheme } = useDarkTheme();
  const { dictionary } = useLanguage();
  const { setAlert } = useAlert();
  const { getExplorerUrl } = useBlockExplorer();
  const { addLog } = useTransactionLogs();
  const { currentReserve, currentAction, setCurrentAction } = useTradeContext();

  // Jet V1 Trade Actions
  const user = useUser();
  const market = useMarket();
  const { deposit, withdraw, borrow, repay } = useJetV1();

  // Input values
  const [inputAmount, setInputAmount] = useState<number | null>(null);
  const [maxInput, setMaxInput] = useState<number>(0);

  // Disabled components / errors
  const [disabledInput, setDisabledInput] = useState<boolean>(false);
  const [disabledMessage, setDisabledMessage] = useState<string>('');
  const [inputError, setInputError] = useState<string>('');

  // Adjusted c-ratio if trade were to be submitted
  const [adjustedRatio, setAdjustedRatio] = useState<number>(0);

  // Loading when we send trade
  const [loading, setLoading] = useState<boolean>(false);

  // Adjust interface
  function adjustInterface() {
    setInputError('');
    setInputAmount(null);
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
    if (!user.assets || !currentReserve) {
      return;
    }

    // Depositing
    if (currentAction === 'deposit') {
      // No wallet balance to deposit
      if (!user.walletBalances[currentReserve.abbrev]) {
        setDisabledMessage(dictionary.cockpit.noBalanceForDeposit.replaceAll('{{ASSET}}', currentReserve.abbrev));
      } else {
        setDisabledInput(false);
      }
      // Withdrawing
    } else if (currentAction === 'withdraw') {
      // No collateral to withdraw
      if (!user.collateralBalances[currentReserve.abbrev]) {
        setDisabledMessage(dictionary.cockpit.noDepositsForWithdraw.replaceAll('{{ASSET}}', currentReserve.abbrev));
        // User is below PROGRRAM minimum c-ratio
        // TODO: Need this from idl or something?
      } else if (user.position.borrowedValue && user.position.colRatio <= 1.25) {
        setDisabledMessage(dictionary.cockpit.belowMinCRatio);
      } else {
        setDisabledInput(false);
      }
      // Borrowing
    } else if (currentAction === 'borrow') {
      // User has not deposited any collateral
      if (!user.position.depositedValue) {
        setDisabledMessage(dictionary.cockpit.noDepositsForBorrow);
        // User is below minimum c-ratio
      } else if (user.position.borrowedValue && user.position.colRatio <= market.minColRatio) {
        setDisabledMessage(dictionary.cockpit.belowMinCRatio);
        // No liquidity in market to borrow from
      } else if (currentReserve.availableLiquidity.amount.isZero()) {
        setDisabledMessage(dictionary.cockpit.noLiquidity);
      } else {
        setDisabledInput(false);
      }
      // Repaying
    } else if (currentAction === 'repay') {
      // User has no loan balance to repay
      if (!user.loanBalances[currentReserve.abbrev]) {
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
    if (user.assets?.tokens) {
      if (currentAction === 'deposit') {
        max = user.assets.tokens[currentReserve.abbrev].maxDepositAmount;
      } else if (currentAction === 'withdraw') {
        max = user.assets.tokens[currentReserve.abbrev].maxWithdrawAmount;
      } else if (currentAction === 'borrow') {
        max = user.assets.tokens[currentReserve.abbrev].maxBorrowAmount;
      } else if (currentAction === 'repay') {
        max = user.assets.tokens[currentReserve.abbrev].maxRepayAmount;
      }
    }
    setMaxInput(max);
  }

  // Adjust user input and calculate updated c-ratio if
  // they were to submit current trade
  function adjustCollateralizationRatio() {
    if (!currentReserve || !user.assets) {
      return;
    }

    // Depositing
    if (currentAction === 'deposit') {
      setAdjustedRatio(
        (user.position.depositedValue + (inputAmount ?? 0) * currentReserve.price) /
          (user.position.borrowedValue > 0 ? user.position.borrowedValue : 1)
      );
      // Withdrawing
    } else if (currentAction === 'withdraw') {
      setAdjustedRatio(
        (user.position.depositedValue - (inputAmount ?? 0) * currentReserve.price) /
          (user.position.borrowedValue > 0 ? user.position.borrowedValue : 1)
      );
      // Borrowing
    } else if (currentAction === 'borrow') {
      setAdjustedRatio(
        user.position.depositedValue /
          (user.position.borrowedValue + (inputAmount ?? 0) * currentReserve.price > 0
            ? user.position.borrowedValue + (inputAmount ?? 0) * currentReserve.price
            : 1)
      );
      // Repaying
    } else if (currentAction === 'repay') {
      setAdjustedRatio(
        user.position.depositedValue /
          (user.position.borrowedValue - (inputAmount ?? 0) * currentReserve.price > 0
            ? user.position.borrowedValue - (inputAmount ?? 0) * currentReserve.price
            : 1)
      );
    }
  }

  // Check user's trade and offer Copilot warning
  // if necessary, otherwise begin trade submit
  function checkCopilotTradeWarning() {
    let copilotAlert: any;
    if (!currentReserve) {
      return;
    }

    if (!inputAmount) {
      setInputError(dictionary.cockpit.noInputAmount);
      setInputAmount(null);
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
          detail: dictionary.cockpit.rentFeeDescription,
          solution: dictionary.cockpit.rentFeeDetail
            .replace('{{RENT_FEE}}', 0) //TODO: Rent fee here
            .replace('{{TRADE ACTION}}', dictionary.transactions.withdraw),
          action: {
            text: dictionary.cockpit.confirm,
            onClick: () => submitTrade()
          }
        };
        
      // Depositing all SOL leaving no lamports for fees, inform and reject
      } else */ if (
        currentReserve.abbrev === 'SOL' &&
        inputAmount >= user.walletBalances[currentReserve.abbrev] - 0.02
      ) {
        copilotAlert = {
          status: 'failure',
          detail: dictionary.cockpit.insufficientLamports
        };
      }
      // Withdrawing
    } else if (currentAction === 'withdraw') {
      // User is withdrawing between 125% and 130%, allow trade but warn them
      if (adjustedRatio > 0 && adjustedRatio <= market.minColRatio + 0.05) {
        copilotAlert = {
          status: 'failure',
          detail: dictionary.cockpit.subjectToLiquidation
            .replaceAll('{{NEW-C-RATIO}}', currencyFormatter(adjustedRatio * 100, false, 1))
            .replaceAll('{{MIN-C-RATIO}}', currencyFormatter(market.minColRatio * 100, false, 1))
            .replaceAll('{{TRADE ACTION}}', dictionary.cockpit.withdraw.toLowerCase()),
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
          detail: dictionary.cockpit.rentFeeDescription,
          solution: dictionary.cockpit.rentFeeDetail
            .replace('{{RENT_FEE}}', 0) //TODO: Rent fee here
            .replace('{{TRADE ACTION}}', dictionary.transactions.repay.toLowerCase()),
          action: {
            text: dictionary.cockpit.confirm,
            onClick: () => submitTrade()
          }
        };
      // In danger of liquidation
      } else */ if (adjustedRatio <= market.minColRatio + 0.2) {
        // but not below min-ratio, warn and allow trade
        if (adjustedRatio >= market.minColRatio) {
          copilotAlert = {
            status: 'failure',
            detail: dictionary.cockpit.subjectToLiquidation
              .replaceAll('{{NEW-C-RATIO}}', currencyFormatter(adjustedRatio * 100, false, 1))
              .replaceAll('{{MIN-C-RATIO}}', currencyFormatter(market.minColRatio * 100, false, 1))
              .replaceAll('{{TRADE ACTION}}', dictionary.cockpit.borrow.toLowerCase()),
            action: {
              text: dictionary.cockpit.confirm,
              onClick: () => submitTrade()
            }
          };
          // and below minimum ratio, inform and reject
        } else if (adjustedRatio < market.minColRatio && adjustedRatio < user.position.colRatio) {
          copilotAlert = {
            status: 'failure',
            detail: dictionary.cockpit.rejectTrade
              .replaceAll('{{NEW-C-RATIO}}', currencyFormatter(adjustedRatio * 100, false, 1))
              .replaceAll('{{JET MIN C-RATIO}}', market.minColRatio * 100)
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
    if (!currentReserve || !user.assets || !inputAmount) {
      return;
    }

    const tradeAction = currentAction;
    const tradeAmount = TokenAmount.tokens(inputAmount.toString(), currentReserve.decimals);
    let res: TxnResponse = TxnResponse.Cancelled;
    let txids: string[] = [];
    setLoading(true);
    // Depositing
    if (tradeAction === 'deposit') {
      // User is depositing more than they have in their wallet
      if (tradeAmount.tokens > user.walletBalances[currentReserve.abbrev]) {
        setInputError(dictionary.cockpit.notEnoughAsset.replaceAll('{{ASSET}}', currentReserve.abbrev));
        // Otherwise, send deposit
      } else {
        const depositAmount = tradeAmount.amount;
        [res, txids] = await deposit(currentReserve.abbrev, depositAmount);
      }
      // Withdrawing
    } else if (tradeAction === 'withdraw') {
      // User is withdrawing more than liquidity in market
      if (tradeAmount.gt(currentReserve.availableLiquidity)) {
        setInputError(dictionary.cockpit.noLiquidity);
        // User is withdrawing more than they've deposited
      } else if (tradeAmount.tokens > user.collateralBalances[currentReserve.abbrev]) {
        setInputError(dictionary.cockpit.lessFunds);
        // User is below PROGRRAM minimum c-ratio
      } else if (user.position.borrowedValue && user.position.colRatio <= 1.25) {
        setInputError(dictionary.cockpit.belowMinCRatio);
        // Otherwise, send withdraw
      } else {
        // If user is withdrawing all, use collateral notes
        const withdrawAmount =
          tradeAmount.tokens === user.collateralBalances[currentReserve.abbrev]
            ? Amount.depositNotes(user.assets.tokens[currentReserve.abbrev].collateralNoteBalance.amount)
            : Amount.tokens(tradeAmount.amount);
        [res, txids] = await withdraw(currentReserve.abbrev, withdrawAmount);
      }
      // Borrowing
    } else if (tradeAction === 'borrow') {
      // User is borrowing more than liquidity in market
      if (tradeAmount.gt(currentReserve.availableLiquidity)) {
        setInputError(dictionary.cockpit.noLiquidity);
        // User is below the minimum c-ratio
      } else if (user.position.borrowedValue && user.position.colRatio <= market.minColRatio) {
        setInputError(dictionary.cockpit.belowMinCRatio);
        // Otherwise, send borrow
      } else {
        const borrowAmount = Amount.tokens(tradeAmount.amount);
        [res, txids] = await borrow(currentReserve.abbrev, borrowAmount);
      }
      // Repaying
    } else if (tradeAction === 'repay') {
      // User is repaying more than they owe
      if (tradeAmount.tokens > user.loanBalances[currentReserve.abbrev]) {
        setInputError(dictionary.cockpit.oweLess);
        // User input amount is larger than wallet balance
      } else if (tradeAmount.tokens > user.walletBalances[currentReserve.abbrev]) {
        setInputError(dictionary.cockpit.notEnoughAsset.replaceAll('{{ASSET}}', currentReserve.abbrev));
        // Otherwise, send repay
      } else {
        // If user is repaying all, use loan notes
        const repayAmount =
          tradeAmount.tokens === user.loanBalances[currentReserve.abbrev]
            ? Amount.loanNotes(user.assets.tokens[currentReserve.abbrev].loanNoteBalance.amount)
            : Amount.tokens(tradeAmount.amount);
        [res, txids] = await repay(currentReserve.abbrev, repayAmount);
      }
    }

    // If input error, remove trade amount and return
    if (inputError) {
      setInputAmount(null);
      setLoading(false);
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
            className="text-gradient flex align-center justify-between"
            style={{ width: '100%', margin: 'unset' }}>
            {shortenPubkey(lastTxn, 8)}
            <i className="fas fa-external-link-alt"></i>
          </a>
        )
      });

      // Add Tx Log
      addLog(lastTxn);
    } else if (res === TxnResponse.Failed) {
      notification.error({
        message: dictionary.copilot.alert.failed,
        description: dictionary.cockpit.txFailed
      });
    } else if (res === TxnResponse.Cancelled) {
      notification.error({
        message: dictionary.copilot.alert.failed,
        description: dictionary.cockpit.txCancelled
      });
    }

    // Readjust interface
    adjustInterface();
    // End trade submit
    setLoading(false);
  }

  // Readjust interface onmount
  // and current reserve change
  useEffect(() => {
    adjustInterface();
  }, [user.assets, currentReserve, currentAction]);

  return (
    <div className="trade-panel flex align-center justify-start">
      <div className="trade-select-container flex align-center justify-between">
        {['deposit', 'withdraw', 'borrow', 'repay'].map(action => (
          <div
            key={action}
            onClick={() => {
              if (!loading) {
                setCurrentAction(action as TradeAction);
                adjustInterface();
              }
            }}
            className={`trade-select flex justify-center align-center ${currentAction === action ? 'active' : ''} ${
              darkTheme ? 'dark' : ''
            }`}>
            <p className="text-gradient semi-bold-text">{dictionary.cockpit[action].toUpperCase()}</p>
          </div>
        ))}
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
                {user.walletInit && currentReserve
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
              {user.walletInit
                ? (user.position.borrowedValue || (currentAction === 'borrow' && inputAmount)) && adjustedRatio > 10
                  ? '>1000%'
                  : (user.position.borrowedValue || (currentAction === 'borrow' && inputAmount)) && adjustedRatio < 10
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
          value={inputAmount}
          maxInput={maxInput}
          disabled={disabledInput}
          loading={loading}
          error={inputError}
          onClick={() => setInputError('')}
          onChange={(value: number) => {
            if (value < 0) {
              setInputAmount(0);
            } else {
              setInputAmount(value);
            }

            adjustCollateralizationRatio();
          }}
          submit={() => checkCopilotTradeWarning()}
        />
        <Slider
          dots
          value={((inputAmount ?? 0) / maxInput) * 100}
          min={0}
          max={100}
          step={1}
          disabled={disabledInput}
          onChange={percent => {
            setInputAmount(maxInput * (percent / 100));
            adjustCollateralizationRatio();
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
