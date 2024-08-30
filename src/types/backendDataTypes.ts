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

export interface PostProductType {
	name: string
	price: number
	orderWindow: OrderWindow
	options: Array<OptionType['_id']>
	imageURL?: string
}

export interface PatchProductType {
	name?: string
	price?: number
	orderWindow?: OrderWindow
	options?: Array<OptionType['_id']>
	imageURL?: string
}

export interface OptionType {
	_id: string
	name: string
	price: number
	imageURL?: string
}

export interface PostOptionType {
	name: string
	price: number
	imageURL?: string
}

export interface PatchOptionType {
	name?: string
	price?: number
	imageURL?: string
}

export interface ActivityType {
	_id: string
	roomId: RoomType | null
	name: string
}

export interface PostActivityType {
	roomId?: RoomType['_id'] | null
	name: string
}

export interface PatchActivityType {
	roomId?: RoomType['_id'] | null
	name?: string
}

export interface ActivityTypeNonPopulated {
	_id: string
	roomId: RoomType['_id']
	name: string
}

export interface RoomType {
	_id: string
	name: string
	description: string
}

export interface PostRoomType {
	name: string
	description: string
}

export interface PatchRoomType {
	name?: string
	description?: string
}

export interface OrderType {
	_id: string
	products: Array<{ id: ProductType['_id'], quantity: number }>
	options: Array<{ id: OptionType['_id'], quantity: number }>
	activityId: ActivityType['_id']
	status: 'pending' | 'confirmed' | 'delivered'
	createdAt: string
}

export interface PostOrderType {
	products: Array<{ id: ProductType['_id'], quantity: number }>
	options?: Array<{ id: OptionType['_id'], quantity: number }>
	activityId: ActivityType['_id']
	kioskId: KioskType['_id']
}

export interface PatchOrderType {
	orderIds: Array<OrderType['_id']>
	status: 'pending' | 'confirmed' | 'delivered'
}

export interface ReaderType {
	_id: string
	readerTag: string
}

export interface PostReaderType {
	readerTag?: string
	pairingCode: string
}

export interface PatchReaderType {
	readerTag?: string | null
	pairingCode?: string
}

export interface AdminType {
	_id: string
	name: string
	password?: string
}

export interface PostAdminType {
	name: string
	password: string
}

export interface PatchAdminType {
	name?: string
	password?: string
}

export interface KioskType {
	_id: string
	name: string
	kioskTag: string
	password?: string
	readerId: ReaderType['_id'] | null
	activities: ActivityType[]
}

export interface PostKioskType {
	name: string
	kioskTag?: string
	password: string
	readerId?: ReaderType['_id']
	activities: Array<ActivityType['_id']>
}

export interface PatchKioskType {
	name?: string
	kioskTag?: string | null
	password?: string
	readerId?: ReaderType['_id'] | null
	activities?: Array<ActivityType['_id']>
}

export interface KioskTypeNonPopulated {
	_id: string
	name: string
	kioskTag: string
	readerId: ReaderType['_id']
	activities: ActivityTypeNonPopulated[]
}
