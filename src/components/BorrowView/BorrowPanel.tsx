import { useEffect, useState } from 'react';
import { useDarkTheme } from '../../contexts/Settings/darkTheme';
import { useLanguage } from '../../contexts/localization/localization';
import { useSendingTransaction } from '../../contexts/transactions/sendingTransaction';
import { useCurrentReserve } from '../../contexts/transactions/currentReserve';
import { useBorrowRepayInput } from '../../contexts/BorrowView/borrowRepayInput';
import { market, user } from '../../hooks/jet-engine/useClient';
import { currencyFormatter } from '../../utils/currency';
import { Select } from 'antd';
import { Info } from '../Misc/Info';

export function BorrowPanel(): JSX.Element {
  const { Option } = Select;
  const { darkTheme } = useDarkTheme();
  const { dictionary } = useLanguage();
  const { sendingTransaction } = useSendingTransaction();
  const { currentReserve } = useCurrentReserve();
  const { inputAmount, setInputAmount } = useBorrowRepayInput();
  const [disabledMessage, setDisabledMessage] = useState('');
  const [adjustedRatio, setAdjustedRatio] = useState<number>(0);
  const [maxInput, setMaxInput] = useState<number>(0);
  const [currentAction, setCurrentAction] = useState<string>('borrow');
  const borrowViewActions = ['borrow', 'repay'];

  // Adjust panel
  function adjustInterface() {
    checkDisabledMessage();
    getMaxInput();
    adjustCollateralizationRatio();
  }

  function checkDisabledMessage() {
    if (!user.assets || !currentReserve) {
      setDisabledMessage('');
      return;
    }

    // Borrowing
    if (currentAction === 'borrow') {
      // User has not deposited any collateral
      if (!user.position.depositedValue) {
        setDisabledMessage(dictionary.cockpit.noDepositsForBorrow);
        // User is below minimum c-ratio
      } else if (user.position.borrowedValue && user.position.colRatio <= market.minColRatio) {
        setDisabledMessage(dictionary.cockpit.belowMinCRatio);
        // No liquidity in market to borrow from
      } else if (currentReserve.availableLiquidity.isZero()) {
        setDisabledMessage(dictionary.cockpit.noLiquidity);
      } else {
        setDisabledMessage('');
      }
      // Repaying
    } else if (currentAction === 'repay') {
      // User has no loan balance to repay
      if (!user.loanBalances[currentReserve.symbol]) {
        setDisabledMessage(dictionary.cockpit.noDebtForRepay.replaceAll('{{ASSET}}', currentReserve.symbol));
      } else {
        setDisabledMessage('');
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
      if (currentAction === 'borrow') {
        max = user.assets.tokens[currentReserve.symbol].maxBorrowAmount;
      } else if (currentAction === 'repay') {
        max = user.assets.tokens[currentReserve.symbol].maxRepayAmount;
      }
    }
    setMaxInput(max);
  }

  // Adjust user input and calculate updated c-ratio if
  // they were to submit current trade
  function adjustCollateralizationRatio() {
    if (!(currentReserve && currentReserve.priceData.price) || !user.assets || !inputAmount) {
      setAdjustedRatio(user.position.colRatio);
      return;
    }

    // Borrowing
    if (currentAction === 'borrow') {
      setAdjustedRatio(
        user.position.depositedValue / user.position.borrowedValue + inputAmount * currentReserve.priceData.price
      );
      // Repaying
    } else if (currentAction === 'repay') {
      setAdjustedRatio(
        user.position.depositedValue / user.position.borrowedValue - inputAmount * currentReserve.priceData.price
      );
    }
  }

  // Readjust interface onmount
  // and current reserve change
  useEffect(() => {
    adjustInterface();
  }, [user.assets, currentReserve, currentAction]);

  // If user disconnects wallet, reset inputs
  useEffect(() => {
    setInputAmount(null);
  }, [user.walletInit]);

  return (
    <div className="trade-panel flex align-center justify-start">
      <div className="trade-select-container flex align-center justify-between">
        {borrowViewActions.map(action => (
          <div
            key={action}
            onClick={() => {
              if (!sendingTransaction) {
                setCurrentAction(action);
                adjustInterface();
              }
            }}
            className={`trade-select flex justify-center align-center ${currentAction === action ? 'active' : ''} ${
              darkTheme ? 'dark' : ''
            }`}>
            <p className="gradient-text semi-bold-text">{dictionary.cockpit[action].toUpperCase()}</p>
          </div>
        ))}
        <div className="mobile-trade-select flex-centered">
          <Select
            value={currentAction}
            onChange={action => {
              if (!sendingTransaction) {
                setCurrentAction(action);
                adjustInterface();
              }
            }}>
            {borrowViewActions.map(action => (
              <Option key={action} value={action}>
                {action.toUpperCase()}
              </Option>
            ))}
          </Select>
        </div>
      </div>
      {disabledMessage ? (
        <div className="trade-section trade-section-disabled-message flex-centered column">
          <span className="center-text">{disabledMessage}</span>
        </div>
      ) : (
        <>
          <div className={`trade-section flex-centered column ${disabledMessage ? 'disabled' : ''}`}>
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
                {user.walletInit && currentReserve ? maxInput + ' ' + currentReserve.symbol : '--'}
              </p>
            </div>
          </div>
          <div className={`trade-section flex-centered column ${disabledMessage ? 'disabled' : ''}`}>
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
      <div className="trade-section flex-centered column">{/*TODO: borrow or repay inputs go here */}</div>
    </div>
  );
}
