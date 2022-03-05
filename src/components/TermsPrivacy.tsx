import { useLanguage } from '../contexts/localization/localization';

export function TermsPrivacy(): JSX.Element {
  const { dictionary } = useLanguage();

  return (
    <div className="terms-privacy flex-centered">
      <a href="https://www.jetprotocol.io/terms-of-use" target="_blank" rel="noopener noreferrer">
        <span className="text-btn">{dictionary.termsPrivacy.termsOfUse}</span>
      </a>
      <a href="https://www.jetprotocol.io/privacy-policy" target="_blank" rel="noopener noreferrer">
        <span className="text-btn">{dictionary.termsPrivacy.privacyPolicy}</span>
      </a>
    </div>
  );
}
