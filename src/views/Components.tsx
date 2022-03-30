import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CopyBlock, dracula } from 'react-code-blocks';
import {
  Typography,
  Button,
  Radio,
  Divider,
  Breadcrumb,
  Menu,
  Dropdown,
  Select,
  PageHeader,
  Pagination,
  Checkbox,
  Input,
  InputNumber,
  Slider,
  Switch,
  Card,
  Collapse,
  List,
  Popover,
  Table,
  Tabs,
  Tag,
  Timeline,
  Tooltip
} from 'antd';
import { CheckOutlined, CloseOutlined, DownOutlined, PoweroffOutlined } from '@ant-design/icons';
import { useDarkTheme } from '../contexts/darkTheme';

export function Components(): JSX.Element {
  const { Title, Text, Paragraph } = Typography;
  const { Option } = Select;
  const { Panel } = Collapse;
  const { TabPane } = Tabs;
  const { darkTheme, toggleDarkTheme } = useDarkTheme();
  const [value, setValue] = useState('A');
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  // Table
  const tableDataSource = [
    {
      key: '1',
      name: 'Mike',
      age: 32,
      address: '10 Downing Street'
    },
    {
      key: '2',
      name: 'John',
      age: 42,
      address: '10 Downing Street'
    },
    {
      key: '3',
      name: 'Jimmy',
      age: 60,
      address: '155 Loft Street'
    }
  ];
  const tableColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age'
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address'
    }
  ];

  // Card
  const [activeTabKey, setActiveTabKey] = useState('tab1');
  const tabList = [
    {
      key: 'tab1',
      tab: 'Tab 1'
    },
    {
      key: 'tab2',
      tab: 'Tab 2'
    }
  ];
  const contentList: Record<string, JSX.Element> = {
    tab1: <p>Content 1</p>,
    tab2: <p>Content 2</p>
  };

  // Collapse
  const panelText = 'Jet is the coolest place to work, period. Cooler than anywhere else in the tri-state area.';

  // List
  const listData = [
    'Data in a list 1.',
    'Data in a list 2.',
    'Data in a list 3.',
    'Data in a list 4.',
    'Data in a list 5.'
  ];

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
            <Divider />
            <Divider orientation="left">Divider Text</Divider>
            <Divider type="vertical" />
          </div>
          <div className="code-block">
            <CopyBlock
              theme={dracula}
              text={`
import { Divider } from 'antd';

<Divider />
<Divider orientation="left">Divider Text</Divider>
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
          <div className="flex column">
            <Title underline>PageHeader</Title>
            <br />
            <PageHeader className="site-page-header" onBack={() => null} title="Title" subTitle="This is a subtitle" />
          </div>
          <div className="code-block">
            <CopyBlock
              theme={dracula}
              language="jsx"
              text={`
import { PageHeader } from 'antd';
        
return (
  <PageHeader 
    className="site-page-header" 
    onBack={() => null} 
    title="Title" 
    subTitle="This is a subtitle" 
  />
);
              `}
            />
          </div>
        </div>
      </div>

      <div className="component">
        <div className="flex justify-between align-start">
          <div className="flex column">
            <Title underline>Pagination</Title>
            <br />
            <Pagination defaultCurrent={1} total={50} />
          </div>
          <div className="code-block">
            <CopyBlock
              theme={dracula}
              language="jsx"
              text={`
import { Pagination } from 'antd';

return (
  <Pagination defaultCurrent={1} total={50} />
);
              `}
            />
          </div>
        </div>
      </div>

      <div className="component">
        <div className="flex justify-between align-start">
          <div className="flex column">
            <Title underline>Checkbox</Title>
            <br />
            <Checkbox onChange={() => null}>Basic Checkbox</Checkbox>
            <Checkbox disabled onChange={() => null}>
              Disabled Checkbox
            </Checkbox>
          </div>
          <div className="code-block">
            <CopyBlock
              theme={dracula}
              language="jsx"
              text={`
import { Checkbox } from 'antd';

return (
  <Checkbox onChange={() => null}>Basic Checkbox</Checkbox>
  <Checkbox disabled onChange={() => null}>
    Disabled Checkbox
  </Checkbox>
);
              `}
            />
          </div>
        </div>
      </div>

      <div className="component">
        <div className="flex justify-between align-start">
          <div className="flex column">
            <Title underline>Inputs</Title>
            <br />
            <Input placeholder="Basic Input" />
            <br />
            <InputNumber placeholder="Number Input" />
          </div>
          <div className="code-block">
            <CopyBlock
              theme={dracula}
              language="jsx"
              text={`
import { Input, NumberInput } from 'antd';

return (
  <Input placeholder="Basic Input" />
  <InputNumber placeholder="Number Input" />
);
              `}
            />
          </div>
        </div>
      </div>

      <div className="component">
        <div className="flex justify-between align-start">
          <div className="flex column" style={{ width: 200 }}>
            <Title underline>Slider</Title>
            <br />
            <Slider range defaultValue={[20, 50]} />
            <br />
            <Slider
              marks={{
                0: '0%',
                25: '25%',
                50: '50%',
                75: '75%',
                100: 'Max'
              }}
              tipFormatter={value => value + '%'}
            />
          </div>
          <div className="code-block">
            <CopyBlock
              theme={dracula}
              language="jsx"
              text={`
import { Slider } from 'antd';

return (
  <Slider range defaultValue={[20, 50]} />

  <Slider
    marks={{
      0: '0%',
      25: '25%',
      50: '50%',
      75: '75%',
      100: 'Max'
    }}
    tipFormatter={value => value + '%'}
  />
);
              `}
            />
          </div>
        </div>
      </div>

      <div className="component">
        <div className="flex justify-between align-start">
          <div className="flex column align-start">
            <Title underline>Switch</Title>
            <br />
            <Switch checked={darkTheme} onChange={toggleDarkTheme} />
            <br />
            <Switch checked={darkTheme} onChange={toggleDarkTheme} checkedChildren="Dark" unCheckedChildren="Light" />
            <br />
            <Switch
              checked={darkTheme}
              onChange={toggleDarkTheme}
              checkedChildren={<CheckOutlined />}
              unCheckedChildren={<CloseOutlined />}
            />
          </div>
          <div className="code-block">
            <CopyBlock
              theme={dracula}
              language="jsx"
              text={`
import { Switch } from 'antd';
import { CheckOutlined, CloseOutlined, DownOutlined, PoweroffOutlined } from '@ant-design/icons';

return (
  <Switch checked={darkTheme} onChange={toggleDarkTheme} />

  <Switch checked={darkTheme} onChange={toggleDarkTheme} checkedChildren="Dark" unCheckedChildren="Light" />
  
  <Switch
    checked={darkTheme}
    onChange={toggleDarkTheme}
    checkedChildren={<CheckOutlined />}
    unCheckedChildren={<CloseOutlined />}
  />
);
              `}
            />
          </div>
        </div>
      </div>

      <div className="component">
        <div className="flex justify-between align-start">
          <div className="flex column">
            <Title underline>Card</Title>
            <br />
            <Card>
              <div className="flex align-start column">
                <h1>Custom JSX</h1>
                <Divider />
                <p>Fully custom card.</p>
                <Button type="dashed" block>
                  More
                </Button>
              </div>
            </Card>
            <br />
            <Card
              hoverable
              title="Default, clickable card"
              extra={
                <Link className="link-btn" to="/">
                  More
                </Link>
              }>
              <p>Card content</p>
              <p>Card content</p>
              <p>Card content</p>
            </Card>
            <br />
            <Card
              title="Card with tabs"
              tabList={tabList}
              activeTabKey={activeTabKey}
              onTabChange={key => {
                setActiveTabKey(key);
              }}>
              {contentList[activeTabKey]}
            </Card>
            <br />
            <Card
              size="small"
              cover={<img src="https://miro.medium.com/max/1400/1*c7aAfs112I9quVF73Acj3A.jpeg" alt="Jet" />}>
              <p>Smaller card with a cover</p>
              <p>Card content</p>
            </Card>
          </div>
          <div className="code-block">
            <CopyBlock
              theme={dracula}
              language="jsx"
              text={`
import { useState } from 'react';
import { Card, Button, Divider } from 'antd';

const [activeTabKey, setActiveTabKey] = useState('tab1');
const tabList = [
  {
    key: 'tab1',
    tab: 'Tab 1'
  },
  {
    key: 'tab2',
    tab: 'Tab 2'
  }
];
const contentList: Record<string, JSX.Element> = {
  tab1: <p>Content 1</p>,
  tab2: <p>Content 2</p>
};

return (
  <Card>
    <div className="flex align-start column">
      <h1>Custom JSX</h1>
      <Divider />
      <p>Fully custom card.</p>
      <Button type="dashed" block>More</Button>
    </div>
  </Card>

  <Card
    hoverable
    title="Default, clickable card"
    extra={
      <a className="link-btn" href="/">
        More
      </a>
    }>
    <p>Card content</p>
    <p>Card content</p>
    <p>Card content</p>
  </Card>

  <Card
    title="Card with tabs"
    tabList={tabList}
    activeTabKey={activeTabKey}
    onTabChange={key => {
      setActiveTabKey(key);
    }}>
    {contentList[activeTabKey]}
  </Card>

  <Card
    size="small"
    cover={<img src="" alt="" />}>
    <p>Smaller card with a cover</p>
    <p>Card content</p>
  </Card>
);
              `}
            />
          </div>
        </div>
      </div>

      <div className="component">
        <div className="flex justify-between align-start">
          <div className="flex column">
            <Title underline>Collapse</Title>
            <br />
            <Collapse style={{ width: 300 }} defaultActiveKey={['1']} onChange={() => null}>
              <Panel header="This is panel header 1" key="1">
                <p>{panelText}</p>
              </Panel>
              <Panel header="This is panel header 2" key="2">
                <p>{panelText}</p>
              </Panel>
              <Panel header="This is panel header 3" key="3">
                <p>{panelText}</p>
              </Panel>
            </Collapse>
          </div>
          <div className="code-block">
            <CopyBlock
              theme={dracula}
              language="jsx"
              text={`
import { Collapse } from 'antd';

const { Panel } = Collapse;
const panelText = 'Jet is the coolest place to work, period. Cooler than anywhere else in the tri-state area.';

return (
  <Collapse 
    style={{ width: 300 }} 
    defaultActiveKey={['1']} 
    onChange={() => null}>
    <Panel header="This is panel header 1" key="1">
      <p>{panelText}</p>
    </Panel>
    <Panel header="This is panel header 2" key="2">
      <p>{panelText}</p>
    </Panel>
    <Panel header="This is panel header 3" key="3">
      <p>{panelText}</p>
    </Panel>
  </Collapse>
);
              `}
            />
          </div>
        </div>
      </div>

      <div className="component">
        <div className="flex justify-between align-start">
          <div className="flex column">
            <Title underline>List</Title>
            <br />
            <List
              style={{ width: 300 }}
              header={<div>Header</div>}
              footer={<div>Footer</div>}
              bordered
              dataSource={listData}
              renderItem={item => (
                <List.Item>
                  <Typography.Text mark>[ITEM]</Typography.Text> {item}
                </List.Item>
              )}
            />
            <br />
            <List
              style={{ width: 150 }}
              size="small"
              header={<div>Header</div>}
              footer={<div>Footer</div>}
              dataSource={listData}
              renderItem={item => <List.Item>{item}</List.Item>}
            />
            <br />
            <List
              header={<div>No Data Example</div>}
              dataSource={[]}
              renderItem={item => <List.Item>{item}</List.Item>}
            />
          </div>
          <div className="code-block">
            <CopyBlock
              theme={dracula}
              language="jsx"
              text={`
import { List, Typography } from 'antd';

const listData = [
  'Data in a list 1.',
  'Data in a list 2.',
  'Data in a list 3.',
  'Data in a list 4.',
  'Data in a list 5.'
];

return (
  <List
    style={{ width: 300 }}
    header={<div>Header</div>}
    footer={<div>Footer</div>}
    bordered
    dataSource={listData}
    renderItem={item => (
      <List.Item>
        <Typography.Text mark>[ITEM]</Typography.Text> {item}
      </List.Item>
    )}
  />
  
  <List
    style={{ width: 150 }}
    size="small"
    header={<div>Header</div>}
    footer={<div>Footer</div>}
    dataSource={listData}
    renderItem={item => <List.Item>{item}</List.Item>}
  />
  
  <List
    header={<div>No Data Example</div>}
    dataSource={[]}
    renderItem={item => <List.Item>{item}</List.Item>}
  />
);
              `}
            />
          </div>
        </div>
      </div>

      <div className="component">
        <div className="flex justify-between align-start">
          <div className="flex column">
            <Title underline>Popover</Title>
            <br />
            <Popover
              content={
                <div className="flex column">
                  <p>Popover Content</p>
                  <span className="link-btn" onClick={() => setPopoverVisible(false)}>
                    Close
                  </span>
                </div>
              }
              title="Title"
              visible={popoverVisible}
              trigger="click">
              <Button ghost onClick={() => setPopoverVisible(true)}>
                Click Me
              </Button>
            </Popover>
            <br />
            <Popover content={<p>Popover Content</p>} title="Title" trigger="hover">
              <p className="text-btn">Hover Me</p>
            </Popover>
          </div>
          <div className="code-block">
            <CopyBlock
              theme={dracula}
              language="jsx"
              text={`
import { useState } from 'react';
import { Popover, Button } from 'antd';

const [popoverVisible, setPopoverVisible] = useState(false);

return (
  <Popover
    content={
      <div className="flex column">
        <p>Popover Content</p>
        <span 
          className="link-btn" 
          onClick={() => setPopoverVisible(false)}>
          Close
        </span>
      </div>
    }
    title="Title"
    visible={popoverVisible}
    trigger="click">
    <Button ghost onClick={() => setPopoverVisible(true)}>
      Click Me
    </Button>
  </Popover>
  
  <Popover 
    content={<p>Popover Content</p>} 
    title="Title" 
    trigger="hover">
    <p className="text-btn">Hover Me</p>
  </Popover>
);
              `}
            />
          </div>
        </div>
      </div>

      <div className="component">
        <div className="flex justify-between align-start">
          <div className="flex column">
            <Title underline>Table</Title>
            <br />
            <Table dataSource={tableDataSource} columns={tableColumns} pagination={false} />
            <br />
            <br />
            <Table className="no-interaction" bordered dataSource={tableDataSource} columns={tableColumns} />
          </div>
          <div className="code-block">
            <CopyBlock
              theme={dracula}
              language="jsx"
              text={`
import { Table } from 'antd';

const tableDataSource = [
  {
    key: '1',
    name: 'Mike',
    age: 32,
    address: '10 Downing Street'
  },
  {
    key: '2',
    name: 'John',
    age: 42,
    address: '10 Downing Street'
  },
  {
    key: '3',
    name: 'Jimmy',
    age: 60,
    address: '155 Loft Street'
  }
];
const tableColumns = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: 'Age',
    dataIndex: 'age',
    key: 'age'
  },
  {
    title: 'Address',
    dataIndex: 'address',
    key: 'address'
  }
];

