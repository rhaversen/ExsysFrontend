import { type ReactElement } from 'react'

interface ResourceInfoProps {
	viewName: string
}

interface PropDefinition {
	name: string
	message: string
}

const info: Record<string, ReactElement[]> = {
	Aktiviteter: [
		<>{'En aktivitet er en gruppe, der spiser i et eller flere spisesteder. Dette gør det muligt at have separate bestillinger for forskellige grupper (aktiviteter) der spiser i samme lokale.'}</>,
		<>{'Tilknyttet en eller flere kiosker, hvor aktiviteten vises som en valgmulighed.'}</>,
		<>{'Brugere kan kun vælge mellem de tilføjede aktiviteter på den givne kiosk. Hvis ingen er tilføjet, kan brugeren ikke udføre en bestilling.'}</>
	],
	Spisesteder: [
		<>{'Lokationer, hvor aktiviteter spiser, og deres bestillinger kan leveres til.'}</>,
		<>{'Tilknyttet en eller flere aktiviteter, hvor spisestedet vises som en valgmulighed.'}</>,
		<>{'Brugere kan kun vælge mellem de valgte spisesteder på den givne aktivitet. Hvis ingen er tilføjet, kan brugeren ikke udføre en bestilling.'}</>
	],
	Kiosker: [
		<>{'En kiosk her på siden repræsenterer de fysiske touch-enheder, hvor brugere laver bestillinger. De fungerer som login til den fysiske enhed (iPad).'}</>,
		<>{'Kioskernes adgangskode kan ændres under "Konfiguration" øverst på siden her.'}</>,
		<>{'Tilknyttet en eller flere aktiviteter, som vises som en valgmulighed.'}</>,
		<>{'Kan tilknyttes en SumUp kortlæser for at muliggøre kortbetaling. Hvis ingen kortlæser er tilknyttet, vil kiosken kun kunne modtage kontantbetalinger.'}</>,
		<>{'Kioskens navn og nummer (#) vises i bunden af kioskens skærm når den er logget ind.'}</>
	],
	Admins: [
		<>{'Brugere med adgang til at ændre systemets konfigurationer.'}</>,
		<>{'Admins kan oprette og redigere alle indstillinger, samt administrere andre admins brugernavne og adgangskoder.'}</>,
		<>{'Adgangskoder kan ikke gendannes og er skjult for andre admins.'}</>
	],
	Kortlæsere: [
		<>{'Repræsenterer systemets SumUp-kortlæsere, hvortil kortbetalinger tilsendes.'}</>,
		<>{'Kan knyttes til en kiosk for at muliggøre kortbetaling. Kan flyttes mellem kiosker efter behov.'}</>,
		<>
			{'Ved opsætning af en ny enhed vælges API på SumUp-enheden, hvorefter parrekoden fra SumUp-skærmen indtastes her på siden.'}{' '}
			<a
				href="https://developer.sumup.com/terminal-payments/cloud-api#generate-pairing-code"
				target="_blank"
				rel="noopener noreferrer"
				className="text-blue-600 hover:underline"
			>
				{'Se SumUp vejledning her. '}
			</a>
			{'Hvis enheden har et nummer trykt på den, indtastes det også her på siden. Hvis ikke, skal feltet efterlades tomt, og systemet vil generere et nummer (#) til enheden, som derefter printes på den fysiske enhed for nem identifikation.'}
		</>,
		<>
			{'Ved fjernelse af en enhed skal kortlæseren slettes her på siden, og derefter frakobles API\'en på SumUp-enheden.'}{' '}
			<a
				href="https://developer.sumup.com/terminal-payments/cloud-api#disconnect-reader-physically"
				target="_blank"
				rel="noopener noreferrer"
				className="text-blue-600 hover:underline"
			>
				{'Se SumUp vejledning her. '}
			</a>
		</>,
		<>{'Kortlæserens nummer (#) er printet på den fysiske enhed.'}</>
	],
	Produkter: [
		<>{'Primære bestillingsmuligheder, der vises efter valg af aktivitet og spisested.'}</>,
		<>{'Kan have tilvalg knyttet til sig, som vises når produktet vælges.'}</>,
		<>{'Bestillingsvinduet styrer, hvornår produkter er til salg. Kiosken går i dvale, når ingen produkter er tilgængelige.'}</>
	],
	Tilvalg: [
		<>{'Sekundære bestillingsmuligheder, der vises efter produktvalg.'}</>,
		<>{'Knyttes til et eller flere produkter, og vises kun, når mindst ét tilknyttet produkt er valgt.'}</>
	]
}

