import { Skeleton } from 'antd';
import { ReactComponent as USDC } from '../styles/icons/cryptos/USDC.svg';
import { ReactComponent as SOL } from '../styles/icons/cryptos/SOL.svg';
import { ReactComponent as BTC } from '../styles/icons/cryptos/BTC.svg';
import { ReactComponent as ETH } from '../styles/icons/cryptos/ETH.svg';

export function AssetLogo(props: { symbol: string; height: number; style?: React.CSSProperties }): JSX.Element {
  const { symbol, height } = props;

  if (symbol === 'USDC') {
    return <USDC height={height} width={height} style={props.style} />;
  } else if (symbol === 'SOL') {
    return <SOL height={height} width={height} style={props.style} />;
  } else if (symbol === 'BTC') {
    return <BTC height={height} width={height} style={props.style} />;
  } else if (symbol === 'ETH') {
    return <ETH height={height} width={height} style={props.style} />;
  } else {
    return <Skeleton.Avatar active size={height} shape="square" style={props.style} />;
  }
}
