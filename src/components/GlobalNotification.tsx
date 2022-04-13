import { useState } from 'react';

export const GlobalNotification = () => {
  const [show, setShow] = useState(true);

  if (show) {
    return (
      <div className="network-warning-banner flex-centered">
        <div>
          <span className="bold-text">
            {
              'Sollet wrapped ETH will be sunset at the end of April - we ask that you withdraw or repay any ETH positions on Jet Protocol  at your earliest convenience.'
            }
            <br />
          </span>
          <div className="flex-centered">
            <span className="link-btn" id="learn-link">
              <a
                href="https://twitter.com/JetProtocol/status/1513548211335565316/"
                target="_blank"
                rel="noopener noreferrer">
                Click here to learn more
              </a>
            </span>
          </div>
        </div>
      </div>
    );
  } else {
    return null;
  }
};
