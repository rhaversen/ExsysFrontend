import React, { type ReactElement } from 'react'

interface ResourceInfoProps {
	viewName: string
}

const info: Record<string, string[]> = {
	Aktiviteter: [
		'Grupper, der spiser i et eller flere spisesteder',
		'Tillader separate bestillinger for grupper i samme lokale',
		'Tilknyttet en eller flere kiosker, hvor aktiviteten vises som foreslået',
		'Hvis ingen spisesteder er tilknyttet, vises ingen forslag',
		'Brugere kan altid vælge mellem alle oprettede aktiviteter'
	],
	Spisesteder: [
		'Lokationer, hvor bestillinger kan leveres',
		'Spisesteder knyttet til aktiviteter vises som foreslåede valg',
		'Brugere kan altid vælge mellem alle oprettede spisesteder'
	],
	Kiosker: [
		'Repræsenterer de fysiske enheder, hvor brugere bestiller',
		'Fungerer som login til en fysisk enhed',
		'Kan have én eller flere aktiviteter tilknyttet som foreslåede valg',
		'Kan være forbundet med SumUp-læsere og aktiviteter',
		'Kioskens nummer er trykt på vægbeslaget'
	],
	Admins: [
		'Brugere med adgang til at ændre systemets konfigurationer',
		'Kan oprette og redigere alle indstillinger',
		'Kan administrere andre admins brugernavne og adgangskoder',
		'Adgangskoder kan ikke gendannes og er skjult for andre admins'
	],
	Kortlæsere: [
		'Repræsenterer systemets SumUp-kortlæsere',
		'Kan knyttes til en kiosk for at muliggøre kortbetaling',
		'Kortlæserens nummer er trykt på den fysiske enhed',
		'Ved opsætning vælges API på SumUp-enheden',
		'Parrekode fra SumUp-skærmen indtastes ved oprettelse',
		'Ved fjernelse skal læseren fjernes både på SumUp-enheden og i systemet'
	],
	Produkter: [
		'Primære bestillingsmuligheder, der vises først på kiosken',
		'Vises efter valg af aktivitet og spisested',
		'Kan have tilvalg knyttet til sig',
		'Bestillingsvinduet styrer, hvornår produkter er til salg',
		'Kiosken går i dvale, når ingen produkter er tilgængelige'
	],
	Tilvalg: [
		'Sekundære bestillingsmuligheder',
		'Knyttes til et eller flere produkter',
		'Vises kun, når mindst ét tilknyttet produkt er valgt'
	]
}

const ResourceInfo = ({ viewName }: ResourceInfoProps): ReactElement | null => {
	const details = info[viewName]
	if ((details?.length) === 0) return null

	return (
		<div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
			<h3 className="mb-2 font-bold text-gray-700">{`Info om ${viewName}`}</h3>
			<div
				className="flex flex-col sm:flex-row sm:gap-0 rounded sm:bg-transparent sm:rounded-none text-gray-700"
			>
				{details.map((point, index) => {
					const isFirst = index === 0
					const isLast = index === details.length - 1
					const firstStyle = 'sm:pr-4'
					const middleStyle = 'sm:border-l sm:border-gray-300 sm:px-4'
					const lastStyle = 'sm:border-l sm:border-gray-300 sm:pl-4'

					const pointStyle = isFirst
						? firstStyle
						: isLast
							? lastStyle
							: middleStyle

					return (
						<div
							key={index}
							className={pointStyle}
						>
							{point}
						</div>
					)
				})}
			</div>
		</div>
	)
}

export default ResourceInfo
