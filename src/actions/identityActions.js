import * as types from 'constants/actionTypes'
import { getQuickWallet } from 'services/adex-relayer/actions'
import { updateSpinner, addToast } from './uiActions'
import {
	getOwnerIdentities,
	regAccount,
	getIdentityData,
} from 'services/adex-relayer/actions'
import { translate } from 'services/translations/translations'
import { createSession } from './accountActions'

import {
	getIdentityDeployData,
	withdrawFromIdentity,
	setIdentityPrivilege,
} from 'services/smart-contracts/actions/identity'
import {
	addDataToWallet,
	getWalletHash,
	getLocalWallet,
	migrateLegacyWallet,
	walletInfo,
	createLocalWallet,
	generateSalt,
} from 'services/wallet/wallet'
import { saveToLocalStorage } from 'helpers/localStorageHelpers'
import { selectAccount, selectIdentity } from 'selectors'
import { AUTH_TYPES } from 'constants/misc'
import {
	validate,
	validateEmail,
	validateEmailCheck,
	validatePassword,
	validatePasswordCheck,
	validateTOS,
	validateWallet,
	validateIdentityContractOwner,
} from './validationActions'
import { getErrorMsg } from 'helpers/errors'
import {
	GETTING_OWNER_IDENTITIES,
	UPLOADING_ACCOUNT_DATA,
} from 'constants/spinners'

// MEMORY STORAGE
export function updateIdentity(prop, value) {
	return function(dispatch) {
		return dispatch({
			type: types.UPDATE_IDENTITY,
			prop: prop,
			value: value,
		})
	}
}

export function resetIdentity() {
	return function(dispatch) {
		return dispatch({
			type: types.RESET_IDENTITY,
		})
	}
}

export function initIdentity({ email, authType }) {
	return function(dispatch) {
		dispatch({
			type: types.RESET_IDENTITY,
		})

		dispatch({
			type: types.UPDATE_IDENTITY,
			prop: 'email',
			value: email,
		})

		return dispatch({
			type: types.UPDATE_IDENTITY,
			prop: 'authType',
			value: authType,
		})
	}
}

// MEMORY STORAGE
export function updateWallet(prop, value) {
	return function(dispatch) {
		return dispatch({
			type: types.UPDATE_WALLET,
			prop: prop,
			value: value,
		})
	}
}

export function resetWallet() {
	return function(dispatch) {
		return dispatch({
			type: types.RESET_WALLET,
		})
	}
}

export function onUploadLocalWallet(event) {
	return async function(dispatch) {
		updateSpinner(UPLOADING_ACCOUNT_DATA, true)(dispatch)
		const file = event.target.files[0]
		const reader = new FileReader()

		reader.onload = ev => {
			try {
				const obj = JSON.parse(ev.target.result)
				if (
					!obj ||
					!obj.key ||
					!obj.wallet ||
					!obj.wallet.data ||
					!obj.wallet.identity ||
					!obj.wallet.privileges
				) {
					throw new Error(translate('INVALID_JSON_DATA'))
				} else {
					saveToLocalStorage(obj.wallet, obj.key)
					updateIdentity('uploadedLocalWallet', obj.key)(dispatch)
					addToast({
						type: 'accept',
						label: translate('SUCCESS_UPLOADING_ACCOUNT_DATA'),
						timeout: 5000,
					})(dispatch)
				}
			} catch (err) {
				console.error('Error uploading account json data: ', err)
				addToast({
					type: 'cancel',
					label: translate('ERR_UPLOADING_ACCOUNT_DATA', {
						args: [err.message],
					}),
					timeout: 5000,
				})(dispatch)
			}
			updateSpinner(UPLOADING_ACCOUNT_DATA, true)(dispatch)
		}

		const onError = err => {
			console.error('Error uploading account data.', err)
			addToast({
				type: 'cancel',
				label: translate('ERR_UPLOADING_ACCOUNT_DATA', {
					args: [getErrorMsg(err)],
				}),
				timeout: 5000,
			})(dispatch)
			updateSpinner(UPLOADING_ACCOUNT_DATA, false)(dispatch)
		}

		reader.onerror = ev => {
			reader.abort()
			onError(translate())
		}

		reader.onabort = ev => {
			onError(translate('ABORTING_DATA_UPLOAD'))
		}

		reader.readAsText(file)
	}
}

