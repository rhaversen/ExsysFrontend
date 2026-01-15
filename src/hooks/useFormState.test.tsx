import { renderHook, act } from '@testing-library/react'

import useFormState from './useFormState'

describe('useFormState', () => {
	interface TestForm {
		name: string
		email: string
		nested: {
			value: number
		}
	}

	const initialState: TestForm = {
		name: '',
		email: '',
		nested: { value: 0 }
	}

	describe('initialization', () => {
		it('initializes with provided state', () => {
			const { result } = renderHook(() =>
				useFormState(initialState, false)
			)
			expect(result.current.formState).toEqual(initialState)
		})

		it('initializes formIsValid as true when no validations are tracked', () => {
			const { result } = renderHook(() =>
				useFormState(initialState, false)
			)
			expect(result.current.formIsValid).toBe(true)
		})
	})

	describe('handleFieldChange', () => {
		it('updates top-level field', () => {
			const { result } = renderHook(() =>
				useFormState(initialState, true)
			)

			act(() => {
				result.current.handleFieldChange('name', 'John')
			})

			expect(result.current.formState.name).toBe('John')
		})

		it('updates nested field', () => {
			const { result } = renderHook(() =>
				useFormState(initialState, true)
			)

			act(() => {
				result.current.handleFieldChange('nested.value', 42)
			})

			expect(result.current.formState.nested.value).toBe(42)
		})

		it('does not mutate original state', () => {
			const original = { name: 'Original', email: '', nested: { value: 0 } }
			const { result } = renderHook(() =>
				useFormState(original, true)
			)

			act(() => {
				result.current.handleFieldChange('name', 'Changed')
			})

			expect(original.name).toBe('Original')
			expect(result.current.formState.name).toBe('Changed')
		})

		it('preserves other fields when updating one field', () => {
			const { result } = renderHook(() =>
				useFormState({ name: 'John', email: 'john@test.dk', nested: { value: 5 } }, true)
			)

			act(() => {
				result.current.handleFieldChange('name', 'Jane')
			})

			expect(result.current.formState.name).toBe('Jane')
			expect(result.current.formState.email).toBe('john@test.dk')
			expect(result.current.formState.nested.value).toBe(5)
		})
	})

	describe('handleValidationChange', () => {
		it('tracks field validation status', () => {
			const { result } = renderHook(() =>
				useFormState(initialState, true)
			)

			act(() => {
				result.current.handleValidationChange('name', true)
			})

			expect(result.current.formIsValid).toBe(true)
		})

		it('formIsValid is true when all fields are valid', () => {
			const { result } = renderHook(() =>
				useFormState(initialState, true)
			)

			act(() => {
				result.current.handleValidationChange('name', true)
				result.current.handleValidationChange('email', true)
			})

			expect(result.current.formIsValid).toBe(true)
		})

		it('formIsValid is false when any field is invalid', () => {
			const { result } = renderHook(() =>
				useFormState(initialState, true)
			)

			act(() => {
				result.current.handleValidationChange('name', true)
				result.current.handleValidationChange('email', false)
			})

			expect(result.current.formIsValid).toBe(false)
		})

		it('updates formIsValid when validation changes', () => {
			const { result } = renderHook(() =>
				useFormState(initialState, true)
			)

			act(() => {
				result.current.handleValidationChange('name', false)
			})
			expect(result.current.formIsValid).toBe(false)

			act(() => {
				result.current.handleValidationChange('name', true)
			})
			expect(result.current.formIsValid).toBe(true)
		})
	})

	describe('resetFormState', () => {
		it('resets form to initial state', () => {
			const { result } = renderHook(() =>
				useFormState(initialState, true)
			)

			act(() => {
				result.current.handleFieldChange('name', 'Changed')
				result.current.handleFieldChange('email', 'test@test.dk')
			})

			expect(result.current.formState.name).toBe('Changed')

			act(() => {
				result.current.resetFormState()
			})

			expect(result.current.formState).toEqual(initialState)
		})

		it('clears all validation states and returns formIsValid to true', () => {
			const { result } = renderHook(() =>
				useFormState(initialState, true)
			)

			act(() => {
				result.current.handleValidationChange('name', true)
				result.current.handleValidationChange('email', false)
			})
			expect(result.current.formIsValid).toBe(false)

			act(() => {
				result.current.resetFormState()
			})

			expect(result.current.formIsValid).toBe(true)
		})
	})

	describe('isEditing sync behavior', () => {
		it('syncs with initialState when not editing', () => {
			let initialValue = { name: 'First', email: '', nested: { value: 0 } }
			const { result, rerender } = renderHook(
				({ initial, editing }) => useFormState(initial, editing),
				{ initialProps: { initial: initialValue, editing: false } }
			)

			expect(result.current.formState.name).toBe('First')

			initialValue = { name: 'Updated', email: '', nested: { value: 0 } }
			rerender({ initial: initialValue, editing: false })

			expect(result.current.formState.name).toBe('Updated')
		})

		it('does not sync with initialState when editing', () => {
			let initialValue = { name: 'First', email: '', nested: { value: 0 } }
			const { result, rerender } = renderHook(
				({ initial, editing }) => useFormState(initial, editing),
				{ initialProps: { initial: initialValue, editing: true } }
			)

			act(() => {
				result.current.handleFieldChange('name', 'UserEdit')
			})

			initialValue = { name: 'External', email: '', nested: { value: 0 } }
			rerender({ initial: initialValue, editing: true })

			expect(result.current.formState.name).toBe('UserEdit')
		})
	})

	describe('complex state updates', () => {
		it('handles deeply nested updates', () => {
			interface DeepState {
				level1: {
					level2: {
						level3: string
					}
				}
			}
			const deepInitial: DeepState = {
				level1: { level2: { level3: 'initial' } }
			}

			const { result } = renderHook(() =>
				useFormState(deepInitial, true)
			)

			act(() => {
				result.current.handleFieldChange('level1.level2.level3', 'updated')
			})

			expect(result.current.formState.level1.level2.level3).toBe('updated')
		})

		it('handles array field updates', () => {
			interface ArrayState {
				items: string[]
			}
			const arrayInitial: ArrayState = { items: ['a', 'b', 'c'] }

			const { result } = renderHook(() =>
				useFormState(arrayInitial, true)
			)

			act(() => {
				result.current.handleFieldChange('items', ['x', 'y', 'z'])
			})

			expect(result.current.formState.items).toEqual(['x', 'y', 'z'])
		})
	})
})
