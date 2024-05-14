'use client'

import React, { useState, type ReactElement } from 'react'
import ViewSelectionBar from '@/components/admin/ViewSelectionBar'
import OverviewView from '@/components/admin/overview/OverviewView'
import ModifyView from '@/components/admin/modify/ModifyView'

export default function Page (): ReactElement {
	const views = ['Ordre Oversigt', 'Rediger Produkter']
	const [selectedView, setSelectedView] = useState('Ordre Oversigt')

	return (
		<main>
			<ViewSelectionBar
				views={views}
				selectedView={selectedView}
				setSelectedView={setSelectedView}
			/>
			{selectedView === 'Ordre Oversigt' && <OverviewView />}
			{selectedView === 'Rediger Produkter' && <ModifyView />}
		</main>
	)
}
