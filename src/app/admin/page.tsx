'use client'

import LogoutButton from '@/components/admin/LogoutButton'
import ModifyView from '@/components/admin/modify/ModifyView'
import OverviewView from '@/components/admin/overview/OverviewView'
import ViewSelectionBar from '@/components/admin/ViewSelectionBar'
import React, { type ReactElement, useState } from 'react'

export default function Page (): ReactElement {
	const views = ['Ordre Oversigt', 'Rediger Katalog']

	const [selectedView, setSelectedView] = useState('Ordre Oversigt')

	return (
		<main>
			<LogoutButton
				className="absolute top-0 right-0 m-3"
			/>
			<ViewSelectionBar
				subLevel={0}
				views={views}
				selectedView={selectedView}
				setSelectedView={setSelectedView}
			/>
			{selectedView === 'Ordre Oversigt' &&
				<OverviewView />
			}
			{selectedView === 'Rediger Katalog' &&
				<ModifyView />
			}
		</main>
	)
}
