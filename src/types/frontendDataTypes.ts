import { type OptionType, type OrderType, type ProductType } from './backendDataTypes'

export interface CartItemType {
	id: ProductType['_id'] | OptionType['_id']
	name: ProductType['name'] | OptionType['name']
	price: ProductType['price'] | OptionType['price']
	type: 'products' | 'options'
	quantity: number
	imageURL: string | undefined
	isNew: boolean
}

export interface CartType {
	products: Record<ProductType['_id'], number>
	options: Record<OptionType['_id'], number>
}

export interface OrderTypeWithNames extends OrderType {
	products: Array<{ id: ProductType['_id'], name: string, quantity: number }>
	options: Array<{ id: OptionType['_id'], name: string, quantity: number }>
}

export interface Validation {
	validate: (value: string) => boolean
	message: string
}

export const sortConfig = {
	Produkter: [{ prop: 'name', name: 'Navn' }, { prop: 'createdAt', name: 'Oprettet' }, { prop: 'updatedAt', name: 'Opdateret' }, { prop: 'price', name: 'Pris' }],
	Tilvalg: [{ prop: 'name', name: 'Navn' }, { prop: 'createdAt', name: 'Oprettet' }, { prop: 'updatedAt', name: 'Opdateret' }, { prop: 'price', name: 'Pris' }],
	Aktiviteter: [{ prop: 'name', name: 'Navn' }, { prop: 'createdAt', name: 'Oprettet' }, { prop: 'updatedAt', name: 'Opdateret' }, { prop: 'roomId.name', name: 'Spisested' }],
	Rum: [{ prop: 'name', name: 'Navn' }, { prop: 'createdAt', name: 'Oprettet' }, { prop: 'updatedAt', name: 'Opdateret' }, { prop: 'description', name: 'Beskrivelse' }],
	Kiosker: [{ prop: 'name', name: 'Navn' }, { prop: 'createdAt', name: 'Oprettet' }, { prop: 'updatedAt', name: 'Opdateret' }, { prop: 'kioskTag', name: 'Kiosk Tag' }, { prop: 'readerId.readerTag', name: 'Reader Tag' }, { prop: 'activities.length', name: 'Antal Aktiviteter' }],
	Kortlæsere: [{ prop: 'readerTag', name: 'Reader Tag' }, { prop: 'createdAt', name: 'Oprettet' }, { prop: 'updatedAt', name: 'Opdateret' }],
	Admins: [{ prop: 'name', name: 'Navn' }, { prop: 'createdAt', name: 'Oprettet' }, { prop: 'updatedAt', name: 'Opdateret' }]
}
