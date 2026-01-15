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
	status: OrderType['status']
}

// Order Station
export type OrderStatus = 'success' | 'error' | 'loading' | 'awaitingPayment' | 'paymentFailed'
export type CheckoutMethod = 'sumUp' | 'later' | 'mobilePay'

export type ViewState = 'welcome' | 'activity' | 'room' | 'order' | 'feedback'

export type InteractionType =
	| 'session_start'
	| 'session_timeout'
	| 'activity_select'
	| 'activity_auto_select'
	| 'room_select'
	| 'room_auto_select'
	| 'nav_to_welcome'
	| 'nav_to_activity'
	| 'nav_to_room'
	| 'nav_to_order'
	| 'timeout_continue'
	| 'timeout_restart'
	| 'product_select'
	| 'product_increase'
	| 'product_decrease'
	| 'option_select'
	| 'option_increase'
	| 'option_decrease'
	| 'cart_clear'
	| 'checkout_start'
	| 'payment_select_later'
	| 'payment_select_card'
	| 'payment_select_mobilepay'
	| 'payment_auto_later'
	| 'checkout_cancel'
	| 'payment_cancel'
	| 'checkout_complete'
	| 'checkout_failed'
	| 'confirmation_feedback_positive'
	| 'confirmation_feedback_negative'
	| 'confirmation_close'
	| 'confirmation_timeout'
	| 'feedback_banner_click'
	| 'feedback_positive'
	| 'feedback_negative'
	| 'feedback_back'
	| 'feedback_auto_back'
