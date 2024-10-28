'use client'

import Block from '@/components/admin/ui/Block'
import React, { type ReactElement } from 'react'

export default function Page (): ReactElement {
	return (
		<main className="flex flex-col items-center justify-center h-screen">
			<div className="grid grid-cols-1 gap-4">
				<Block text="Modificer" link="/admin/modify" />
				<Block text="Statistik" link="/admin/statistics" />
				<Block text="Køkken" link="/admin/kitchen" />
			</div>
		</main>
	)
}
