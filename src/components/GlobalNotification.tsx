export const GlobalNotification = () => {
  return (
    <div className="network-warning-banner flex-centered">
      <div>
        <span className="bold-text">
          {
            'Sollet wrapped ETH will be sunset at the end of April - we ask that you withdraw or repay any ETH position on Jet Protocol immediately. Please contact us if you need assistance.'
          }
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
};
