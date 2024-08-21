export interface Time {
	hour: number
	minute: number
}

export interface OrderWindow {
	from: Time
	to: Time
}

export interface ProductType {
	_id: string
	name: string
	price: number
	orderWindow: OrderWindow
	options: OptionType[]
	imageURL?: string
}

export interface OptionType {
	_id: string
	name: string
	price: number
	imageURL?: string
}

export interface ActivityType {
	_id: string
	roomId: RoomType
	name: string
}

export interface RoomType {
	_id: string
	name: string
	description: string
}

export interface OrderType {
	_id: string
	products: Array<{ id: ProductType['_id'], quantity: number }>
	options: Array<{ id: OptionType['_id'], quantity: number }>
	activityId: ActivityType['_id']
	status: 'pending' | 'confirmed' | 'delivered'
	createdAt: string
}

export interface AdminType {
	_id: string
	name: string
	email: string
	password?: string
}

export interface KioskType {
	_id: string
	name: string
	kioskTag: string
	password?: string
	activities: ActivityType[]
}