// Hardcoded prop definitions for each resource type
const propInfo: Record<string, PropDefinition[]> = {
	Produkter: [
		{ name: 'Aktiv', message: 'Bestemmer om produktet vises på kiosken.' },
		{ name: 'Billede', message: 'Visuel repræsentation.' },
		{ name: 'Navn', message: 'Produktets visningsnavn på kiosken. Burde være kort og præcist.' },
		{ name: 'Pris', message: 'Beløbet der opkræves for produktet.' },
		{ name: 'Bestillingsvindue', message: 'Tidsrum hvor produktet vises på kiosken.' },
		{ name: 'Tilvalg', message: 'Tilvalg der vises som foreslået for produktet.' },
		{ name: 'Deaktiverede Aktiviteter', message: 'Aktiviteter hvor produktet ikke vises.' }
	],
	Tilvalg: [
		{ name: 'Billede', message: 'Visuel repræsentation.' },
		{ name: 'Navn', message: 'Tilvalgets visningsnavn på kiosken. Burde være kort og præcist.' },
		{ name: 'Pris', message: 'Beløbet der opkræves for tilvalget.' },
		{ name: 'Produkter', message: 'Produkter hvor tilvalget vises som en tilkøbsmulighed.' }
	],
	Aktiviteter: [
		{ name: 'Navn', message: 'Aktivitetens visningsnavn på kiosken. Burde være kort og præcist, og let genkendeligt af brugeren.' },
		{ name: 'Spisesteder', message: 'Spisesteder som kan vælges for aktiviteten.' },
		{ name: 'Deaktiverede Produkter', message: 'Produkter som ikke kan vælges for aktiviteten.' },
		{ name: 'Kiosker', message: 'Kiosker hvor aktiviteten kan vælges.' }
	],
	Spisesteder: [
		{ name: 'Navn', message: 'Spisestedets visningsnavn på kiosken. Burde være kort og præcist, og let genkendeligt af brugeren.' },
		{ name: 'Beskrivelse', message: 'Beskrivelse af rummet der vises på kiosken. Burde forklare lokationen af spisestedet.' },
		{ name: 'Aktiviteter', message: 'Aktiviteter hvor spisestedet kan vælges.' }
	],
	Kiosker: [
		{ name: 'Navn', message: 'Navn til intern identificering. Kioskens navn bør gøre det nemt at identificere den, f.eks. ved at angive placering eller funktion.' },
		{ name: 'Kiosk #', message: 'Brugernavn til kiosk login.' },
		{ name: 'Tilknyttet Kortlæser', message: 'Kioskens tilknyttede kortlæser.' },
		{ name: 'Aktiviteter', message: 'Aktiviteter som kan vælges på kiosken.' }
	],
	Kortlæsere: [
		{ name: 'Kortlæser #', message: 'Kortlæserens ID for intern identifikation.' },
		{ name: 'Parring Kode', message: 'Indtastet parring kode fra SumUp-enheden.' },
		{ name: 'Tilknyttet Kiosk', message: 'Kortlæserens tilknyttede kiosk.' }
	],
	Admins: [
		{ name: 'Brugernavn', message: 'Brugernavnet til admin login.' },
		{ name: 'Adgangskode', message: 'Adgangskoden til admin login.' }
	]
}

const ResourceInfo = ({ viewName }: ResourceInfoProps): ReactElement | null => {
	const details = info[viewName]
	const propDefs = propInfo[viewName] ?? []

	if ((details?.length ?? 0) === 0 && propDefs.length === 0) { return null }

	return (
		<div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
			<h3 className="mb-2 font-bold text-gray-700">{`Info om ${viewName}`}</h3>

			{/* Bullet points section */}
			{(details?.length ?? 0) > 0 && (
				<div className="flex flex-col justify-evenly gap-2 sm:flex-row sm:gap-0 rounded sm:bg-transparent sm:rounded-none text-gray-700 mb-4">
					{details.map((point, index) => {
						const isFirst = index === 0
						const isLast = index === details.length - 1
						const firstStyle = 'sm:pr-4'
						const middleStyle = 'pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l sm:border-gray-300 sm:px-4'
						const lastStyle = 'pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l sm:border-gray-300 sm:pl-4'

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
			)}

			{/* Props and messages section */}
			<div className="flex flex-col justify-evenly gap-0 sm:flex-row sm:flex-wrap sm:gap-1 text-gray-700">
				{propDefs.map((prop, index) => (
					<div
						key={index}
						className="flex flex-col items-center text-center p-2 flex-1"
					>
						<span className="font-semibold text-gray-800">{prop.name}</span>
						<span className="whitespace-normal">{prop.message}</span>
					</div>
				))}
			</div>
		</div>
	)
}

export default ResourceInfo