export function identityWithdraw({
	amountToWithdraw,
	withdrawTo,
	tokenAddress,
}) {
	return async function(dispatch, getState) {
		try {
			const account = selectAccount(getState())
			const result = await withdrawFromIdentity({
				account,
				amountToWithdraw,
				withdrawTo,
				tokenAddress,
			})

			addToast({
				type: 'accept',
				label: translate('IDENTITY_WITHDRAW_NOTIFICATION', { args: [result] }),
				timeout: 20000,
			})(dispatch)
		} catch (err) {
			console.error('ERR_IDENTITY_WITHDRAW_NOTIFICATION', err)
			addToast({
				type: 'cancel',
				label: translate('ERR_IDENTITY_WITHDRAW_NOTIFICATION', {
					args: [getErrorMsg(err)],
				}),
				timeout: 20000,
			})(dispatch)
		}
	}
}

export function ownerIdentities({ owner }) {
	return async function(dispatch, getState) {
		updateSpinner(GETTING_OWNER_IDENTITIES, true)(dispatch)
		try {
			const identityData = await getOwnerIdentities({ owner })
			const data = Object.entries(identityData).map(
				async ([identityAddr, privLevel]) => {
					try {
						const data = await getIdentityData({ identityAddr })
						return {
							identity: identityAddr,
							privLevel,
							data,
						}
					} catch {
						return null
					}
				}
			)

			const ownerIdentities = (await Promise.all(data)).filter(x => !!x)

			updateIdentity('ownerIdentities', ownerIdentities)(dispatch)
		} catch (err) {
			console.error('ERR_GETTING_OWNER_IDENTITIES', err)
			addToast({
				type: 'cancel',
				label: translate('ERR_GETTING_OWNER_IDENTITIES', {
					args: [getErrorMsg(err)],
				}),
				timeout: 20000,
			})(dispatch)
		}
		updateSpinner(GETTING_OWNER_IDENTITIES, false)(dispatch)
	}
}

export function addrIdentityPrivilege({ setAddr, privLevel }) {
	return async function(dispatch, getState) {
		try {
			const account = selectAccount(getState())
			const result = await setIdentityPrivilege({
				account,
				setAddr,
				privLevel,
			})
			addToast({
				type: 'accept',
				label: translate('IDENTITY_SET_ADDR_PRIV_NOTIFICATION', {
					args: [result],
				}),
				timeout: 20000,
			})(dispatch)
		} catch (err) {
			console.error('ERR_IDENTITY_SET_ADDR_PRIV_NOTIFICATION', err)
			addToast({
				type: 'cancel',
				label: translate('ERR_IDENTITY_SET_ADDR_PRIV_NOTIFICATION', {
					args: [getErrorMsg(err)],
				}),
				timeout: 20000,
			})(dispatch)
		}
	}
}

export function login() {
	return async function(dispatch, getState) {
		try {
			const {
				wallet,
				email,
				identityData,
				identityTxData,
				deleteLegacyKey,
				registerAccount,
			} = selectIdentity(getState())

			if (registerAccount) {
				await regAccount({
					owner: wallet.address,
					email: email.toLowerCase(),
					...identityTxData,
				})
			}

			const relayerData = await getIdentityData({
				identityAddr: identityData.address,
			})

			const identity = {
				...identityData,
				address: relayerData.deployData._id,
				currentPrivileges: relayerData.currentPrivileges,
				isLimitedVolume: relayerData.isLimitedVolume,
				relayerData,
			}

			await createSession({
				identity,
				wallet,
				email,
				deleteLegacyKey,
			})(dispatch)
		} catch (err) {
			console.error('ERR_LOGIN', err)
			addToast({
				type: 'cancel',
				label: translate('ERR_LOGIN', { args: [getErrorMsg(err)] }),
				timeout: 20000,
			})(dispatch)
		}
	}
}

