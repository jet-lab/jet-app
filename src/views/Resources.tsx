import { useDarkTheme } from '../contexts/darkTheme';
import { CopyBlock, dracula } from 'react-code-blocks';
import { Typography, Switch } from 'antd';

export function Resources(): JSX.Element {
  const { Title, Text } = Typography;
  const { darkTheme, toggleDarkTheme } = useDarkTheme();

  return (
    <div className="container flex column align-start">
      <Title underline>Notes</Title>
      <Text code mark>
        npm install @jet-lab/jet-antd@latest
      </Text>
      <Text>OR</Text>
      <Text code mark>
        yarn add @jet-lab/jet-antd@latest
      </Text>
      <br />
      <Text>
        <Text code mark>
          @import "~@jet-lab/jet-antd/lib/jet-antd.less";
        </Text>{' '}
        into your{' '}
        <Text code mark>
          App.less
        </Text>
      </Text>
      <br />
      <Text>
        Your app must be wrapped in a{' '}
        <Text code mark>
          .jet-app
        </Text>{' '}
        tag on the{' '}
        <Text code mark>
          body
        </Text>
      </Text>
      <br />
      <Title underline>Common Variables</Title>
      <Switch checkedChildren="Dark" unCheckedChildren="Light" checked={darkTheme} onChange={toggleDarkTheme} />
      <div className="flex align-start column">
        <br />
        <div className="variable flex-centered">
          <code>@neu-shadow</code>
          <div className="neu-block"></div>
        </div>
        <div className="variable flex-centered">
          <code>@neu-shadow-low</code>
          <div className="neu-block neu-block-low"></div>
        </div>
        <div className="variable flex-centered">
          <code>@neu-shadow-inset</code>
          <div className="neu-block neu-block-inset"></div>
        </div>
        <div className="variable flex-centered">
          <code>@neu-shadow-inset-low</code>
          <div className="neu-block neu-block-inset-low"></div>
        </div>
        <div className="variable flex-centered">
          <code>@neu-shadow-inset-gradient</code>
          <div className="neu-block neu-block-inset-gradient"></div>
        </div>
        <div className="variable flex-centered">
          <code>@neu-shadow-inset-gradient-low</code>
          <div className="neu-block neu-block-inset-gradient-low"></div>
        </div>
        <div className="variable flex-centered">
          <code>@neu-shadow-inset-success</code>
          <div className="neu-block neu-block-inset-success"></div>
        </div>
        <div className="variable flex-centered">
          <code>@neu-shadow-inset-failure</code>
          <div className="neu-block neu-block-inset-failure"></div>
        </div>
        <br />
        <br />
        <div className="variable flex-centered">
          <code>@drop-shadow</code>
          <div
            style={{
              width: 25,
              height: 25,
              marginLeft: 20,
              boxShadow: '0 3px 6px rgba(0, 0, 0, 0.1), 0 3px 6px rgba(0, 0, 0, 0.1)'
            }}></div>
        </div>
        <br />
        <br />
        <div className="variable flex-centered">
          <code>@border-radius</code>
          <div
            className="neu-block"
            style={{
              boxShadow: 'unset',
              background: 'rgb(var(--white))',
              border: '1px solid rgb(var(--black))',
              borderRadius: '4px'
            }}></div>
        </div>
        <div className="variable flex-centered">
          <code>@btn-radius</code>
          <div
            className="neu-block"
            style={{
              boxShadow: 'unset',
              background: 'rgb(var(--white))',
              border: '1px solid rgb(var(--black))',
              borderRadius: '3px'
            }}></div>
        </div>
        <div className="variable flex-centered">
          <code>@round-radius</code>
          <div
            className="neu-block"
            style={{
              boxShadow: 'unset',
              background: 'rgb(var(--white))',
              border: '1px solid rgb(var(--black))',
              borderRadius: '50px'
            }}></div>
        </div>
        <br />
        <br />
        <div className="variable flex-centered">
          <code>@spacing-xs</code>
          <div className="spacing-block spacing-block-xs"></div>
        </div>
        <div className="variable flex-centered">
          <code>@spacing-sm</code>
          <div className="spacing-block spacing-block-sm"></div>
        </div>
        <div className="variable flex-centered">
          <code>@spacing-md</code>
          <div className="spacing-block spacing-block-lg"></div>
        </div>
        <div className="variable flex-centered">
          <code>@spacing-xl</code>
          <div className="spacing-block spacing-block-xl"></div>
        </div>
        <br />
        <br />
        <div className="variable flex-centered">
          <code>@subtle-opacity</code>
          <div style={{ width: 25, height: 25, marginLeft: 20, background: 'rgb(var(--black))', opacity: 0.95 }}></div>
        </div>
        <div className="variable flex-centered">
          <code>@disabled-opacity</code>
          <div style={{ width: 25, height: 25, marginLeft: 20, background: 'rgb(var(--black))', opacity: 0.75 }}></div>
        </div>
        <div className="variable flex-centered">
          <code>@half-opacity</code>
          <div style={{ width: 25, height: 25, marginLeft: 20, background: 'rgb(var(--black))', opacity: 0.65 }}></div>
        </div>
        <br />
        <br />
        <div className="variable flex-centered">
          <code>@header-weight</code>
          <Text style={{ marginLeft: 20, fontWeight: 300 }}>Example Text</Text>
        </div>
        <div className="variable flex-centered">
          <code>@semi-bold-weight</code>
          <Text style={{ marginLeft: 20, fontWeight: 500 }}>Example Text</Text>
        </div>
        <div className="variable flex-centered">
          <code>@subheader-weight</code>
          <Text style={{ marginLeft: 20, fontWeight: 550 }}>Example Text</Text>
        </div>
        <div className="variable flex-centered">
          <code>@bold-weight</code>
          <Text style={{ marginLeft: 20, fontWeight: 600 }}>Example Text</Text>
        </div>
        <br />
        <br />
        <div className="variable flex-centered">
          <code>@black</code>
          <div className="color-block" style={{ background: 'rgb(var(--black))' }}></div>
        </div>
        <div className="variable flex-centered">
          <code>@dark-grey</code>
          <div className="color-block" style={{ background: 'rgb(var(--dark-grey))' }}></div>
        </div>
        <div className="variable flex-centered">
          <code>@grey</code>
          <div className="color-block" style={{ background: 'rgb(var(--grey))' }}></div>
        </div>
        <div className="variable flex-centered">
          <code>@light-grey</code>
          <div className="color-block" style={{ background: 'rgb(var(--light-grey))' }}></div>
        </div>
        <div className="variable flex-centered">
          <code>@white</code>
          <div className="color-block" style={{ background: 'rgb(var(--white))' }}></div>
        </div>
        <div className="variable flex-centered">
          <code>@jet-green</code>
          <div className="color-block" style={{ background: 'var(--jet-green)' }}></div>
        </div>
        <div className="variable flex-centered">
          <code>@jet-blue</code>
          <div className="color-block" style={{ background: 'var(--jet-blue)' }}></div>
        </div>
        <div className="variable flex-centered">
          <code>@gradient</code>
          <div
            className="color-block"
            style={{ background: 'linear-gradient(135deg, var(--jet-green) 25%, var(--jet-blue) 85%)' }}></div>
        </div>
        <div className="variable flex-centered">
          <code>@light-green-1</code>
          <div className="color-block" style={{ background: 'var(--light-green-1)' }}></div>
        </div>
        <div className="variable flex-centered">
          <code>@light-green-1</code>
          <div className="color-block" style={{ background: 'var(--light-green-2)' }}></div>
        </div>
        <div className="variable flex-centered">
          <code>@success</code>
          <div className="color-block" style={{ background: 'var(--success' }}></div>
        </div>
        <div className="variable flex-centered">
          <code>@warning</code>
          <div className="color-block" style={{ background: 'var(--warning)' }}></div>
        </div>
        <div className="variable flex-centered">
          <code>@failure</code>
          <div className="color-block" style={{ background: 'var(--failure)' }}></div>
        </div>
        <br />
        <br />
        <Title underline>Utility Classes</Title>
        <br />
        <div className="code-block">
          <CopyBlock
            theme={dracula}
            lang="css"
            text={`
// Flexbox utility
.flex {
  display: flex;
}
.flex-centered {
  display: flex;
  align-items: center;
  justify-content: center;
}
.align-center {
  align-items: center;
}
.align-evenly {
  align-items: space-evenly;
}
.align-between {
  align-items: space-between;
}
.align-start {
  align-items: flex-start;
}
.align-end {
  align-items: flex-end;
}
.justify-center {
  justify-content: center;
}
.justify-evenly {
  justify-content: space-evenly;
}
.justify-between {
  justify-content: space-between;
}
.justify-start {
  justify-content: flex-start;
}
.justify-end {
  justify-content: flex-end;
}
.column {
  flex-direction: column;
}

// Views
.view {
  width: @view-clamp;
  padding: @spacing-lg @spacing-sm;
  margin: 0 auto;
  transition: margin-left @transition-duration;

  &-header {
    font-size: 90px;
    line-height: 90px;
    opacity: 1;
    margin: 0;
  }
  &-subheader {
    font-weight: @bold-weight;
    text-transform: uppercase;
    font-size: @xs-font-size;
    margin: 0;
  }
}
          `}
          />
        </div>
      </div>
    </div>
  );
}
