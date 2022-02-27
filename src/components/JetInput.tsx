import { useDarkTheme } from '../contexts/darkTheme';
import { useTradeContext } from '../contexts/tradeContext';
import { currencyFormatter } from '../utils/currency';
import { Input } from 'antd';
import { Loader } from './Loader';
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
  onClick?: Function;
  onChange: Function;
  submit: Function;
}) {
  const { darkTheme } = useDarkTheme();
  const { currentReserve } = useTradeContext();

  return (
    <div className={`jet-input flex-centered ${props.disabled ? 'disabled' : ''}`}>
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
            <img 
              src={`img/cryptos/${currentReserve.abbrev}.png`} 
              alt={`${currentReserve.abbrev} Logo`} 
            />
            <div className="asset-abbrev-usd flex align-end justify-center column">
              <span>{currentReserve.abbrev}</span>
              <span>≈ {currencyFormatter((Number(props.value) ?? 0) * (currentReserve ? currentReserve.price : 0), true, 2)}</span>
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
        {props.loading 
          ? <Loader button /> 
            : <ArrowIcon width={30} />
        }
      </div>
    </div>
  );
}
