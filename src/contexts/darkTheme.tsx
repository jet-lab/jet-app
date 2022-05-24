import { createContext, useContext, useState, useEffect } from 'react';

// Dark theme context
interface DarkTheme {
  darkTheme: boolean;
  setDarkTheme: (darkTheme: boolean) => void;
}
export const DarkThemeContext = createContext<DarkTheme>({
  darkTheme: true,
  setDarkTheme: () => null
});

export function DarkThemeProvider(props: { children: JSX.Element }): JSX.Element {
  const preference = localStorage.getItem('jetDarkUI');
  const [darkTheme, setDarkTheme] = useState(preference ? preference === 'true' : true);
  useEffect(() => {
    setTimeout(() => {
      localStorage.setItem('jetDarkUI', JSON.stringify(darkTheme));
      ['black', 'secondary-5', 'grey', 'primary-3', 'white', 'light-shadow', 'dark-shadow'].forEach(color => {
        document.documentElement.style.setProperty(`--${color}`, `var(--${darkTheme ? 'dt' : 'lt'}-${color})`);
      });
    }, 150);
  }, [darkTheme]);

  return (
    <DarkThemeContext.Provider
      value={{
        darkTheme,
        setDarkTheme
      }}>
      {props.children}
    </DarkThemeContext.Provider>
  );
}

// Dark theme hook
export const useDarkTheme = () => {
  const { darkTheme, setDarkTheme } = useContext(DarkThemeContext);
  return {
    darkTheme,
    toggleDarkTheme: () => setDarkTheme(!darkTheme)
  };
};
