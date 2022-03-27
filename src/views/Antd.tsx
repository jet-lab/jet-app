import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CopyBlock, dracula } from 'react-code-blocks';
import { Typography, Button, Radio, Divider, Breadcrumb, Menu, Dropdown, Select } from 'antd';
import { DownOutlined, PoweroffOutlined } from '@ant-design/icons';

export function Antd(): JSX.Element {
  const { Title, Text, Paragraph } = Typography;
  const { Option } = Select;
  const [value, setValue] = useState('A');

  const menu = (
    <Menu>
      <Menu.Item onClick={() => setValue('A')}>
        <Link to="/">A</Link>
      </Menu.Item>
      <Menu.Item onClick={() => setValue('B')}>
        <Link to="/">B</Link>
      </Menu.Item>
      <Menu.Item onClick={() => setValue('C')}>
        <Link to="/">C</Link>
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="container flex column align-start">
      <div className="component">
        <div className="flex justify-between align-start">
          <div className="flex align-start column">
            <Title className="component-title" underline>
              Typography
            </Title>
            <Title>Title 1</Title>
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
            <Text className="gradient-text">Text (Gradient)</Text>
            <Text className="text-btn">Text Button</Text>
            <Text className="link-btn">Link Button</Text>
          </div>
          <div className="code-block">
            <CopyBlock
              theme={dracula}
              text={`
import { Typography } from 'antd';

const { Title, Text, Paragraph } = Typography;

return (
  <Title>Title 1</Title>
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
  <Text className="gradient-text">Text (Gradient)</Text>
  <Text className="text-btn">Text Button</Text>
  <Text className="link-btn">Link Button</Text>
);
              `}
              language="jsx"
            />
          </div>
        </div>
      </div>

      <div className="component">
        <div className="flex justify-between align-start">
          <div className="flex column">
            <Title className="component-title" underline>
              Radios
            </Title>
            <br />
            <Radio>Basic Radio</Radio>
            <br />
            <br />
            <Radio.Group value={value} onChange={e => setValue(e.target.value)}>
              <Radio value="A">A</Radio>
              <Radio value="B">B</Radio>
              <Radio value="C">C</Radio>
            </Radio.Group>
            <br />
            <br />
            <Radio.Group value={value} onChange={e => setValue(e.target.value)}>
              <Radio.Button value="A">A</Radio.Button>
              <Radio.Button value="B">B</Radio.Button>
              <Radio.Button value="C">C</Radio.Button>
            </Radio.Group>
          </div>
          <div className="code-block">
            <CopyBlock
              theme={dracula}
              text={`
import { useState } from 'react';
import { Radio } from 'antd';

const [value, setValue] = useState('A');

return (
  <Radio>Basic Radio</Radio>

  <Radio.Group 
    value={value} 
    onChange={e => setValue(e.target.value)}
  >
    <Radio value="A">A</Radio>
    <Radio value="B">B</Radio>
    <Radio value="C">C</Radio>
    <Radio value="D">D</Radio>
  </Radio.Group>

  <Radio.Group 
    value={value} 
    onChange={e => setValue(e.target.value)}
  >
    <Radio.Button value="A">A</Radio.Button>
    <Radio.Button value="B">B</Radio.Button>
    <Radio.Button value="C">C</Radio.Button>
  </Radio.Group>
);
              `}
              language="jsx"
            />
          </div>
        </div>
      </div>

      <div className="component">
        <div className="flex justify-between align-start">
          <div className="flex align-start column">
            <Title underline>Buttons</Title>
            <br />
            <div className="flex align-end">
              <Button size="small">Default</Button>
              <Button type="primary" size="middle">
                Primary
              </Button>
              <Button size="large">Primary</Button>
            </div>
            <br />
            <br />
            <div className="flex align-end">
              <Button className="secondary-btn" size="small">
                Secondary
              </Button>
              <Button type="ghost" size="middle">
                Ghost
              </Button>
              <Button ghost size="large">
                Ghost
              </Button>
            </div>
            <br />
            <br />
            <div className="flex align-end">
              <Button className="tertiary-btn" size="small">
                Tertiary
              </Button>
              <Button type="dashed" size="middle">
                Dashed
              </Button>
              <Button type="dashed" size="large">
                Dashed
              </Button>
            </div>
            <br />
            <Button className="full-width">Full Width</Button>
            <Button ghost block>
              Block
            </Button>
            <br />
            <br />
            <div className="flex align-end">
              <Button type="dashed" icon={<PoweroffOutlined />} />
              <Button type="ghost" shape="circle" icon={<PoweroffOutlined />} />
              <Button shape="round">Round</Button>
            </div>
            <br />
            <br />
            <div className="flex align-end">
              <Button loading>Loading</Button>
              <Button type="dashed" icon={<PoweroffOutlined />} loading />
            </div>
            <br />
            <br />
            <Button type="text" size="middle">
              Text Button
            </Button>
            <Button type="link" size="middle">
              Link Button
            </Button>
          </div>
          <div className="code-block">
            <CopyBlock
              theme={dracula}
              text={`
import { Button } from 'antd';
import { PoweroffOutlined } from '@ant-design/icons';

return (
  <Button size="small">
    Default
  </Button>
  <Button type="primary" size="middle">
    Primary
  </Button>
  <Button size="large">
    Primary
  </Button>

  <Button className="secondary-btn" size="small">
    Secondary
  </Button>
  <Button type="ghost" size="middle">
    Ghost
  </Button>
  <Button ghost size="large">
    Ghost
  </Button>

  <Button className="tertiary-btn" size="small">
    Tertiary
  </Button>
  <Button type="dashed" size="middle">
    Dashed
  </Button>
  <Button type="dashed" size="large">
    Dashed
  </Button>

  <Button className="full-width">
    Full Width
  </Button>
  <Button ghost block>
    Block
  </Button>

  <Button type="dashed" icon={<PoweroffOutlined />} />
  <Button type="ghost" shape="circle" icon={<PoweroffOutlined />} />
  <Button shape="round">
    Round
  </Button>

  <Button loading>
    Loading
  </Button>
  <Button type="dashed" icon={<PoweroffOutlined />} loading />

  <Button type="text" size="middle">
    Text Button
  </Button>
  <Button type="link" size="middle">
    Link Button
  </Button>
);
              `}
              language="jsx"
            />
          </div>
        </div>
      </div>

      <div className="component">
        <div className="flex justify-between align-start">
          <div className="flex column align-start" style={{ width: '200px' }}>
            <Title underline>Divider</Title>
            <br />
            <Divider />
            <Divider type="vertical" />
          </div>
          <div className="code-block">
            <CopyBlock
              theme={dracula}
              text={`
import { Divider } from 'antd';

<Divider />
<Divider type="vertical" />
              `}
              language="jsx"
            />
          </div>
        </div>
      </div>

      <div className="component">
        <div className="flex justify-between align-start">
          <div className="flex column align-start">
            <Title underline>Breadcrumb</Title>
            <br />
            <Breadcrumb>
              <Breadcrumb.Item>
                <Link className="text-btn" to="/">
                  Home
                </Link>
              </Breadcrumb.Item>
              <Breadcrumb.Item overlay={menu}>
                <Link className="text-btn" to="/">
                  Menu
                </Link>
              </Breadcrumb.Item>
              <Breadcrumb.Item>Current</Breadcrumb.Item>
            </Breadcrumb>
            <br />
            <br />
            <br />
            <br />
            <Title underline>Dropdown</Title>
            <br />
            <Dropdown overlay={menu}>
              <Paragraph>
                Hover me <DownOutlined />
              </Paragraph>
            </Dropdown>
            <br />
            <Dropdown overlay={menu}>
              <Button type="dashed">
                {value} <DownOutlined />
              </Button>
            </Dropdown>
            <br />
            <Dropdown.Button type="ghost" overlay={menu}>
              Submit
            </Dropdown.Button>
            <br />
            <br />
            <br />
            <br />
            <Title underline>Select</Title>
            <br />
            <Select value={value} onChange={value => setValue(value)}>
              <Option key="A" value="A">
                A
              </Option>
              <Option key="B" value="B">
                B
              </Option>
              <Option key="C" value="C">
                C
              </Option>
            </Select>
          </div>
          <div className="code-block">
            <CopyBlock
              theme={dracula}
              text={`
import { Link } from 'react-router-dom';
import { Breadcrumb, Dropdown, Menu, Select, Typography } from 'antd';

const { Paragraph } = Typography;
const { Option } = Select;
const [value, setValue] = useState('A');

const menu = (
  <Menu>
    <Menu.Item onClick={() => setValue('A')}>
      <Link to="/">A</Link>
    </Menu.Item>
    <Menu.Item onClick={() => setValue('B')}>
      <Link to="/">B</Link>
    </Menu.Item>
    <Menu.Item onClick={() => setValue('C')}>
      <Link to="/">C</Link>
    </Menu.Item>
  </Menu>
);

return (
  <Breadcrumb>
    <Breadcrumb.Item>
      <Link className="text-btn" to="/">
        Home
      </Link>
    </Breadcrumb.Item>
    <Breadcrumb.Item overlay={menu}>
      <Link className="text-btn" to="/">
        Menu
      </Link>
    </Breadcrumb.Item>
    <Breadcrumb.Item>Current</Breadcrumb.Item>
  </Breadcrumb>

  <Dropdown overlay={menu}>
    <Paragraph>
      Hover me <DownOutlined />
    </Paragraph>
  </Dropdown>
  <Dropdown.Button type="ghost" overlay={menu}>
    Submit
  </Dropdown.Button>

  <Select value={value} onChange={value => setValue(value)}>
    <Option key="A" value="A">
      A
    </Option>
    <Option key="B" value="B">
      B
    </Option>
    <Option key="C" value="C">
      C
    </Option>
  </Select>
);
              `}
              language="jsx"
            />
          </div>
        </div>
      </div>

      <div className="component">
        <div className="flex justify-between align-start">
          <div className="flex column"></div>
          <div className="code-block"></div>
        </div>
      </div>

      <div className="component">
        <div className="flex justify-between align-start">
          <div className="flex column"></div>
          <div className="code-block"></div>
        </div>
      </div>

      <div className="component">
        <div className="flex justify-between align-start">
          <div className="flex column"></div>
          <div className="code-block"></div>
        </div>
      </div>

      <div className="component">
        <div className="flex justify-between align-start">
          <div className="flex column"></div>
          <div className="code-block"></div>
        </div>
      </div>
    </div>
  );
}
