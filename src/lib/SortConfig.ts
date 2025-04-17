const sortConfig = {
	Produkter: [{
		prop: 'isActive',
		label: 'Aktiv'
	}, {
		prop: 'name',
		label: 'Navn'
	}, {
		prop: 'price',
		label: 'Pris'
	}, {
		prop: 'options.length',
		label: 'Antal Tilvalg'
	}, {
		prop: 'orderWindow.from.hour',
		label: 'Bestilling Fra'
	}, {
		prop: 'orderWindow.to.hour',
		label: 'Bestilling Til'
	}, {
		prop: 'createdAt',
		label: 'Oprettet'
	}, {
		prop: 'updatedAt',
		label: 'Opdateret'
	}],
	Tilvalg: [{
		prop: 'name',
		label: 'Navn'
	}, {
		prop: 'price',
		label: 'Pris'
	}, {
		prop: 'createdAt',
		label: 'Oprettet'
	}, {
		prop: 'updatedAt',
		label: 'Opdateret'
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
		label: 'Kiosk Navn'
	}, {
		prop: 'kioskTag',
		label: 'Kiosk #'
	}, {
		prop: 'readerId.readerTag',
		label: 'Kortlæser #'
	}, {
		prop: 'activities.length',
		label: 'Antal Aktiviteter'
	}, {
		prop: 'createdAt',
		label: 'Oprettet'
	}, {
		prop: 'updatedAt',
		label: 'Opdateret'
	}],
	Kortlæsere: [{
		prop: 'readerTag',
		label: 'Kortlæser #'
	}, {
		prop: 'createdAt',
		label: 'Oprettet'
	}, {
		prop: 'updatedAt',
		label: 'Opdateret'
	}],
	Admins: [{
		prop: 'name',
		label: 'Brugernavn'
	}, {
		prop: 'createdAt',
		label: 'Oprettet'
	}, {
		prop: 'updatedAt',
		label: 'Opdateret'
	}]
}

export default sortConfig
