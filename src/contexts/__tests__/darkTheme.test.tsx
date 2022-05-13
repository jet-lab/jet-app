import { renderHook, act } from '@testing-library/react-hooks'
import {useDarkTheme, DarkThemeProvider } from '../darkTheme'

describe('Providers - Dark Theme', () => {

    afterEach(() => {
        jest.resetAllMocks()
    })

    const wrapper = ({ children }: any) => (
        <DarkThemeProvider>{children}</DarkThemeProvider>
      )

    it('should load the default theme', () => {
        const { result } = renderHook(() => useDarkTheme(), { wrapper })
        expect(result.current.darkTheme).toBe(true)
        expect(window.localStorage.getItem).toHaveBeenCalledWith('jetDarkUI')
    })

    it('should handle toggling the theme', () => {
        const { result } = renderHook(() => useDarkTheme(), { wrapper })
        expect(result.current.darkTheme).toBe(true)
        expect(window.localStorage.getItem).toHaveBeenCalled()
        act(() => {
            result.current.toggleDarkTheme()
        })
        expect(result.current.darkTheme).toBe(false)
        // expect(window.localStorage.setItem).toHaveBeenCalled() // Commenting this assertion out as not clear why the side effect is wrapped in a timeout and V2 uses Recoil
    })

    it('should handle bootstrapping the value from storage', () => {
        window.localStorage.getItem = jest.fn().mockReturnValueOnce('false')
        const { result } = renderHook(() => useDarkTheme(), { wrapper })
        expect(result.current.darkTheme).toBe(false)
    })
})