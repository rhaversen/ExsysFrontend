// Helper types
export interface Time {
	hour: number
	minute: number
}

export interface OrderWindow {
	from: Time
	to: Time
}

export type PaymentStatus = 'pending' | 'successful' | 'failed'

// Product types
export interface ProductType {
	_id: string
	name: string
	price: number
	orderWindow: OrderWindow
	options: OptionType[]
	isActive: boolean
	imageURL?: string
	createdAt: string
	updatedAt: string
}

export interface PostProductType {
	name: string
	price: number
	orderWindow: OrderWindow
	options: Array<OptionType['_id']>
	imageURL?: string
	isActive: boolean
}

export interface PatchProductType {
	name?: string
	price?: number
	orderWindow?: OrderWindow
	options?: Array<OptionType['_id']>
	imageURL?: string
	isActive?: boolean
}

// Option types
export interface OptionType {
	_id: string
	name: string
	price: number
	imageURL?: string
	createdAt: string
	updatedAt: string
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

// Activity types
export interface ActivityType {
	_id: string
	rooms: RoomType[]
	disabledProducts: Array<ProductType['_id']>
	disabledRooms: Array<RoomType['_id']>
	name: string
	createdAt: string
	updatedAt: string
}

export interface PostActivityType {
	rooms?: Array<RoomType['_id']>
	disabledProducts?: Array<ProductType['_id']>
	disabledRooms?: Array<RoomType['_id']>
	name: string
}

export interface PatchActivityType {
	rooms?: Array<RoomType['_id']>
	disabledProducts?: Array<ProductType['_id']>
	disabledRooms?: Array<RoomType['_id']>
	name?: string
}

// Room types
export interface RoomType {
	_id: string
	name: string
	description: string
	createdAt: string
	updatedAt: string
}

export interface PostRoomType {
	name: string
	description: string
}

export interface PatchRoomType {
	name?: string
	description?: string
}

// Order types
export interface OrderType {
	_id: string
	products: Array<{ _id: ProductType['_id'], name: string, quantity: number }>
	options: Array<{ _id: OptionType['_id'], name: string, quantity: number }>
	activityId: ActivityType['_id']
	roomId: RoomType['_id']
	kioskId: KioskType['_id']
	status: 'pending' | 'confirmed' | 'delivered'
	paymentId: string
	paymentStatus: PaymentStatus
	checkoutMethod: 'sumUp' | 'later'
	createdAt: string
	updatedAt: string
}

export interface PostOrderType {
	products: Array<{ id: ProductType['_id'], quantity: number }>
	options?: Array<{ id: OptionType['_id'], quantity: number }>
	activityId: ActivityType['_id']
	roomId: RoomType['_id']
	kioskId: KioskType['_id']
	checkoutMethod: 'sumUp' | 'later' | 'mobilePay'
}

export interface PatchOrderType {
	orderIds: Array<OrderType['_id']>
	status: 'pending' | 'confirmed' | 'delivered'
}

// Reader types
export interface ReaderType {
	_id: string
	readerTag: string
	createdAt: string
	updatedAt: string
}

export interface PostReaderType {
	readerTag?: string
	pairingCode: string
}

export interface PatchReaderType {
	readerTag?: string | null
	pairingCode?: string
}

// Admin types
export interface AdminType {
	_id: string
	name: string
	createdAt: string
	updatedAt: string
}

export interface PostAdminType {
	name: string
	password: string
}

export interface PatchAdminType {
	name?: string
	password?: string
}

// Kiosk types
export interface KioskType {
	_id: string
	name: string
	kioskTag: string
	readerId: ReaderType | null
	activities: ActivityType[]
	disabledActivities: Array<ActivityType['_id']>
	deactivatedUntil: string | null
	deactivated: boolean
	createdAt: string
	updatedAt: string
}

export interface PostKioskType {
	name: string
	kioskTag?: string
	readerId?: ReaderType['_id']
	activities: Array<ActivityType['_id']>
	disabledActivities: Array<ActivityType['_id']>
	deactivatedUntil?: string | null
	deactivated?: boolean
}

export interface PatchKioskType {
	name?: string
	kioskTag?: string | null
	readerId?: ReaderType['_id'] | null
	activities?: Array<ActivityType['_id']>
	disabledActivities?: Array<ActivityType['_id']>
	deactivatedUntil?: string | null
	deactivated?: boolean
}

// Session types
export interface SessionType {
	_id: string // Used for deletion, determining current session and key in list
	sessionExpires: string | null // Used to determine if session is expired if stayLoggedIn is true (Uses rolling expiration) (ISO string)
	stayLoggedIn: boolean // Used to determine if session is persistent
	type: 'admin' | 'kiosk' | 'unknown' // Used to infer user information
	userId: AdminType['_id'] | KioskType['_id'] | null // Used to infer user information
	ipAddress: string // Ip address of the user
	loginTime: string // Time of login (ISO string)
	lastActivity: string // Time of last activity (ISO string)
	userAgent: string // Agent information
}

// Config types
export interface ConfigsType {
	_id: string
	configs: {
		kioskInactivityTimeoutMs: number
		kioskInactivityTimeoutWarningMs: number
		kioskOrderConfirmationTimeoutMs: number
		disabledWeekdays: number[]
		kioskPassword: string
	}
	createdAt: Date
	updatedAt: Date
}
