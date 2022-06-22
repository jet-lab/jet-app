import { useWallet } from '@solana/wallet-adapter-react';
import { useLanguage } from '../contexts/localization/localization';
import { useConnectWalletModal } from '../contexts/connectWalletModal';
import { useTransactionLogs } from '../contexts/transactionLogs';
import { useBlockExplorer } from '../contexts/blockExplorer';
import { totalAbbrev } from '../utils/currency';
import { shortenPubkey } from '../utils/utils';
import { ReactComponent as ArrowIcon } from '../styles/icons/arrow_icon.svg';

// Jet V1
import { useUser } from '../v1/contexts/user';
import { Button, Divider } from 'antd';

export function TransactionLogs(): JSX.Element {
  const { dictionary } = useLanguage();
  const { connected, publicKey } = useWallet();
  const { setConnecting } = useConnectWalletModal();
  const { getExplorerUrl } = useBlockExplorer();
  const { loadingLogs, logs, noMoreSignatures, searchMoreLogs } = useTransactionLogs();

  // Jet V1
  const user = useUser();

  return (
    <div className="transaction-logs view">
      <div className="table-container">
        <div className="flex align-center justify-start">
          <h1>{dictionary.transactions.title}</h1>
          {connected && <span>{shortenPubkey(publicKey?.toString() ?? '')}</span>}
        </div>
        <Divider />
        <table>
          <thead>
            <tr>
              <th>{dictionary.transactions.date}</th>
              <th>{dictionary.transactions.time}</th>
              <th>{dictionary.transactions.signature}</th>
              <th>{dictionary.transactions.tradeAction}</th>
              <th>{dictionary.transactions.tradeAmount}</th>
              <th>{/* Empty column for loader */}</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i} onClick={() => window.open(getExplorerUrl(log.signature), '_blank')}>
                <td>{log.blockDate}</td>
                <td>{log.time}</td>
                <td style={{ color: 'var(--success)' }}>{shortenPubkey(log.signature, 4)}</td>
                <td className="reserve-detail">{log.tradeAction}</td>
                <td className="asset">
                  {totalAbbrev(Math.abs(log.tradeAmount.tokens), log.tokenPrice, true, log.tokenDecimals)}
                  &nbsp;
                  {log.tokenAbbrev}
                </td>
                <td>
                  <ArrowIcon className="jet-icon" />
                </td>
              </tr>
            ))}
            <tr className="no-interaction">
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
            <tr className="no-interaction">
              <td>
                <Button
                  type="dashed"
                  onClick={() => {
                    if (!connected) {
                      setConnecting(true);
                    }
                    if (user.walletInit && !(loadingLogs || noMoreSignatures)) {
                      searchMoreLogs();
                    }
                  }}
                  loading={loadingLogs}
                  disabled={(connected && !user.walletInit) || loadingLogs || noMoreSignatures}>
                  {connected
                    ? loadingLogs
                      ? `${dictionary.loading.loading}..`
                      : dictionary.loading.loadMore
                    : dictionary.settings.connect + ' ' + dictionary.settings.wallet}
                </Button>
              </td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
