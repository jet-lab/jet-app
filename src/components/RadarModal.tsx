import { useRadarModal } from '../contexts/radarModal';
import { useLanguage } from '../contexts/localization/localization';
import { Modal } from 'antd';
import { ReactComponent as RadarIcon } from '../styles/icons/radar_icon.svg';
import { AssetLogo } from './AssetLogo';
import { useTradeContext } from '../contexts/tradeContext';
import { useDarkTheme } from '../contexts/darkTheme';
import { LoadingOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useRpcNode } from '../contexts/rpcNode';
interface RadarResponse {
  [protocol: string]: Record<
    string,
    {
      name: string;
      logo: string;
      price: number;
      depositRate: number;
      borrowRate: number;
    }
  >;
}
interface ProtocolData {
  protocolName: string;
  tokenName: string;
  tokenLogo: string;
  price: number;
  depositRate: number;
  borrowRate: number;
}

export const RadarModal: React.FC = () => {
  const { dictionary } = useLanguage();
  const { radarOpen, setRadarOpen } = useRadarModal();
  const { currentPool } = useTradeContext();
  const { darkTheme } = useDarkTheme();
  const [protocolData, setProcolData] = useState<ProtocolData[]>([]);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { preferredNode } = useRpcNode();

  const fetchProtocols = async (token: string) => {
    setLoading(true);
    const searchParams = new URLSearchParams(`tokenId=${token}`);
    if (preferredNode) {
      searchParams.append('clusterUrl', preferredNode);
    }
    const response = await fetch(`https://api.jetprotocol.io/v1/radar?${searchParams.toString()}`);
    const data: RadarResponse = await response.json();
    const protocols: ProtocolData[] = Object.entries(data).reduce<ProtocolData[]>((acc, protocol) => {
      const [protocolName, tokenList] = protocol;
      const tokenData = tokenList[token];
      tokenData &&
        acc.push({
          protocolName,
          tokenName: tokenData.name,
          tokenLogo: tokenData.logo,
          price: tokenData.price,
          depositRate: tokenData.depositRate,
          borrowRate: tokenData.borrowRate
        });
      return acc;
    }, []);
    setProcolData(protocols);
    setCurrentToken(token);
    setLoading(false);
  };

  useEffect(() => {
    if (loading) {
      setProcolData([]);
    }
  }, [loading]);

  useEffect(() => {
    if (currentPool?.symbol && currentToken !== currentPool.symbol) {
      fetchProtocols(currentPool.symbol);
    }
  }, [currentToken, currentPool]);

  if (!currentPool?.symbol) {
    console.error('No pool selected');
    return null;
  }
  return (
    <Modal footer={null} visible={radarOpen} className="radar-modal" onCancel={() => setRadarOpen(false)}>
      <div className="radar-modal-header flex-centered">
        <RadarIcon width="20px" />
        <p>{dictionary.copilot.radar.interestRadar.toUpperCase()}</p>
      </div>
      <div className="radar-modal-asset flex-centered">
        <AssetLogo symbol={currentPool?.symbol} height={30} style={{ marginRight: 5 }} />
        <h1>{currentPool?.symbol}</h1>
      </div>
      {protocolData.length === 0 && (
        <div className="radar-loader">
          <LoadingOutlined />
        </div>
      )}

      {protocolData.length > 0 && (
        <div className="table-container">
          <table className="no-interaction">
            <thead>
              <tr>
                <th>{dictionary.copilot.radar.protocol}</th>
                <th>
                  {dictionary.cockpit.depositRate}
                  <span>(%)</span>
                </th>
                <th>
                  {dictionary.cockpit.borrowRate}
                  <span>(%)</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {protocolData.map((protocol, idx) => {
                return (
                  <tr
                    key={protocol.protocolName}
                    className={`no-interaction ${(idx + 1) % 2 === 0 ? 'row-bg' : ''} ${darkTheme ? '' : 'white'}`}>
                    <td>
                      <img
                        src={`img/protocols/${protocol.protocolName.toLowerCase()}_${
                          darkTheme ? 'white' : 'black'
                        }.png`}
                        alt={`${protocol} Logo`}
                      />
                    </td>
                    <td className="deposit-rate">{`${Math.ceil(protocol.depositRate * 100 * 100) / 100}%`}</td>
                    <td className="borrow-rate">{`${Math.ceil(protocol.borrowRate * 100 * 100) / 100}%`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
};
