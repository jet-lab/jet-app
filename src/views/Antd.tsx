import { useState } from "react";
import { Typography, Button, Radio, Space } from "antd";
import { PoweroffOutlined } from "@ant-design/icons";


export function Antd(): JSX.Element {
  const { Title, Text, Link, Paragraph } = Typography;
  const [buttonSize, setButtonSize] = useState<'large' | 'middle' | 'small'>('middle');
  const [radioValue, setRadioValue] = useState(1);
  return (
    <div className="flex column align-start"
      style={{maxWidth: '700px', margin: '10px auto'}}>
      <Title>Typography (Title 1)</Title>
      <Space direction="vertical">
        <Title level={2}>Title 2</Title>
        <Paragraph>Paragraph</Paragraph>
        <Text>Text</Text>
        <Text type="secondary">Text (secondary)</Text>
        <Text type="success">Text (success)</Text>
        <Text type="warning">Text (warning)</Text>
        <Text type="danger">Text (danger)</Text>
        <Text disabled>Text (disabled)</Text>
        <Text mark>Text (mark)</Text>
        <Text code>Text (code)</Text>
        <Text keyboard>Text (keyboard)</Text>
        <Text underline>Text (underline)</Text>
        <Text delete>Text (delete)</Text>
        <Text strong>Text (strong)</Text>
        <Text italic>Text (italic)</Text>
        <Link href="https://ant.design" target="_blank">
          Text (Link)
        </Link>
      </Space>
      <br />
      <br />
      <br />
      <Title>Radios</Title>
      <Radio>Basic Radio</Radio>
      <br />
      <Radio.Group onChange={(e) => setRadioValue(e.target.value)} value={radioValue}>
        <Radio value={1}>1</Radio>
        <Radio value={2}>2</Radio>
        <Radio value={3}>3</Radio>
        <Radio value={4}>4</Radio>
      </Radio.Group>
      <br />
      <Text type="secondary">Button Size: {buttonSize.toUpperCase()}</Text>
      <Radio.Group value={buttonSize} onChange={(e) => setButtonSize(e.target.value)}>
        <Radio.Button value="small">Small</Radio.Button>
        <Radio.Button value="middle">Middle (Default)</Radio.Button>
        <Radio.Button value="large">Large</Radio.Button>
      </Radio.Group>
      <br />
      <br />
      <br />
      <Title>Buttons</Title>
      <Button type="primary" size={buttonSize}>
        Primary
      </Button>
      <Button type="ghost" size={buttonSize}>
        Ghost (Block)
      </Button>
      <Button>Default</Button>
      <Button type="dashed" size={buttonSize}>
        Dashed
      </Button>
      <br />
      <Button type="primary" size={buttonSize} loading>
        Loading
      </Button>
      <Button type="primary" size={buttonSize} icon={<PoweroffOutlined />} loading />
      <br />
      <Button type="link" size={buttonSize}>
        Link
      </Button>
    </div>
  )
}