export function validateQuickLogin({ validateId, dirty }) {
	return async function(dispatch, getState) {
		updateSpinner(validateId, true)(dispatch)
		const identity = selectIdentity(getState())
		const { password, email, authType } = identity

		let wallet = {}
		let error = 'INVALID_EMAIL_OR_PASSWORD'
		let actualAuthType = authType

		try {
			if (email && password) {
				let walletData = await getLocalWallet({
					email,
					password,
					authType: actualAuthType,
				})

				if (!walletData) {
					const salt = generateSalt(email)
					const hash = await getWalletHash({ salt, password })
					const { encryptedWallet } =
						(await getQuickWallet({
							hash,
						})) || {}

					const backupWallet = encryptedWallet || {}

					if (
						backupWallet.wallet &&
						backupWallet.key &&
						backupWallet.wallet.data &&
						backupWallet.wallet.identity &&
						backupWallet.wallet.privileges
					) {
						const info = walletInfo(backupWallet.key, 'backup', null)
						actualAuthType = info.authType
						saveToLocalStorage(backupWallet.wallet, backupWallet.key)

						walletData = await getLocalWallet({
							email,
							password,
							authType: actualAuthType,
						})
					}
				}

				if (!!walletData && walletData.data && walletData.data.address) {
					wallet = { ...walletData.data }
					wallet.email = email
					wallet.password = password
					wallet.authType = actualAuthType || AUTH_TYPES.GRANT.name
					wallet.identity = {
						address: walletData.identity,
						privileges: walletData.privileges || walletData.identityPrivileges,
					}

					if (!authType) {
						await migrateLegacyWallet({ email, password })
						updateIdentity('deleteLegacyKey', true)(dispatch)
					}
				}

				updateIdentity('identityAddr', walletData ? walletData.identity : null)(
					dispatch
				)
				updateIdentity('wallet', wallet)(dispatch)
				updateIdentity('walletAddr', wallet.address)(dispatch)
				updateIdentity('identityData', wallet.identity)(dispatch)
			}
		} catch (err) {
			console.error('ERR_QUICK_WALLET_LOGIN', err)
			error = err
		}

		const isValid = !!wallet.address

		validate(validateId, 'wallet', {
			isValid,
			err: { msg: 'ERR_QUICK_WALLET_LOGIN', args: [getErrorMsg(error)] },
			dirty: dirty,
		})(dispatch)

		if (isValid) {
			await login()(dispatch, getState)
		}
		updateSpinner(validateId, false)(dispatch)
	}
}

const handleAfterValidation = async ({ isValid, onValid, onInvalid }) => {
	if (isValid && typeof onValid === 'function') {
		await onValid()
	}
	if (!isValid && typeof onInvalid === 'function') {
		await onInvalid()
	}
}

export function validateStandardLogin({ validateId, dirty }) {
	return async function(dispatch, getState) {
		updateSpinner(validateId, true)(dispatch)
		try {
			const identity = selectIdentity(getState())
			const { wallet, identityContractAddress } = identity
			const { address } = wallet

			const identityDataSplit = (identityContractAddress || '').split('-')
			const identityData = {
				address: identityDataSplit[0],
				privileges: parseInt(identityDataSplit[1] || 0),
			}

			updateIdentity('wallet', wallet)(dispatch)
			updateIdentity('walletAddr', address)(dispatch)
			updateIdentity('identityData', identityData)(dispatch)

			const isValid = !!identityData.address

			validate(validateId, 'identityContractAddress', {
				isValid: isValid,
				err: { msg: 'ERR_EXTERNAL_WALLET_LOGIN' },
				dirty: dirty,
			})(dispatch)

			if (isValid) {
				await login()(dispatch, getState)
			}
		} catch (err) {
			console.error('ERR_VALIDATING_STANDARD_LOGIN', err)
			addToast({
				type: 'cancel',
				label: translate('ERR_VALIDATING_STANDARD_LOGIN', {
					args: [getErrorMsg(err)],
				}),
				timeout: 20000,
			})(dispatch)
		}

		updateSpinner(validateId, false)(dispatch)
	}
}

