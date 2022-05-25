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

export function TransactionLogs(): JSX.Element {
  const { dictionary } = useLanguage();
  const { connected } = useWallet();
  const { setConnecting } = useConnectWalletModal();
  const { getExplorerUrl } = useBlockExplorer();
  const { loadingLogs, logs, noMoreSignatures, searchMoreLogs } = useTransactionLogs();

  // Jet V1
  const user = useUser();

  return (
    <div className="transaction-logs view">
      <div className="table-container">
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
              <td style={{ padding: '10px 0 0 0' }}>
                <span
                  className={`text-btn ${
                    (connected && !user.walletInit) || loadingLogs || noMoreSignatures ? 'disabled' : ''
                  }`}
                  onClick={() => {
                    if (!connected) {
                      setConnecting(true);
                    }
                    if (user.walletInit && !(loadingLogs || noMoreSignatures)) {
                      searchMoreLogs();
                    }
                  }}>
                  {connected
                    ? loadingLogs
                      ? `${dictionary.loading.loading.toUpperCase()}..`
                      : dictionary.loading.loadMore.toUpperCase()
                    : dictionary.settings.connect.toUpperCase()}
                </span>
              </td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
