'use client'

import React, { type ReactElement } from 'react'
import { useRouter } from 'next/navigation'

export default function Page (): ReactElement {
	const router = useRouter()

	return (
		<main className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
			<h1 className="mb-4 text-2xl font-bold text-gray-800">Vælg Opgave</h1>
			<div className="flex space-x-4">
				<button
					type="button"
					className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
					onClick={() => {
						router.push('/orderstation')
					}}>
					Bestillings Station
				</button>
				<button
					type="button"
					className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
					onClick={() => {
						router.push('/admin')
					}}>
					Personale
				</button>
			</div>
		</main>
	)
}