export function validateFullDeploy({ validateId, dirty, skipSpinnerUpdate }) {
	return async function(dispatch, getState) {
		!skipSpinnerUpdate && updateSpinner(validateId, true)(dispatch)
		const identity = selectIdentity(getState())
		const { identityAddr, email, wallet } = identity
		try {
			let isValid = !!identityAddr && !!wallet && !!email
			if (!identityAddr && wallet && !!email) {
				const walletAddr = wallet.address

				const txData = await getIdentityDeployData({ owner: walletAddr })
				const identityData = {
					address: txData.identityAddr,
					privileges: txData.privileges,
				}

				updateIdentity('identityAddr', txData.identityAddr)(dispatch)
				updateIdentity('identityTxData', txData)(dispatch)
				updateIdentity('identityData', identityData)(dispatch)

				updateIdentity('wallet', wallet)(dispatch)
				updateIdentity('walletAddr', walletAddr)(dispatch)
				updateIdentity('registerAccount', true)(dispatch)

				isValid = txData.identityAddr && !!wallet && !!email
			}

			await validate(validateId, 'identityAddr', {
				isValid,
				err: { msg: 'ERR_IDENTITY_NOT_GENERATED' },
				dirty,
			})(dispatch)

			if (isValid) {
				await login()(dispatch, getState)
			}
		} catch (err) {
			console.error('ERR_VALIDATING_FULL_DEPLOY', err)
			addToast({
				type: 'cancel',
				label: translate('ERR_VALIDATING_FULL_DEPLOY', {
					args: [getErrorMsg(err)],
				}),
				timeout: 20000,
			})(dispatch)
		}

		!skipSpinnerUpdate && updateSpinner(validateId, false)(dispatch)
	}
}

export function validateQuickDeploy({ validateId, dirty }) {
	return async function(dispatch, getState) {
		updateSpinner(validateId, true)(dispatch)
		const identity = selectIdentity(getState())
		const { identityAddr, email, password } = identity
		try {
			let isValid = !!identityAddr && email && password

			if (!identityAddr && email && password) {
				const authType = AUTH_TYPES.QUICK.name

				const walletData = await createLocalWallet({
					email,
					password,
					authType,
				})

				walletData.email = email
				walletData.password = password

				const walletAddr = walletData.address

				const txData = await getIdentityDeployData({ owner: walletAddr })

				const identityAddr = txData.identityAddr
				const identityData = {
					address: identityAddr,
					privileges: txData.privileges,
				}

				await addDataToWallet({
					email,
					password,
					authType,
					dataKey: 'identity',
					dataValue: identityAddr,
				})
				await addDataToWallet({
					email,
					password,
					authType,
					dataKey: 'privileges',
					dataValue: identityData.privileges,
				})

				updateIdentity('identityAddr', identityAddr)(dispatch)
				updateIdentity('identityTxData', txData)(dispatch)
				updateIdentity('identityData', identityData)(dispatch)

				updateIdentity('wallet', walletData)(dispatch)
				updateIdentity('walletAddr', walletAddr)(dispatch)
				updateIdentity('registerAccount', true)(dispatch)

				isValid = !!identityAddr
			}

			await validate(validateId, 'identityAddr', {
				isValid,
				err: { msg: 'ERR_IDENTITY_NOT_GENERATED' },
				dirty,
			})(dispatch)

			if (isValid) {
				await login()(dispatch, getState)
			}
		} catch (err) {
			console.error('ERR_VALIDATING_QUICK_DEPLOY', err)
			addToast({
				type: 'cancel',
				label: translate('ERR_VALIDATING_QUICK_DEPLOY', {
					args: [getErrorMsg(err)],
				}),
				timeout: 20000,
			})(dispatch)
		}

		updateSpinner(validateId, false)(dispatch)
	}
}

