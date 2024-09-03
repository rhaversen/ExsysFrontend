const sortConfig = {
	Produkter: [{
		prop: 'name',
		name: 'Navn'
	}, {
		prop: 'createdAt',
		name: 'Oprettet'
	}, {
		prop: 'updatedAt',
		name: 'Opdateret'
	}, {
		prop: 'price',
		name: 'Pris'
	}],
	Tilvalg: [{
		prop: 'name',
		name: 'Navn'
	}, {
		prop: 'createdAt',
		name: 'Oprettet'
	}, {
		prop: 'updatedAt',
		name: 'Opdateret'
	}, {
		prop: 'price',
		name: 'Pris'
	}],
	Aktiviteter: [{
		prop: 'name',
		name: 'Navn'
	}, {
		prop: 'createdAt',
		name: 'Oprettet'
	}, {
		prop: 'updatedAt',
		name: 'Opdateret'
	}, {
		prop: 'roomId.name',
		name: 'Spisested'
	}],
	Rum: [{
		prop: 'name',
		name: 'Navn'
	}, {
		prop: 'createdAt',
		name: 'Oprettet'
	}, {
		prop: 'updatedAt',
		name: 'Opdateret'
	}, {
		prop: 'description',
		name: 'Beskrivelse'
	}],
	Kiosker: [{
		prop: 'name',
		name: 'Navn'
	}, {
		prop: 'createdAt',
		name: 'Oprettet'
	}, {
		prop: 'updatedAt',
		name: 'Opdateret'
	}, {
		prop: 'kioskTag',
		name: 'Kiosk Tag'
	}, {
		prop: 'readerId.readerTag',
		name: 'Reader Tag'
	}, {
		prop: 'activities.length',
		name: 'Antal Aktiviteter'
	}],
	Kortlæsere: [{
		prop: 'readerTag',
		name: 'Reader Tag'
	}, {
		prop: 'createdAt',
		name: 'Oprettet'
	}, {
		prop: 'updatedAt',
		name: 'Opdateret'
	}],
	Admins: [{
		prop: 'name',
		name: 'Navn'
	}, {
		prop: 'createdAt',
		name: 'Oprettet'
	}, {
		prop: 'updatedAt',
		name: 'Opdateret'
	}]
}

export default sortConfig
