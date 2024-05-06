import { type OptionType, type ProductType } from './backendDataTypes'

export interface CartItemType {
	id: ProductType['_id'] | OptionType['_id']
	name: ProductType['name'] | OptionType['name']
	price: ProductType['price'] | OptionType['price']
	type: 'products' | 'options'
	quantity: number
	imageURL: string | undefined
	isNew: boolean
}
