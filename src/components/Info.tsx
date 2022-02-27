import { useDefinition } from '../contexts/copilotModal';
import { definitions, useLanguage } from '../contexts/localization/localization';
import { InfoCircleFilled } from '@ant-design/icons';

export function Info(props: { term: string }) {
  const { language } = useLanguage();
  const { setDefinition } = useDefinition();

  return <InfoCircleFilled className="info" onClick={() => setDefinition(definitions[language][props.term])} />;
}
