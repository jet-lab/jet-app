import { useCurrentReserve } from '../../contexts/transactions/currentReserve';
import { currencyFormatter } from '../../utils/currency';
import { Input } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { ReactComponent as ArrowIcon } from '../styles/icons/arrow_icon.svg';

export function JetInput(props: {
  type: 'text' | 'number';
  value: string | number | null;
  placeholder?: string;
  currency?: boolean;
  maxInput?: number | null;
  error?: string | null;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => unknown;
  onChange: (value: any) => unknown;
  submit: () => unknown;
}): JSX.Element {
  const { currentReserve } = useCurrentReserve();

  // TODO: disabled input + message, errors, etc

  // TODO: put these bits into their respective case components (deposit input, borrow input, etc):

  // Check if user input should be disabled
  // depending on wallet balance and position
  /*
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
      if (!user.walletBalances[currentReserve.symbol]) {
        setDisabledMessage(dictionary.cockpit.noBalanceForDeposit.replaceAll('{{ASSET}}', currentReserve.symbol));
      } else {
        setDisabledInput(false);
      }
      // Withdrawing
    } else if (currentAction === 'withdraw') {
      // No collateral to withdraw
      if (!user.collateralBalances[currentReserve.symbol]) {
        setDisabledMessage(dictionary.cockpit.noDepositsForWithdraw.replaceAll('{{ASSET}}', currentReserve.symbol));
        // User is below PROGRRAM minimum c-ratio
      } else if (user.position.borrowedValue && user.position.colRatio <= market.minColRatio) {
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
      if (!user.loanBalances[currentReserve.symbol]) {
        setDisabledMessage(dictionary.cockpit.noDebtForRepay.replaceAll('{{ASSET}}', currentReserve.symbol));
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
        max = user.assets.tokens[currentReserve.symbol].maxDepositAmount;
      } else if (currentAction === 'withdraw') {
        max = user.assets.tokens[currentReserve.symbol].maxWithdrawAmount;
      } else if (currentAction === 'borrow') {
        max = user.assets.tokens[currentReserve.symbol].maxBorrowAmount;
      } else if (currentAction === 'repay') {
        max = user.assets.tokens[currentReserve.symbol].maxRepayAmount;
      }
    }
    setMaxInput(max);
  }


  // Check user's trade and offer Copilot warning
  // if necessary, otherwise begin trade submit
  function checkCopilotTradeWarning() {
    let copilotAlert: Alert | undefined = undefined;
    if (!currentReserve) {
      return;
    }

    if (!inputAmount) {
      setInputError(dictionary.cockpit.noinputAmount);
      setinputAmount(null);
      return;
    }

    // Depositing
    if (currentAction === 'deposit') {
      // User is opening an account, inform them of rent fee
      // TODO add this back in for rent fee
      // if (!user.position.loanNoteMintPubkey) {
      //   copilotAlert = {
      //     status: 'neutral',
      //     overview: dictionary.cockpit.welcomeAboard,
      //     detail: <span>dictionary.cockpit.rentFeeDescription</span>,
      //     solution: <span>dictionary.cockpit.rentFeeDetail
      //       .replace('{{RENT_FEE}}', 0) //TODO: Rent fee here
      //       .replace('{{TRADE ACTION}}', dictionary.transactions.withdraw)</span>,
      //     action: {
      //       text: dictionary.cockpit.confirm,
      //       onClick: () => submitTrade()
      //     }
      //   };
        
      // // Depositing all SOL leaving no lamports for fees, inform and reject
      // } else
      if (
        currentReserve.symbol === 'SOL' &&
        inputAmount <= user.walletBalances[currentReserve.symbol] &&
        inputAmount > user.walletBalances[currentReserve.symbol] - 0.02
      ) {
        copilotAlert = {
          status: 'failure',
          detail: <span>{dictionary.cockpit.insufficientLamports}</span>,
          closeable: true
        };
      }
      // Withdrawing
    } else if (currentAction === 'withdraw') {
      // User is withdrawing between 125% and 130%, allow trade but warn them
      if (user.position.borrowedValue && adjustedRatio > 0 && adjustedRatio <= market.minColRatio + 0.05) {
        copilotAlert = {
          status: 'failure',
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
      // TODO add this back in for rent fee
      // if (!user.position.loanNoteMintPubkey) {
      //   copilotAlert = {
      //     status: 'neutral',
      //     overview: dictionary.cockpit.welcomeAboard,
      //     detail: <span>dictionary.cockpit.rentFeeDescription</span>,
      //     solution: <span>dictionary.cockpit.rentFeeDetail
      //       .replace('{{RENT_FEE}}', 0) //TODO: Rent fee here
      //       .replace('{{TRADE ACTION}}', dictionary.transactions.repay.toLowerCase())</span>,
      //     action: {
      //       text: dictionary.cockpit.confirm,
      //       onClick: () => submitTrade()
      //     }
      //   };
      // // In danger of liquidation
      // } else
      if (adjustedRatio <= market.minColRatio + 0.2) {
        // but not below min-ratio, warn and allow trade
        if (adjustedRatio >= market.minColRatio || !user.position.borrowedValue) {
          copilotAlert = {
            status: 'failure',
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
        } else if (adjustedRatio < market.minColRatio && adjustedRatio < user.position.colRatio) {
          copilotAlert = {
            status: 'failure',
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
  */

  return (
    <div className={`token-input flex-centered ${props.disabled ? 'disabled' : ''}`}>
      <div className={`flex-centered ${props.currency ? 'currency-input' : ''}`}>
        <Input
          type={props.type}
          disabled={props.disabled}
          value={props.value || ''}
          placeholder={props.error || props.placeholder}
          className={props.error ? 'error' : ''}
          onClick={() => (props.onClick ? props.onClick() : null)}
          onChange={e => props.onChange(e.target.value)}
          onPressEnter={() => props.submit()}
        />
        {props.currency && currentReserve && (
          <>
            <img src={`img/cryptos/${currentReserve.symbol}.png`} alt={`${currentReserve.symbol} Logo`} />
            <div className="asset-abbrev-usd flex align-end justify-center column">
              <span>{currentReserve.symbol}</span>
              <span>
                ≈ {currencyFormatter((Number(props.value) ?? 0) * (currentReserve.priceData.price ?? 0), true, 2)}
              </span>
            </div>
          </>
        )}
      </div>
      <div
        className={`input-btn flex-centered ${props.loading ? 'loading' : ''}`}
        onClick={() => {
          if (!props.disabled) {
            props.submit();
          }
        }}>
        {props.loading ? <LoadingOutlined style={{ fontSize: 24 }} spin /> : <ArrowIcon width={30} />}
      </div>
    </div>
  );
}
