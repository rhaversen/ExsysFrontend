'use client'

import Activity from '@/components/admin/modify/setup/activity/Activity'
import AddActivity from '@/components/admin/modify/setup/activity/AddActivity'
import AddAdmin from '@/components/admin/modify/setup/admin/AddAdmin'
import Admin from '@/components/admin/modify/setup/admin/Admin'
import ConfigsView from '@/components/admin/modify/setup/config/ConfigsView'
import AddKiosk from '@/components/admin/modify/setup/kiosk/AddKiosk'
import Kiosk from '@/components/admin/modify/setup/kiosk/Kiosk'
import AddReader from '@/components/admin/modify/setup/reader/AddReader'
import Reader from '@/components/admin/modify/setup/reader/Reader'
import AddRoom from '@/components/admin/modify/setup/room/AddRoom'
import Room from '@/components/admin/modify/setup/room/Room'
import SortingControl from '@/components/admin/modify/ui/SortingControl'
import ViewSelectionBar from '@/components/admin/ui/ViewSelectionBar'
import ResourceInfo from '@/components/admin/modify/ui/ResourceInfo'
import useSorting from '@/hooks/useSorting'
import type sortConfig from '@/lib/SortConfig'
import { AdminImages } from '@/lib/images'
import Image from 'next/image'
import {
	type ActivityType,
	type AdminType,
	type KioskType,
	type ReaderType,
	type RoomType
} from '@/types/backendDataTypes'
import React, { type ReactElement, useState } from 'react'

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
	const views = ['Aktiviteter', 'Spisesteder', 'Kiosker', 'Kortlæsere', 'Admins', 'Konfiguration']
	const [selectedView, setSelectedView] = useState<string | null>(null)

	const [showAddRoom, setShowAddRoom] = useState(false)
	const [showAddActivity, setShowAddActivity] = useState(false)
	const [showAddKiosk, setShowAddKiosk] = useState(false)
	const [showAddAdmin, setShowAddAdmin] = useState(false)
	const [showAddReader, setShowAddReader] = useState(false)

	const {
		setSortField,
		setSortDirection,
		sortByField,
		sortField,
		sortDirection,
		sortingOptions,
		isEnabled
	} = useSorting(selectedView as keyof typeof sortConfig)

	return (
		<div>
			<ViewSelectionBar
				subLevel={1}
				views={views}
				selectedView={selectedView}
				setSelectedView={setSelectedView}
			/>
			<div className="flex gap-4 p-4">
				{selectedView !== null && selectedView !== 'Konfiguration' && (
					<div className="flex flex-col gap-4">
						<button
							type="button"
							title="Tilføj"
							className="flex w-80 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded items-center justify-center"
							onClick={() => {
								switch (selectedView) {
									case 'Spisesteder':
										setShowAddRoom(true)
										break
									case 'Aktiviteter':
										setShowAddActivity(true)
										break
									case 'Kiosker':
										setShowAddKiosk(true)
										break
									case 'Admins':
										setShowAddAdmin(true)
										break
									case 'Kortlæsere':
										setShowAddReader(true)
										break
								}
							}}
						>
							<Image
								className="h-7 w-7"
								src={AdminImages.add.src}
								alt={AdminImages.add.alt}
								width={10}
								height={10}
							/>
							<span className="p-2 mx-5 font-bold">{`Tilføj ${selectedView}`}</span>
						</button>
						{isEnabled && (
							<SortingControl
								options={sortingOptions}
								currentField={sortField}
								currentDirection={sortDirection}
								onSortFieldChange={setSortField}
								onSortDirectionChange={setSortDirection}
							/>
						)}
						<ResourceInfo viewName={selectedView} />
					</div>
				)}
				<div className="flex-1">
					{selectedView === null && (
						<p className="flex justify-center p-10 font-bold text-gray-800 text-2xl">{'Vælg en kategori'}</p>
					)}
					{selectedView === 'Spisesteder' && (
						<div className="flex flex-wrap justify-evenly gap-4">
							{sortByField(rooms).map((room) => (
								<div className="min-w-64" key={room._id}>
									<Room rooms={rooms} room={room} activities={activities} />
								</div>
							))}
						</div>
					)}
					{selectedView === 'Aktiviteter' && (
						<div className="flex flex-wrap justify-evenly gap-4">
							{sortByField(activities).map((activity) => (
								<div className="min-w-64" key={activity._id}>
									<Activity
										activity={activity}
										kiosks={kiosks}
										rooms={rooms}
										activities={activities}
									/>
								</div>
							))}
						</div>
					)}
					{selectedView === 'Kiosker' && (
						<div className="flex flex-wrap justify-evenly gap-4">
							{sortByField(kiosks).map((kiosk) => (
								<div className="min-w-64" key={kiosk._id}>
									<Kiosk
										kiosks={kiosks}
										kiosk={kiosk}
										activities={activities}
										readers={readers}
									/>
								</div>
							))}
						</div>
					)}
					{selectedView === 'Admins' && (
						<div className="flex flex-wrap justify-evenly gap-4">
							{sortByField(admins).map((admin) => (
								<div className="min-w-64" key={admin._id}>
									<Admin
										admins={admins}
										admin={admin}
									/>
								</div>
							))}
						</div>
					)}
					{selectedView === 'Kortlæsere' && (
						<div className="flex flex-wrap justify-evenly gap-4">
							{sortByField(readers).map((reader) => (
								<div className="min-w-64" key={reader._id}>
									<Reader
										kiosks={kiosks}
										readers={readers}
										reader={reader}
									/>
								</div>
							))}
						</div>
					)}
					{selectedView === 'Konfiguration' && (
						<ConfigsView />
					)}
				</div>
			</div>
			{showAddRoom && (
				<AddRoom
					rooms={rooms}
					activities={activities}
					onClose={() => {
						setShowAddRoom(false)
					}}
				/>
			)}
			{showAddActivity && (
				<AddActivity
					rooms={rooms}
					kiosks={kiosks}
					activities={activities}
					onClose={() => {
						setShowAddActivity(false)
					}}
				/>
			)}
			{showAddKiosk && (
				<AddKiosk
					kiosks={kiosks}
					activities={activities}
					readers={readers}
					onClose={() => {
						setShowAddKiosk(false)
					}}
				/>
			)}
			{showAddAdmin && (
				<AddAdmin
					admins={admins}
					onClose={() => {
						setShowAddAdmin(false)
					}}
				/>
			)}
			{showAddReader && (
				<AddReader
					kiosks={kiosks}
					readers={readers}
					onClose={() => {
						setShowAddReader(false)
					}}
				/>
			)}
		</div>
	)
}

export default SetupView
