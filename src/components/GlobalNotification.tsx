import { useState } from 'react';
import { useUser } from '../v1/contexts/user';

export const GlobalNotification = () => {
  const user = useUser();

  if (user.collateralBalances['ETH'] > 0 || user.loanBalances['ETH'] > 0) {
    return (
      <div className="network-warning-banner flex-centered">
        <div>
          <span className="bold-text">
            {
              'You currently have deposited or borrowed ETH.  We ask that you withdraw or repay any ETH positions on Jet Protocol as soon as possible as Sollet wrapped ETH will be sunset at the end of April.'
            }
            <br />
          </span>
          <div className="flex-centered">
            <span className="link-btn" id="learn-link">
              <a
                href="https://jet-association.gitbook.io/jet-association-1.0.0/collateral-off-boarding/sunsetting-sollet-wrapped-eth"
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
  }
};
