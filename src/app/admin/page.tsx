'use client'

import ModifyView from '@/components/admin/modify/ModifyView'
import OverviewView from '@/components/admin/overview/OverviewView'
import SessionInfoBar from '@/components/admin/SessionInfoBar'
import ViewSelectionBar from '@/components/admin/ViewSelectionBar'
import React, { type ReactElement, useState } from 'react'

export default function Page (): ReactElement {
	const views = ['Ordre Oversigt', 'Rediger Katalog']

	const [selectedView, setSelectedView] = useState('Ordre Oversigt')

	return (
		<main className="flex flex-col min-h-screen">
			<ViewSelectionBar
				subLevel={0}
				views={views}
				selectedView={selectedView}
				setSelectedView={setSelectedView}
			/>
			<div className="flex-grow">
				{selectedView === 'Ordre Oversigt' &&
					<OverviewView />
				}
				{selectedView === 'Rediger Katalog' &&
					<ModifyView />
				}
			</div>
			<SessionInfoBar />
		</main>
	)
}
