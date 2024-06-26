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
