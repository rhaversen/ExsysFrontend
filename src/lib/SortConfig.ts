const sortConfig = {
	Produkter: [{
		prop: 'name',
		label: 'Navn'
	}, {
		prop: 'createdAt',
		label: 'Oprettet'
	}, {
		prop: 'updatedAt',
		label: 'Opdateret'
	}, {
		prop: 'price',
		label: 'Pris'
	}, {
		prop: 'orderWindow.from.hour',
		label: 'Bestilling Fra'
	}, {
		prop: 'orderWindow.to.hour',
		label: 'Bestilling Til'
	}],
	Tilvalg: [{
		prop: 'name',
		label: 'Navn'
	}, {
		prop: 'createdAt',
		label: 'Oprettet'
	}, {
		prop: 'updatedAt',
		label: 'Opdateret'
	}, {
		prop: 'price',
		label: 'Pris'
	}],
	Aktiviteter: [{
		prop: 'name',
		label: 'Navn'
	}, {
		prop: 'createdAt',
		label: 'Oprettet'
	}, {
		prop: 'updatedAt',
		label: 'Opdateret'
	}, {
		prop: 'roomId.name',
		label: 'Spisested'
	}],
	Spisesteder: [{
		prop: 'name',
		label: 'Navn'
	}, {
		prop: 'createdAt',
		label: 'Oprettet'
	}, {
		prop: 'updatedAt',
		label: 'Opdateret'
	}, {
		prop: 'description',
		label: 'Beskrivelse'
	}],
	Kiosker: [{
		prop: 'name',
		label: 'Navn'
	}, {
		prop: 'createdAt',
		label: 'Oprettet'
	}, {
		prop: 'updatedAt',
		label: 'Opdateret'
	}, {
		prop: 'kioskTag',
		label: 'Kiosk Tag'
	}, {
		prop: 'readerId.readerTag',
		label: 'Reader Tag'
	}, {
		prop: 'activities.length',
		label: 'Antal Aktiviteter'
	}],
	Kortlæsere: [{
		prop: 'readerTag',
		label: 'Reader Tag'
	}, {
		prop: 'createdAt',
		label: 'Oprettet'
	}, {
		prop: 'updatedAt',
		label: 'Opdateret'
	}],
	Admins: [{
		prop: 'name',
		label: 'Navn'
	}, {
		prop: 'createdAt',
		label: 'Oprettet'
	}, {
		prop: 'updatedAt',
		label: 'Opdateret'
	}]
}

export default sortConfig
