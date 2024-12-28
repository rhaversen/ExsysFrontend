'use client'

import Activity from '@/components/admin/modify/setup/activity/Activity'
import AddActivity from '@/components/admin/modify/setup/activity/AddActivity'
import AddAdmin from '@/components/admin/modify/setup/admin/AddAdmin'
import Admin from '@/components/admin/modify/setup/admin/Admin'
import ItemList from '@/components/admin/modify/ui/ItemList'
import AddKiosk from '@/components/admin/modify/setup/kiosk/AddKiosk'
import Kiosk from '@/components/admin/modify/setup/kiosk/Kiosk'
import AddReader from '@/components/admin/modify/setup/reader/AddReader'
import Reader from '@/components/admin/modify/setup/reader/Reader'
import AddRoom from '@/components/admin/modify/setup/room/AddRoom'
import Room from '@/components/admin/modify/setup/room/Room'
import ViewSelectionBar from '@/components/admin/ui/ViewSelectionBar'
import type sortConfig from '@/lib/SortConfig'
import {
	type ActivityType,
	type AdminType,
	type KioskType,
	type ReaderType,
	type RoomType
} from '@/types/backendDataTypes'
import React, { type ReactElement, useState } from 'react'
import SortingControl from '@/components/admin/modify/ui/SortingControl'

const SetupView = ({
	activities,
	rooms,
	kiosks,
	readers,
	admins
}: {
	activities: ActivityType[]
	rooms: RoomType[]
	kiosks: KioskType[]
	readers: ReaderType[]
	admins: AdminType[]
}): ReactElement => {
	const views = ['Aktiviteter', 'Spisesteder', 'Kiosker', 'Kortlæsere', 'Admins']
	const [selectedView, setSelectedView] = useState<string | null>(null)

	const [showAddRoom, setShowAddRoom] = useState(false)
	const [showAddActivity, setShowAddActivity] = useState(false)
	const [showAddKiosk, setShowAddKiosk] = useState(false)
	const [showAddAdmin, setShowAddAdmin] = useState(false)
	const [showAddReader, setShowAddReader] = useState(false)

	const [sortField, setSortField] = useState('name')
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

	const resolveProperty = (obj: any, path: string): any => {
		return path.split('.').reduce((acc, part) => acc != null ? acc[part] : undefined, obj)
	}

	const compareStrings = (strA: string, strB: string): number => {
		const lowerStrA = strA.toLowerCase()
		const lowerStrB = strB.toLowerCase()
		if (lowerStrA < lowerStrB) return sortDirection === 'asc' ? -1 : 1
		if (lowerStrA > lowerStrB) return sortDirection === 'asc' ? 1 : -1
		return 0
	}

	const compareValues = (valA: any, valB: any): number => {
		if (typeof valA === 'string' && typeof valB === 'string') {
			return compareStrings(valA, valB)
		}

		let result
		if (sortDirection === 'asc') {
			result = valA > valB ? 1 : -1
		} else {
			result = valA < valB ? 1 : -1
		}
		return result
	}

	const sortByField = (items: any[]): any[] => {
		return items.slice().sort((a: any, b: any) => {
			const valA = resolveProperty(a, sortField)
			const valB = resolveProperty(b, sortField)
			return compareValues(valA, valB)
		})
	}

	return (
		<div>
			<ViewSelectionBar
				subLevel={1}
				views={views}
				selectedView={selectedView}
				setSelectedView={setSelectedView}
			/>
			{selectedView !== null &&
				<SortingControl
					onSortFieldChange={setSortField}
					onSortDirectionChange={setSortDirection}
					type={selectedView as keyof typeof sortConfig}
				/>
			}
			{selectedView === null &&
				<p className="flex justify-center p-10 font-bold text-gray-800 text-2xl">{'Vælg en kategori'}</p>
			}
			{selectedView === 'Spisesteder' &&
				<ItemList
					buttonText="Nyt Spisested"
					onAdd={() => {
						setShowAddRoom(true)
					}}
				>
					{sortByField(rooms).map((room) => (
						<div
							className="min-w-64"
							key={room._id}
						>
							<Room
								rooms={rooms}
								room={room}
							/>
						</div>
					))}
				</ItemList>
			}
			{selectedView === 'Aktiviteter' &&
				<ItemList
					buttonText="Ny Aktivitet"
					onAdd={() => {
						setShowAddActivity(true)
					}}
				>
					{sortByField(activities).map((activity) => (
						<div
							className="min-w-64"
							key={activity._id}
						>
							<Activity
								activity={activity}
								rooms={rooms}
							/>
						</div>
					))}
				</ItemList>
			}
			{selectedView === 'Kiosker' &&
				<ItemList
					buttonText="Ny Kiosk"
					onAdd={() => {
						setShowAddKiosk(true)
					}}
				>
					{sortByField(kiosks).map((kiosk) => (
						<div
							className="min-w-64"
							key={kiosk._id}
						>
							<Kiosk
								kiosks={kiosks}
								kiosk={kiosk}
								activities={activities}
								readers={readers}
							/>
						</div>
					))}
				</ItemList>
			}
			{selectedView === 'Admins' &&
				<ItemList
					buttonText="Ny Admin"
					onAdd={() => {
						setShowAddAdmin(true)
					}}
				>
					{sortByField(admins).map((admin) => (
						<div
							className="min-w-64"
							key={admin._id}
						>
							<Admin
								admins={admins}
								admin={admin}
							/>
						</div>
					))}
				</ItemList>
			}
			{selectedView === 'Kortlæsere' &&
				<ItemList
					buttonText="Ny Kortlæser"
					onAdd={() => {
						setShowAddReader(true)
					}}
				>
					{sortByField(readers).map((reader) => (
						<div
							className="min-w-64"
							key={reader._id}
						>
							<Reader
								readers={readers}
								reader={reader}
							/>
						</div>
					))}
				</ItemList>
			}
			{showAddRoom &&
				<AddRoom
					rooms={rooms}
					onClose={() => {
						setShowAddRoom(false)
					}}
				/>
			}
			{showAddActivity &&
				<AddActivity
					rooms={rooms}
					onClose={() => {
						setShowAddActivity(false)
					}}
				/>
			}
			{showAddKiosk &&
				<AddKiosk
					kiosks={kiosks}
					activities={activities}
					readers={readers}
					onClose={() => {
						setShowAddKiosk(false)
					}}
				/>
			}
			{showAddAdmin &&
				<AddAdmin
					admins={admins}
					onClose={() => {
						setShowAddAdmin(false)
					}}
				/>
			}
			{showAddReader &&
				<AddReader
					readers={readers}
					onClose={() => {
						setShowAddReader(false)
					}}
				/>
			}
		</div>
	)
}

export default SetupView