return (
  <Table 
    dataSource={tableDataSource} 
    columns={tableColumns} 
    pagination={false} 
  />
  <Table 
    className="no-interaction" 
    bordered 
    dataSource={tableDataSource} 
    columns={tableColumns} 
  />
);
              `}
            />
          </div>
        </div>
      </div>

      <div className="component">
        <div className="flex justify-between align-start">
          <div className="flex column">
            <Title underline>Tabs</Title>
            <br />
            <Tabs defaultActiveKey="1" onChange={() => null}>
              <TabPane tab="Tab 1" key="1">
                Content of Tab Pane 1
              </TabPane>
              <TabPane tab="Tab 2" key="2">
                Content of Tab Pane 2
              </TabPane>
              <TabPane tab="Tab 3" key="3">
                Content of Tab Pane 3
              </TabPane>
            </Tabs>
          </div>
          <div className="code-block">
            <CopyBlock
              theme={dracula}
              language="jsx"
              text={`
import { Tabs } from 'antd';

const { TabPane } = Tabs;

<Tabs defaultActiveKey="1" onChange={() => null}>
  <TabPane tab="Tab 1" key="1">
    Content of Tab Pane 1
  </TabPane>
  <TabPane tab="Tab 2" key="2">
    Content of Tab Pane 2
  </TabPane>
  <TabPane tab="Tab 3" key="3">
    Content of Tab Pane 3
  </TabPane>
