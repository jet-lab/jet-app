import { createContext, useContext, useEffect, useState } from 'react';
import Jet_UI_EN from './languages/Jet_UI_EN.json';
import Jet_Definitions_EN from './languages/Jet_Definitions_EN.json';

// Localization context
interface Localization {
  preferredLanguage: string;
  setPreferredLanguage: (lang: string) => void;
  isGeobanned: boolean;
}
const LocalizationContext = createContext<Localization>({
  preferredLanguage: '',
  setPreferredLanguage: () => null,
  isGeobanned: false
});

// Localization context provider
export function LocalizationProvider(props: { children: JSX.Element }): JSX.Element {
  const preferredLang = localStorage.getItem('jetPreferredLanguage');
  const [preferredLanguage, setPreferredLanguage] = useState(preferredLang ?? 'en');
  const [isGeobanned, setIsGeobanned] = useState(false);

  // Get user's preferred language from browser
  useEffect(() => {
    let locale: any = null;

    // Get user's IP to determine location/geobanning
    const getIP = async () => {
      const ipKey = process.env.REACT_APP_IP_REGISTRY;

      try {
        const resp = await fetch(`https://api.ipregistry.co/?key=${ipKey}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        locale = await resp.json();
        const countryCode = locale.location.country.code;
        geoBannedCountries.forEach(c => {
          if (c.code === countryCode) {
            // If country is Ukraine, checks if first two digits
            // of the postal code further match Crimean postal codes.
            if (countryCode !== 'UA' || isCrimea(locale)) {
              setIsGeobanned(true);
            }
          }
        });
      } catch (err) {
        console.log(err);
      }
    };

    // Check to see if user's locale is special case of Crimea
    const isCrimea = (locale: any) => {
      const postalCode: string = locale?.postal.toString().substring(0, 2);
      if (postalCode === '95' || postalCode === '96' || postalCode === '97' || postalCode === '98') {
        return true;
      } else {
        return false;
      }
    };

    getIP();
  }, [setPreferredLanguage]);

  return (
    <LocalizationContext.Provider
      value={{
        preferredLanguage,
        setPreferredLanguage,
        isGeobanned
      }}>
      {props.children}
    </LocalizationContext.Provider>
  );
}

// Geoban Hook
export const useGeoban = () => {
  const context = useContext(LocalizationContext);
  return context.isGeobanned;
};

// Language Hook
export const useLanguage = () => {
  const { preferredLanguage, setPreferredLanguage } = useContext(LocalizationContext);
  return {
    language: preferredLanguage,
    dictionary: uiDictionary[preferredLanguage],
    changeLanguage: (lang: string) => {
      localStorage.setItem('jetPreferredLanguage', lang);
      setPreferredLanguage(lang);
    }
  };
};

// UI dictionary
export const uiDictionary: any = {
  // English
  en: Jet_UI_EN
};

// Definitions of various terminology
export const definitions: any = {
  // English
  en: Jet_Definitions_EN
};

// Banned countries
export const geoBannedCountries = [
  {
    country: 'Afghanistan',
    code: 'AF'
  },
  {
    country: 'Crimea (Ukraine)',
    code: 'UA'
  },
  {
    country: 'Cuba',
    code: 'CU'
  },
  {
    country: 'Democratic Republic of Congo',
    code: 'CD'
  },
  {
    country: 'Iran',
    code: 'IR'
  },
  {
    country: 'Iraq',
    code: 'IQ'
  },
  {
    country: 'Libya',
    code: 'LY'
  },
  {
    country: 'North Korea',
    code: 'KP'
  },
  {
    country: 'Sudan',
    code: 'SD'
  },
  {
    country: 'Syria',
    code: 'SY'
  },
  {
    country: 'Tajikistan',
    code: 'TJ'
  },
  {
    country: 'Venezuela',
    code: 'VE'
  }
];
