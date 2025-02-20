import { type OptionType, type OrderType, type ProductType } from './backendDataTypes'

export interface CartItemType {
	id: ProductType['_id'] | OptionType['_id']
	name: ProductType['name'] | OptionType['name']
	price: ProductType['price'] | OptionType['price']
	type: 'products' | 'options'
	quantity: number
	imageURL: string | undefined
}

export interface CartType {
	products: Record<ProductType['_id'], number>
	options: Record<OptionType['_id'], number>
}

export interface Validation {
	validate: (value: string) => boolean
	message: string
}

export interface InlineValidation {
	validate: () => boolean
	message: string
}

export interface UpdatedOrderType {
	_id: OrderType['_id']
	status: 'pending' | 'confirmed' | 'delivered'
}

// Order Station
export type OrderStatus = 'success' | 'error' | 'loading' | 'awaitingPayment' | 'paymentFailed'
export type CheckoutMethod = 'sumUp' | 'later' | 'mobilePay'

export type ViewState = 'welcome' | 'activity' | 'room' | 'order'
