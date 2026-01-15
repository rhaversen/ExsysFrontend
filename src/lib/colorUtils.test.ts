import { getColorForName, getColorsForNames, getColorMapForNames } from './colorUtils'

describe('colorUtils', () => {
	describe('getColorForName', () => {
		it('returns grey for empty string', () => {
			expect(getColorForName('')).toBe('#808080')
		})

		it('returns grey for undefined/null-like values', () => {
			expect(getColorForName(null as unknown as string)).toBe('#808080')
			expect(getColorForName(undefined as unknown as string)).toBe('#808080')
		})

		it('returns a valid hex color for a name', () => {
			const color = getColorForName('TestName')
			expect(color).toMatch(/^#[0-9a-f]{6}$/i)
		})

		it('returns the same color for the same name', () => {
			const color1 = getColorForName('ConsistentName')
			const color2 = getColorForName('ConsistentName')
			expect(color1).toBe(color2)
		})

		it('returns different colors for different names', () => {
			const color1 = getColorForName('UniqueNameA')
			const color2 = getColorForName('UniqueNameB')
			expect(color1).not.toBe(color2)
		})

		it('differentiates same name with different types', () => {
			const colorProduct = getColorForName('SameName', 'product')
			const colorActivity = getColorForName('SameName', 'activity')
			expect(colorProduct).not.toBe(colorActivity)
		})

		it('treats empty type string same as no type', () => {
			const colorNoType = getColorForName('TypeTestName')
			const colorEmptyType = getColorForName('TypeTestName', '')
			const colorWhitespaceType = getColorForName('TypeTestName', '   ')
			expect(colorNoType).toBe(colorEmptyType)
			expect(colorNoType).toBe(colorWhitespaceType)
		})

		it('generates unique colors for many names', () => {
			const colors = new Set<string>()
			for (let i = 0; i < 50; i++) {
				colors.add(getColorForName(`UniqueName${i}`))
			}
			expect(colors.size).toBe(50)
		})
	})

	describe('getColorsForNames', () => {
		it('returns empty array for empty input', () => {
			expect(getColorsForNames([])).toEqual([])
		})

		it('returns array of colors matching input length', () => {
			const names = ['Alice', 'Bob', 'Charlie']
			const colors = getColorsForNames(names)
			expect(colors).toHaveLength(3)
			colors.forEach(color => {
				expect(color).toMatch(/^#[0-9a-f]{6}$/i)
			})
		})

		it('returns consistent colors for same names', () => {
			const names = ['Alice', 'Bob']
			const colors1 = getColorsForNames(names)
			const colors2 = getColorsForNames(names)
			expect(colors1).toEqual(colors2)
		})

		it('applies type to all names', () => {
			const names = ['Item1', 'Item2']
			const colorsProduct = getColorsForNames(names, 'product')
			const colorsActivity = getColorsForNames(names, 'activity')
			expect(colorsProduct[0]).not.toBe(colorsActivity[0])
			expect(colorsProduct[1]).not.toBe(colorsActivity[1])
		})

		it('handles duplicate names in input', () => {
			const names = ['Duplicate', 'Duplicate', 'Unique']
			const colors = getColorsForNames(names)
			expect(colors[0]).toBe(colors[1])
			expect(colors[0]).not.toBe(colors[2])
		})
	})

	describe('getColorMapForNames', () => {
		it('returns empty object for empty input', () => {
			expect(getColorMapForNames([])).toEqual({})
		})

		it('returns map with all names as keys', () => {
			const names = ['Alice', 'Bob', 'Charlie']
			const colorMap = getColorMapForNames(names)
			expect(Object.keys(colorMap)).toHaveLength(3)
			expect(colorMap).toHaveProperty('Alice')
			expect(colorMap).toHaveProperty('Bob')
			expect(colorMap).toHaveProperty('Charlie')
		})

		it('maps names to valid hex colors', () => {
			const names = ['Test1', 'Test2']
			const colorMap = getColorMapForNames(names)
			Object.values(colorMap).forEach(color => {
				expect(color).toMatch(/^#[0-9a-f]{6}$/i)
			})
		})

		it('handles duplicate names (last value wins but same color)', () => {
			const names = ['Dup', 'Dup', 'Other']
			const colorMap = getColorMapForNames(names)
			expect(Object.keys(colorMap)).toHaveLength(2)
		})

		it('applies type to differentiate names', () => {
			const names = ['SharedName']
			const mapProduct = getColorMapForNames(names, 'product')
			const mapActivity = getColorMapForNames(names, 'activity')
			expect(mapProduct['SharedName']).not.toBe(mapActivity['SharedName'])
		})

		it('returns consistent mapping for same input', () => {
			const names = ['A', 'B', 'C']
			const map1 = getColorMapForNames(names)
			const map2 = getColorMapForNames(names)
			expect(map1).toEqual(map2)
		})
	})

	describe('color generation quality', () => {
		it('generates visually distinct colors (not too similar)', () => {
			const colors: string[] = []
			for (let i = 0; i < 10; i++) {
				colors.push(getColorForName(`DistinctTest${i}`))
			}

			for (let i = 0; i < colors.length; i++) {
				for (let j = i + 1; j < colors.length; j++) {
					expect(colors[i]).not.toBe(colors[j])
				}
			}
		})

		it('generates colors within valid RGB range', () => {
			for (let i = 0; i < 20; i++) {
				const color = getColorForName(`RangeTest${i}`)
				const r = parseInt(color.slice(1, 3), 16)
				const g = parseInt(color.slice(3, 5), 16)
				const b = parseInt(color.slice(5, 7), 16)

				expect(r).toBeGreaterThanOrEqual(0)
				expect(r).toBeLessThanOrEqual(255)
				expect(g).toBeGreaterThanOrEqual(0)
				expect(g).toBeLessThanOrEqual(255)
				expect(b).toBeGreaterThanOrEqual(0)
				expect(b).toBeLessThanOrEqual(255)
			}
		})
	})
})