</Tabs>
              `}
            />
          </div>
        </div>
      </div>

      <div className="component">
        <div className="flex justify-between align-start">
          <div className="flex column">
            <Title underline>Tag</Title>
            <br />
            <div className="flex justify-start align-center">
              <Tag>Tag 1</Tag>
              <Tag closable onClose={() => null}>
                Tag 2
              </Tag>
            </div>
            <br />
            <div className="flex justify-start align-center">
              <Tag color="var(--success)">Success</Tag>
              <Tag color="var(--failure)" closable onClose={() => null}>
                Failure
              </Tag>
              <Tag color="#a13090">Custom Color</Tag>
            </div>
          </div>
          <div className="code-block">
            <CopyBlock
              theme={dracula}
              language="jsx"
              text={`
import { Tag } from 'antd';

return (
  <div className="flex justify-start align-center">
    <Tag>Tag 1</Tag>
    <Tag closable onClose={() => null}>
      Tag 2
    </Tag>
  </div>

  <div className="flex justify-start align-center">
    <Tag color="var(--success)">Success</Tag>
    <Tag color="var(--failure)" closable onClose={() => null}>
      Failure
    </Tag>
    <Tag color="#a13090">Custom Color</Tag>
  </div>
);
              `}
            />
          </div>
        </div>
      </div>

      <div className="component">
        <div className="flex justify-between align-start">
          <div className="flex column">
            <Title underline>Timeline</Title>
            <br />
            <Timeline pending={<>Pending item at end</>}>
              <Timeline.Item>First item</Timeline.Item>
              <Timeline.Item color="#e3cb79">The third, with a custom color</Timeline.Item>
              <Timeline.Item>Last item</Timeline.Item>
            </Timeline>
          </div>
          <div className="code-block">
            <CopyBlock
              theme={dracula}
              language="jsx"
              text={`
