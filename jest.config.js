/** @type {import('jest').Config} */
const config = {
	preset: 'ts-jest',
	testEnvironment: 'jsdom',
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1'
	},
	setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
	testMatch: ['**/*.test.ts', '**/*.test.tsx'],
	transform: {
		'^.+\\.tsx?$': ['ts-jest', {
			tsconfig: 'tsconfig.json'
		}]
	}
}

module.exports = config
