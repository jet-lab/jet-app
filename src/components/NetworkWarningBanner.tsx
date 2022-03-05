import { useLanguage } from '../contexts/localization/localization';
import { useRpcNode } from '../contexts/rpcNode';

export function NetworkWarningBanner(): JSX.Element {
  const { dictionary } = useLanguage();
  const { degradedNetworkPerformance } = useRpcNode();

  if (degradedNetworkPerformance) {
    return (
      <div className="network-warning-banner flex-centered">
        <span
          className="semi-bold-text"
          dangerouslySetInnerHTML={{
            __html: dictionary.settings.degradedNetworkPerformance
          }}></span>
      </div>
    );
  } else {
    return <></>;
  }
}
