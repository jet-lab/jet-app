import { useGeoban, useLanguage } from '../../contexts/localization/localization';

export function Geobanned(): JSX.Element {
  const { dictionary } = useLanguage();
  const isGeobanned = useGeoban();

  if (isGeobanned) {
    return (
      <div className="init-failed view flex-centered column">
        <img src="img/ui/failed_init.gif" width="600px" alt="Failed To Init App" />
        <h1 className="danger-text">{dictionary.copilot.alert.failed}</h1>
        <p className="center-text">{dictionary.cockpit.geobanned}</p>
      </div>
    );
  } else {
    return <></>;
  }
}