export function validateQuickInfo({ validateId, dirty, onValid, onInvalid }) {
	return async function(dispatch, getState) {
		updateSpinner(validateId, true)(dispatch)

		const identity = selectIdentity(getState())
		const { email, emailCheck, password, passwordCheck, tosCheck } = identity

		const validations = await Promise.all([
			validateEmail(validateId, email, dirty)(dispatch),
			validateEmailCheck(validateId, emailCheck, email, dirty)(dispatch),
			validatePassword(validateId, password, dirty)(dispatch),
			validatePasswordCheck(validateId, passwordCheck, password, dirty)(
				dispatch
			),
			validateTOS(validateId, tosCheck, dirty)(dispatch),
		])

		const isValid = validations.every(v => v === true)

		if (isValid) {
			await validateQuickDeploy({ validateId, dirty, skipSpinnerUpdate: true })(
				dispatch,
				getState
			)
		}

		handleAfterValidation({ isValid, onValid, onInvalid })

		updateSpinner(validateId, false)(dispatch)
	}
}

export function validateFullInfo({ validateId, dirty, onValid, onInvalid }) {
	return async function(dispatch, getState) {
		updateSpinner(validateId, true)(dispatch)

		const identity = selectIdentity(getState())
		const {
			wallet,
			identityContractOwner,
			email,
			emailCheck,
			tosCheck,
		} = identity

		const validations = await Promise.all([
			// validate wallet again in case of step skip
			validateWallet(validateId, wallet, dirty)(dispatch),
			validateIdentityContractOwner(validateId, identityContractOwner, dirty)(
				dispatch
			),

			// validate step fields
			validateEmail(validateId, email, dirty)(dispatch),
			validateEmailCheck(validateId, emailCheck, email, dirty)(dispatch),
			validateTOS(validateId, tosCheck, dirty)(dispatch),
		])

		const isValid = validations.every(v => v === true)

		if (isValid) {
			await validateFullDeploy({
				validateId,
				dirty,
				skipSpinnerUpdate: true,
			})(dispatch, getState)
		}

		// handleAfterValidation({ isValid, onValid, onInvalid })

		updateSpinner(validateId, false)(dispatch)
	}
}

export function validateContractOwner({
	validateId,
	dirty,
	onValid,
	onInvalid,
}) {
	return async function(dispatch, getState) {
		updateSpinner(validateId, true)(dispatch)

		const identity = selectIdentity(getState())
		const { identityContractOwner, wallet } = identity

		const validations = await Promise.all([
			validateWallet(validateId, wallet, dirty)(dispatch),
			validateIdentityContractOwner(validateId, identityContractOwner, dirty)(
				dispatch
			),
		])

		const isValid = validations.every(v => v === true)

		await handleAfterValidation({ isValid, onValid, onInvalid })

		updateSpinner(validateId, false)(dispatch)
	}
}

export function updateIdentityWallet({
	address,
	authType,
	hdWalletAddrPath,
	hdWalletAddrIdx,
	path,
	chainId,
	signType,
}) {
	return async function(dispatch, getState) {
		const wallet = {
			address,
			authType,
			hdWalletAddrPath,
			hdWalletAddrIdx,
			path,
			chainId,
			signType,
		}

		updateIdentity('identityContractOwner', wallet.address)(dispatch)
		updateIdentity('wallet', wallet)(dispatch)
	}
}
