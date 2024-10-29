'use client'

import Block from '@/components/admin/ui/Block'
import React, { type ReactElement } from 'react'

export default function Page (): ReactElement {
	return (
		<main className="p-28 flex flex-col gap-5">
			<Block text="Køkken" link="/admin/kitchen" />
			<Block text="Modificer" link="/admin/modify" />
			<Block text="Statistik" link="/admin/statistics" />
		</main>
	)
}
