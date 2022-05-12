import { Loader } from '../Loader'
import { render, screen } from '@testing-library/react'

describe('Components - Info', () => {
    it('should render without error', () => {
        render(<Loader />)
        const logo = screen.getByRole('img')
        expect(logo).toBeInTheDocument()
        expect(logo).toHaveProperty('alt', 'Jet Logomark')
    })
})