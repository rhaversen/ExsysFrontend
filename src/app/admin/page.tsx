'use client'

import React, { type ReactElement } from 'react'

export default function Page (): ReactElement {
	return (
		<main className="flex flex-col items-center justify-center h-screen">
			<a href="/admin/modify">{'Modificer'}</a>
			<a href="/admin/statistics">{'Statistik'}</a>
			<a href="/admin/kitchen">{'Køkken'}</a>
		</main>
	)
}
