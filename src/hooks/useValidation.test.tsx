import { renderHook } from '@testing-library/react'

import useValidation from './useValidation'

describe('useValidation', () => {
	describe('required field validation', () => {
		it('returns invalid when required field is empty', () => {
			const { result } = renderHook(() =>
				useValidation('', undefined, true, 'Navn', 1, 100, 1000, 'text')
			)
			expect(result.current.isValid).toBe(false)
		})

		it('returns valid when required field has value', () => {
			const { result } = renderHook(() =>
				useValidation('Test', undefined, true, 'Navn', 1, 100, 1000, 'text')
			)
			expect(result.current.isValid).toBe(true)
			expect(result.current.errors).toHaveLength(0)
		})

		it('returns valid when optional field is empty', () => {
			const { result } = renderHook(() =>
				useValidation('', undefined, false, 'Navn', 1, 100, 1000, 'text')
			)
			expect(result.current.isValid).toBe(true)
		})
	})

	describe('length validation', () => {
		it('returns error when value is too short', () => {
			const { result } = renderHook(() =>
				useValidation('ab', undefined, true, 'Navn', 5, 100, 1000, 'text')
			)
			expect(result.current.errors).toContain('Navn skal være mindst 5 tegn lang')
			expect(result.current.isValid).toBe(false)
		})

		it('returns error when value is too long', () => {
			const { result } = renderHook(() =>
				useValidation('abcdefghijk', undefined, true, 'Navn', 1, 5, 1000, 'text')
			)
			expect(result.current.errors).toContain('Navn kan ikke være længere end 5 tegn')
			expect(result.current.isValid).toBe(false)
		})

		it('returns valid when value length is within bounds', () => {
			const { result } = renderHook(() =>
				useValidation('test', undefined, true, 'Navn', 1, 10, 1000, 'text')
			)
			expect(result.current.errors).toHaveLength(0)
			expect(result.current.isValid).toBe(true)
		})

		it('returns error when exact length required but not met', () => {
			const { result } = renderHook(() =>
				useValidation('abc', undefined, true, 'Kode', 4, 4, 1000, 'text')
			)
			expect(result.current.errors).toContain('Kode skal være præcis 4 tegn lang')
		})

		it('returns valid when exact length is met', () => {
			const { result } = renderHook(() =>
				useValidation('abcd', undefined, true, 'Kode', 4, 4, 1000, 'text')
			)
			expect(result.current.errors).toHaveLength(0)
			expect(result.current.isValid).toBe(true)
		})
	})

	describe('number validation', () => {
		it('returns error when number exceeds max value', () => {
			const { result } = renderHook(() =>
				useValidation('150', undefined, true, 'Pris', 1, 10, 100, 'number')
			)
			expect(result.current.errors).toContain('Pris kan ikke være større end 100')
		})

		it('returns valid when number is within max value', () => {
			const { result } = renderHook(() =>
				useValidation('50', undefined, true, 'Pris', 1, 10, 100, 'number')
			)
			expect(result.current.errors).not.toContain('Pris kan ikke være større end 100')
		})

		it('does not check max value for text type', () => {
			const { result } = renderHook(() =>
				useValidation('150', undefined, true, 'Navn', 1, 10, 100, 'text')
			)
			expect(result.current.errors).not.toContain('Navn kan ikke være større end 100')
		})
	})

	describe('custom validations', () => {
		it('applies custom validation function', () => {
			const validations = [{
				validate: (v: string) => v.includes('@'),
				message: 'Email skal indeholde @'
			}]
			const { result } = renderHook(() =>
				useValidation('test', validations, true, 'Email', 1, 100, 1000, 'text')
			)
			expect(result.current.errors).toContain('Email skal indeholde @')
		})

		it('passes when custom validation succeeds', () => {
			const validations = [{
				validate: (v: string) => v.includes('@'),
				message: 'Email skal indeholde @'
			}]
			const { result } = renderHook(() =>
				useValidation('test@test.dk', validations, true, 'Email', 1, 100, 1000, 'text')
			)
			expect(result.current.errors).not.toContain('Email skal indeholde @')
		})

		it('applies multiple custom validations', () => {
			const validations = [
				{ validate: (v: string) => v.includes('@'), message: 'Skal indeholde @' },
				{ validate: (v: string) => v.includes('.'), message: 'Skal indeholde .' }
			]
			const { result } = renderHook(() =>
				useValidation('test', validations, true, 'Email', 1, 100, 1000, 'text')
			)
			expect(result.current.errors).toContain('Skal indeholde @')
			expect(result.current.errors).toContain('Skal indeholde .')
		})

		it('handles undefined validations', () => {
			const { result } = renderHook(() =>
				useValidation('test', undefined, true, 'Navn', 1, 100, 1000, 'text')
			)
			expect(result.current.errors).toHaveLength(0)
		})
	})

	describe('reactive updates', () => {
		it('updates validation when value changes', () => {
			let value = 'ab'
			const { result, rerender } = renderHook(() =>
				useValidation(value, undefined, true, 'Navn', 5, 100, 1000, 'text')
			)

			expect(result.current.isValid).toBe(false)

			value = 'abcdef'
			rerender()

			expect(result.current.isValid).toBe(true)
		})
	})

	describe('edge cases', () => {
		it('handles empty string with optional field', () => {
			const { result } = renderHook(() =>
				useValidation('', undefined, false, 'Beskrivelse', 0, 1000, 1000, 'text')
			)
			expect(result.current.isValid).toBe(true)
			expect(result.current.errors).toHaveLength(0)
		})

		it('handles value at exact min length boundary', () => {
			const { result } = renderHook(() =>
				useValidation('abc', undefined, true, 'Navn', 3, 10, 1000, 'text')
			)
			expect(result.current.isValid).toBe(true)
		})

		it('handles value at exact max length boundary', () => {
			const { result } = renderHook(() =>
				useValidation('abcdefghij', undefined, true, 'Navn', 1, 10, 1000, 'text')
			)
			expect(result.current.isValid).toBe(true)
		})

		it('handles number at exact max value boundary', () => {
			const { result } = renderHook(() =>
				useValidation('100', undefined, true, 'Pris', 1, 10, 100, 'number')
			)
			expect(result.current.errors).not.toContain('Pris kan ikke være større end 100')
		})
	})
})
