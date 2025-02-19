export const ProductImages = [
	'/images/productImages/cake.webp',
	'/images/productImages/cheese.webp',
	'/images/productImages/coffee.webp',
	'/images/productImages/spansk_rundstykke.webp',
	'/images/productImages/strawberry_jam.webp',
	'/images/productImages/tea.webp'
] as string[]

export const KioskImages = {
	awaitingPayment: {
		src: '/images/arrow.svg',
		alt: 'Afventer Betaling'
	},
	orderConfirmed: {
		src: '/images/checkmark_blue.svg',
		alt: 'Ordre Bekræftet'
	},
	payLater: {
		src: '/images/coins.svg',
		alt: 'Betal Senere'
	},
	creditCard: {
		src: '/images/credit-card.svg',
		alt: 'Betal Med Kort'
	},
	paymentFailed: {
		src: '/images/cross.svg',
		alt: 'Betaling Fejlede'
	},
	mobilePay: {
		src: '/images/mobile-pay.svg',
		alt: 'Betal Med MobilePay'
	},
	error: {
		src: '/images/question-mark.svg',
		alt: 'Fejl'
	},
	scrollIndicator: {
		src: '/images/arrow.svg',
		alt: 'Scroll Ned'
	},
	noUrl: {
		src: '/images/none.svg',
		alt: 'Produktbillede'
	},
	resetCart: {
		src: '/images/trashcan.svg',
		alt: 'Nulstil Kurv'
	},
	back: {
		src: '/images/arrow.svg',
		alt: 'Tilbage'
	}
}

export const AdminImages = {
	confirmModification: {
		src: '/images/checkmark_green.svg',
		alt: 'Berkræft'
	},
	edit: {
		src: '/images/pen_blue.svg',
		alt: 'Rediger'
	},
	add: {
		src: '/images/plus.svg',
		alt: 'Tilføj'
	},
	delete: {
		src: '/images/trashcan.svg',
		alt: 'Slet'
	},
	undo: {
		src: '/images/undo.svg',
		alt: 'Fortryd'
	},
	confirmModificationBlocked: {
		src: '/images/none.svg',
		alt: 'Kan ikke bekræfte'
	},
	created: {
		src: '/images/star.svg',
		alt: 'Oprettet'
	},
	updated: {
		src: '/images/pen_gray.svg',
		alt: 'Opdateret'
	},
	noUrl: {
		src: '/images/none.svg',
		alt: 'Produktbillede'
	},
	noImage: {
		src: '/images/none.svg',
		alt: 'Intet billede'
	}
}

export const LoadingImage = {
	src: '/images/loading.svg',
	alt: 'Henter'
}
