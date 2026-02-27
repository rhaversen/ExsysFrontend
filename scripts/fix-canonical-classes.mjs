import { readFile, writeFile } from 'fs/promises'
import { join, resolve } from 'path'
import { glob } from 'glob'
import { TailwindUtils } from 'tailwind-api-utils'

const ROOT = resolve(import.meta.dirname, '..')
const CSS_ENTRY = join(ROOT, 'src', 'app', 'globals.css')
const SRC_GLOB = 'src/**/*.{tsx,ts,jsx,js}'

async function loadDesignSystem () {
	const tw = new TailwindUtils()
	await tw.loadConfig(CSS_ENTRY)
	return tw.context
}

function getSpacingPx (ds) {
	const spacing = parseFloat(ds.resolveThemeValue?.('--spacing') ?? '0.25')
	return spacing * 16
}

function tryResolveArbitrary (cls, spacingPx, ds) {
	const match = cls.match(/^(.*)-\[(-?\d+(?:\.\d+)?)(px|rem)\]$/)
	if (match === null) {
		return null
	}

	const [, backbone, rawVal, unit] = match
	let pxVal = parseFloat(rawVal)
	if (unit === 'rem') {
		pxVal *= 16
	}

	const multiplier = pxVal / spacingPx
	if (multiplier < 0 || !Number.isFinite(multiplier)) {
		return null
	}

	const rounded = Math.round(multiplier * 2) / 2
	if (Math.abs(rounded - multiplier) > 0.001) {
		return null
	}

	const suffix = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1)
	const candidate = `${backbone}-${suffix}`

	const css = ds.candidatesToCss([candidate])
	if (css === undefined || css.length === 0 || css[0] == null) {
		return null
	}

	if (!css[0].includes('--spacing')) {
		return null
	}

	return candidate
}

function replaceClasses (content, ds, spacingPx) {
	let changed = false

	const fixTokens = (original) => {
		let anyChange = false
		const newValue = original.replace(/[^\s]+/g, (cls) => {
			const [canonical] = ds.canonicalizeCandidates([cls])
			if (canonical !== undefined && canonical !== cls) {
				anyChange = true
				return canonical
			}

			const namedEquiv = tryResolveArbitrary(cls, spacingPx, ds)
			if (namedEquiv !== null) {
				anyChange = true
				return namedEquiv
			}

			return cls
		})
		return { newValue, anyChange }
	}

	// Match className/class attributes with plain strings or full template literal blocks
	// For template literals, we process all single-quoted strings inside the block too
	const classAttrRegex = /(?:className|class)\s*=\s*(?:"([^"]*?)"|'([^']*?)'|(\{`[\s\S]*?`\}))/gs

	let result = content.replace(classAttrRegex, (fullMatch, dq, sq, block) => {
		if (block !== undefined) {
			// Extract the inner template literal content and fix:
			// 1. Plain token runs (not inside quotes)
			// 2. Single-quoted string literals inside the block
			const inner = block.slice(2, -2)
			let anyChange = false

			const newInner = inner
				.replace(/'([^']+)'/g, (strMatch, classes) => {
					const { newValue, anyChange: ac } = fixTokens(classes)
					if (!ac) {
						return strMatch
					}
					anyChange = true
					return strMatch.replace(classes, newValue)
				})
				.replace(/(?<!['])(\b[^\s`${'":,?:]+\b)(?!['])/g, (token) => {
					const [canonical] = ds.canonicalizeCandidates([token])
					if (canonical !== undefined && canonical !== token) {
						anyChange = true
						return canonical
					}
					return token
				})

			if (!anyChange) {
				return fullMatch
			}
			changed = true
			return fullMatch.replace(inner, newInner)
		}

		const original = dq ?? sq
		if (original === undefined) {
			return fullMatch
		}
		const { newValue, anyChange } = fixTokens(original)
		if (!anyChange) {
			return fullMatch
		}
		changed = true
		return fullMatch.replace(original, newValue)
	})

	return { result, changed }
}

async function main () {
	const ds = await loadDesignSystem()
	const spacingPx = getSpacingPx(ds)

	const files = await glob(SRC_GLOB, { cwd: ROOT, absolute: true })
	let totalFixes = 0
	let fixedFiles = 0

	for (const file of files) {
		const content = await readFile(file, 'utf8')
		const { result, changed } = replaceClasses(content, ds, spacingPx)
		if (changed) {
			await writeFile(file, result, 'utf8')
			const relPath = file.replace(ROOT + '\\', '').replace(ROOT + '/', '')
			const diffs = countDiffs(content, result)
			totalFixes += diffs
			fixedFiles++
			console.log(`  Fixed ${diffs} class(es) in ${relPath}`)
		}
	}

	if (totalFixes === 0) {
		console.log('No canonical class issues found.')
	} else {
		console.log(`\nFixed ${totalFixes} class(es) across ${fixedFiles} file(s).`)
	}
}

function countDiffs (a, b) {
	const aLines = a.split('\n')
	const bLines = b.split('\n')
	let count = 0
	for (let i = 0; i < Math.max(aLines.length, bLines.length); i++) {
		if (aLines[i] !== bLines[i]) {
			count++
		}
	}
	return count
}

main().catch(err => {
	console.error(err)
	process.exit(1)
})