import { Timeline } from 'antd';

return (
  <Timeline pending={<>Pending item at end</>}>
    <Timeline.Item>First item</Timeline.Item>
    <Timeline.Item 
      color="#e3cb79">
      The third, with a custom color
    </Timeline.Item>
    <Timeline.Item>Last item</Timeline.Item>
  </Timeline>
);
              `}
            />
          </div>
        </div>
      </div>

      <div className="component">
        <div className="flex justify-between align-start">
          <div className="flex column">
            <Title underline>Tooltip</Title>
            <br />
            <Tooltip title="prompt text">
              <span>Hover me.</span>
            </Tooltip>
            <br />
            <Tooltip title="This is another tooltip, that you had to click." visible={tooltipVisible} trigger="click">
              <Button ghost onClick={() => setTooltipVisible(!tooltipVisible)}>
                {tooltipVisible ? 'Close' : 'Open'}
              </Button>
            </Tooltip>
          </div>
          <div className="code-block">
            <CopyBlock
              theme={dracula}
              language="jsx"
              text={`
import { Tooltip, Button } from 'antd';

const [tooltipVisible, setTooltipVisible] = useState(false);

return (
  <Tooltip title="Prompt text">
    <span>Hover me.</span>
  </Tooltip>

  <Tooltip
    title="This is another tooltip, that you had to click."
    visible={tooltipVisible}
    trigger="click">
    <Button ghost onClick={() => setTooltipVisible(!tooltipVisible)}>
      {tooltipVisible ? 'Close' : 'Open'}
    </Button>
  </Tooltip>
);
              `}
            />
          </div>
        </div>
      </div>

      <div className="component">
        <div className="flex justify-between align-start">
          <div className="flex column">
            <Title underline></Title>
            <br />
          </div>
          <div className="code-block">
            <CopyBlock
              theme={dracula}
              language="jsx"
              text={`
              `}
            />
          </div>
        </div>
      </div>

      <div className="component">
        <div className="flex justify-between align-start">
          <div className="flex column">
            <Title underline></Title>
            <br />
          </div>
          <div className="code-block">
            <CopyBlock
              theme={dracula}
              language="jsx"
              text={`
              `}
            />
          </div>
        </div>
      </div>

      <div className="component">
        <div className="flex justify-between align-start">
          <div className="flex column">
            <Title underline></Title>
            <br />
          </div>
          <div className="code-block">
            <CopyBlock
              theme={dracula}
              language="jsx"
              text={`
              `}
            />
          </div>
        </div>
      </div>

      <div className="component">
        <div className="flex justify-between align-start">
          <div className="flex column">
            <Title underline></Title>
            <br />
          </div>
          <div className="code-block">
            <CopyBlock
              theme={dracula}
              language="jsx"
              text={`
              `}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
