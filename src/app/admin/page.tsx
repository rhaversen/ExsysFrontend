'use client'

import React, { type ReactElement, useState } from 'react'
import ViewSelectionBar from '@/components/admin/ViewSelectionBar'
import OverviewView from '@/components/admin/overview/OverviewView'
import ModifyView from '@/components/admin/modify/ModifyView'

export default function Page (): ReactElement {
	const views = ['Ordre Oversigt', 'Rediger Katalog']
	const [selectedView, setSelectedView] = useState('Ordre Oversigt')

	return (
		<main>
			<ViewSelectionBar
				subBar={false}
				views={views}
				selectedView={selectedView}
				setSelectedView={setSelectedView}
			/>
			{selectedView === 'Ordre Oversigt' && <OverviewView/>}
			{selectedView === 'Rediger Katalog' && <ModifyView/>}
		</main>
	)
}
