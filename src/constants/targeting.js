import { constants } from 'adex-models'
import { translate } from 'services/translations/translations'

const autocompleteLocationsSingleSelect = () => {
	return constants.AllCountries.map(country => {
		return {
			label: country.name,
			value: country.value,
		}
	})
}

const autocompleteGendersSingleSelect = () => {
	return constants.Genders.map(gender => {
		return {
			label: translate(gender.split('_')[1]),
			value: gender,
		}
	})
}

const autocompleteTagsSingleSelect = () => {
	return constants.PredefinedTags.map(tag => {
		return {
			label: tag._id,
			value: tag._id,
		}
	})
}

export const AcLocations = autocompleteLocationsSingleSelect()
export const AcGenders = autocompleteGendersSingleSelect()
export const AcTags = autocompleteTagsSingleSelect()

export const SOURCES = {
	locations: { src: AcLocations, collection: 'targeting' },
	genders: { src: AcGenders, collection: 'targeting' },
	tags: { src: AcTags, collection: 'targeting' },
	custom: { src: [], collection: 'targeting' },
}

export const HOUR = 60 * 60 * 1000
export const DAY = 24 * HOUR
export const MAX_CAMPAIGN_WITHDRAW_START_DAYS = 90
export const MAX_CAMPAIGN_WITHDRAW_START =
	DAY * MAX_CAMPAIGN_WITHDRAW_START_DAYS
