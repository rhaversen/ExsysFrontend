// New dynamic color generator

type ColorConfig = { saturation: number; lightness: number }
const COLOR_CONFIGS: ColorConfig[] = [
	{ saturation: 0.65, lightness: 0.65 }, // vibrant
	{ saturation: 0.50, lightness: 0.75 }, // muted
	{ saturation: 0.90, lightness: 0.40 } // eccentric
]

const GOLDEN_ANGLE = 137.508 // degrees

let nextColorIndex = 0
const nameColorMap: Record<string, string> = {}

function hslToRgb (h: number, s: number, l: number): [number, number, number] {
	const saturation = Math.max(0, Math.min(1, s))
	const lightness = Math.max(0, Math.min(1, l))
	const c = (1 - Math.abs(2 * lightness - 1)) * saturation
	const hp = h / 60
	const x = c * (1 - Math.abs((hp % 2) - 1))
	let r1 = 0
	let g1 = 0
	let b1 = 0

	if (hp < 1) {
		r1 = c
		g1 = x
	} else if (hp < 2) {
		r1 = x
		g1 = c
	} else if (hp < 3) {
		g1 = c
		b1 = x
	} else if (hp < 4) {
		g1 = x
		b1 = c
	} else if (hp < 5) {
		r1 = x
		b1 = c
	} else {
		r1 = c
		b1 = x
	}

	const m = lightness - c / 2
	return [
		Math.round((r1 + m) * 255),
		Math.round((g1 + m) * 255),
		Math.round((b1 + m) * 255)
	]
}

function rgbToHex (r: number, g: number, b: number): string {
	const toHex = (v: number) => v.toString(16).padStart(2, '0')
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function generateColor (index: number): string {
	const hue = (index * GOLDEN_ANGLE) % 360
	const config = COLOR_CONFIGS[index % COLOR_CONFIGS.length]
	const [r, g, b] = hslToRgb(hue, config.saturation, config.lightness)

	return rgbToHex(r, g, b)
}

/**
 * Gets a unique color for a given name, assigning new colors as needed without reuse.
 * Blank names get a default grey.
 */
export const getColorForName = (name: string): string => {
	if (!name) {
		return '#808080'
	}

	if (!nameColorMap[name]) {
		nameColorMap[name] = generateColor(nextColorIndex++)
	}

	return nameColorMap[name]
}

/**
 * Generates an array of unique colors corresponding to an array of names.
 */
export const getColorsForNames = (names: string[]): string[] => {
	return names.map(name => getColorForName(name))
}

/**
 * Generates a mapping of unique names to their assigned colors.
 */
export const getColorMapForNames = (names: string[]): Record<string, string> => {
	const colorMap: Record<string, string> = {}
	names.forEach(name => {
		colorMap[name] = getColorForName(name)
	})

	return colorMap
}