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
import ItemList from '@/components/admin/modify/ui/ItemList'
import SortingControl from '@/components/admin/modify/ui/SortingControl'
import ViewSelectionBar from '@/components/admin/ui/ViewSelectionBar'
import useSorting from '@/hooks/useSorting'
import type sortConfig from '@/lib/SortConfig'
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
			{isEnabled && selectedView !== 'Konfiguration' && (
				<SortingControl
					options={sortingOptions}
					currentField={sortField}
					currentDirection={sortDirection}
					onSortFieldChange={setSortField}
					onSortDirectionChange={setSortDirection}
				/>
			)}
			{selectedView === null &&
				<p className="flex justify-center p-10 font-bold text-gray-800 text-2xl">{'Vælg en kategori'}</p>
			}
			{selectedView === 'Spisesteder' &&
				<ItemList
					headerText="Spisesteder er lokationer en bestilling kan leveres til. Et spisested der er knyttet til en eller flere aktiviteter, vil blive vist som foreslåede spisesteder for den valgte aktivitet. En bruger kan altid vælge mellem alle spisesteder der er oprettet."
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
								activities={activities}
							/>
						</div>
					))}
				</ItemList>
			}
			{selectedView === 'Aktiviteter' &&
				<ItemList
					headerText="Aktiviteter er grupper der spiser i et eller flere spisesteder, og tillader at grupper har seperate bestillinger selv i det samme lokale. Aktiviteter er tilknyttet en eller flere kiosker, hvor aktiviteten vil blive vist som foreslået. Hvis aktiviteten ikke har nogle spisesteder, vil ingen blive vist som et forslået valg. En bruger kan altid vælge mellem alle aktiviteter der er oprettet."
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
								kiosks={kiosks}
								rooms={rooms}
								activities={activities}
							/>
						</div>
					))}
				</ItemList>
			}
			{selectedView === 'Kiosker' &&
				<ItemList
					headerText="Kiosker er systemets repræsentation af de fysiske enheder, som brugerne bestiller fra. De fungerer som login til en fysisk enhed. En kiosk kan have en eller flere aktiviteter tilknyttet, hvilket vil vise dem som foreslåede valg for denne kiosk. SumUp-læsere og aktiviteter kan knyttes til en kiosk. Kioskens tag er printet på vægbeslaget."
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
					headerText="Admins er brugere med adgang til at ændre systemets konfigurationer. De kan oprette og redigere alle indstillinger, inklusive andre admins brugernavn og kodeord. Dit kodeord kan ikke gendannes og holdes derfor også skjult for andre admins."
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
					headerText="Kortlæsere er systemets repræsentation af de fysiske SumUp-kortlæsere. De kan knyttes til en kiosk, hvilket muliggør kortbetaling på denne kiosk. Kortlæserens tag er printet på den fysiske enhed. Ved opsætning vælges API på SumUp-enheden, og den parringskode, der vises på SumUp skærmen, indtastes som en ny kortlæser her på siden. Ved fjernelse af en kortlæser skal den fjernes både på SumUp-enheden og i systemet."
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
			{selectedView === 'Konfiguration' &&
				<ConfigsView />
			}
			{showAddRoom &&
				<AddRoom
					rooms={rooms}
					activities={activities}
					onClose={() => {
						setShowAddRoom(false)
					}}
				/>
			}
			{showAddActivity &&
				<AddActivity
					rooms={rooms}
					kiosks={kiosks}
					activities={activities}
					onClose={() => {
						setShowAddActivity(false)
					} }
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
