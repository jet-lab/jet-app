import { useDefinition } from '../../contexts/Modals/copilotModal';
import { definitions, useLanguage } from '../../contexts/localization/localization';
import { Tooltip } from 'antd';
import { InfoCircleFilled } from '@ant-design/icons';

export function Info(props: { term: string }): JSX.Element {
  const { language } = useLanguage();
  const { setDefinition } = useDefinition();

  return (
    <Tooltip title={definitions[language][props.term].definition}>
      <InfoCircleFilled className="info" onClick={() => setDefinition(definitions[language][props.term])} />
    </Tooltip>
  );
}
