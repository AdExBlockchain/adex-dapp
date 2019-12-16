import React from 'react'
import { useSelector } from 'react-redux'
import Grid from '@material-ui/core/Grid'
import TextField from '@material-ui/core/TextField'
import Checkbox from '@material-ui/core/Checkbox'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import FormHelperText from '@material-ui/core/FormHelperText'
import FormControl from '@material-ui/core/FormControl'
import Collapse from '@material-ui/core/Collapse'
import Switch from '@material-ui/core/Switch'
import { t, selectIdentity, selectValidationsById } from 'selectors'
import {
	execute,
	validateEmail,
	validateEmailCheck,
	validatePassword,
	validatePasswordCheck,
	validateTOS,
	validateGrantCode,
	updateIdentity,
} from 'actions'

const QuickInfo = props => {
	const checkTos = checked => {
		execute(updateIdentity('tosCheck', checked))
		execute(validateTOS(validateId, checked, true))
	}

	const { validateId } = props
	const identity = useSelector(selectIdentity)
	const validations = useSelector(
		state => selectValidationsById(state, validateId) || {}
	)

	// Errors
	const {
		email,
		emailCheck,
		password,
		passwordCheck,
		tosCheck,
		grantCode,
	} = validations
	return (
		<div>
			<Grid container spacing={2}>
				<Grid item xs={12}>
					<TextField
						fullWidth
						type='text'
						required
						label={t('email', { isProp: true })}
						name='email'
						value={identity.email || ''}
						onChange={ev => execute(updateIdentity('email', ev.target.value))}
						onBlur={() =>
							execute(validateEmail(validateId, identity.email, true))
						}
						onFocus={() =>
							execute(validateEmail(validateId, identity.email, false))
						}
						error={email && !!email.dirty}
						maxLength={128}
						helperText={
							email && !!email.dirty ? email.errMsg : t('ENTER_VALID_EMAIL')
						}
					/>
				</Grid>
				<Grid item xs={12}>
					<TextField
						fullWidth
						type='text'
						required
						label={t('emailCheck', { isProp: true })}
						name='emailCheck'
						value={identity.emailCheck || ''}
						onChange={ev =>
							execute(updateIdentity('emailCheck', ev.target.value))
						}
						onBlur={() =>
							execute(
								validateEmailCheck(
									validateId,
									identity.emailCheck,
									identity.email,
									true
								)
							)
						}
						onFocus={() =>
							execute(
								validateEmailCheck(
									validateId,
									identity.emailCheck,
									identity.email,
									false
								)
							)
						}
						error={emailCheck && !!emailCheck.dirty}
						maxLength={128}
						helperText={
							emailCheck && !!emailCheck.dirty
								? emailCheck.errMsg
								: t('ENTER_SAME_EMAIL')
						}
					/>
				</Grid>
				<Grid item xs={12}>
					<TextField
						fullWidth
						type='password'
						required
						label={t('password', { isProp: true })}
						name='password'
						value={identity.password || ''}
						onChange={ev =>
							execute(updateIdentity('password', ev.target.value))
						}
						onBlur={() =>
							execute(validatePassword(validateId, identity.password, true))
						}
						onFocus={() =>
							execute(validatePassword(validateId, identity.password, false))
						}
						error={password && !!password.dirty}
						maxLength={128}
						helperText={
							password && !!password.dirty
								? password.errMsg
								: t('PASSWORD_RULES')
						}
					/>
				</Grid>
				<Grid item xs={12}>
					<TextField
						fullWidth
						type='password'
						required
						label={t('passwordCheck', { isProp: true })}
						name='passwordCheck'
						value={identity.passwordCheck || ''}
						onChange={ev =>
							execute(updateIdentity('passwordCheck', ev.target.value))
						}
						onBlur={() =>
							execute(
								validatePasswordCheck(
									validateId,
									identity.passwordCheck,
									identity.password,
									true
								)
							)
						}
						onFocus={() =>
							execute(
								validatePasswordCheck(
									validateId,
									identity.passwordCheck,
									identity.password,
									false
								)
							)
						}
						error={passwordCheck && !!passwordCheck.dirty}
						maxLength={128}
						helperText={
							passwordCheck && !!passwordCheck.dirty
								? passwordCheck.errMsg
								: t('PASSWORD_CHECK_RULES')
						}
					/>
				</Grid>
				<Grid item xs={12}>
					<FormControlLabel
						control={
							<Switch
								color='primary'
								checked={!!identity.hasGrantCode}
								onChange={() =>
									execute(
										updateIdentity('hasGrantCode', !identity.hasGrantCode)
									)
								}
							/>
						}
						label={t('HAVE_GRANT_CODE')}
					/>
					<Collapse in={identity.hasGrantCode}>
						<TextField
							fullWidth
							type='text'
							required
							label={t('grantCode', { isProp: true })}
							name='grantCode'
							value={identity.grantCode || ''}
							onChange={ev =>
								execute(updateIdentity('grantCode', ev.target.value))
							}
							onBlur={() =>
								validateGrantCode(
									validateId,
									identity.hasGrantCode,
									identity.grantCode,
									true
								)
							}
							onFocus={() =>
								validateGrantCode(
									validateId,
									identity.hasGrantCode,
									identity.grantCode,
									false
								)
							}
							error={grantCode && !!grantCode.dirty}
							maxLength={128}
							helperText={
								grantCode && !!grantCode.dirty
									? grantCode.errMsg
									: t('ENTER_VALID_COUPON')
							}
						/>
					</Collapse>
				</Grid>
				<Grid item xs={12}>
					<FormControl
						required
						error={tosCheck && tosCheck.dirty}
						component='fieldset'
					>
						<FormControlLabel
							control={
								<Checkbox
									checked={!!identity.tosCheck}
									onChange={ev => checkTos(ev.target.checked)}
									value='tosCheck'
									color='primary'
								/>
							}
							label={t('TOS_CHECK')}
						/>
						{tosCheck && !!tosCheck.dirty && (
							<FormHelperText>{tosCheck.errMsg}</FormHelperText>
						)}
					</FormControl>
				</Grid>
			</Grid>
		</div>
	)
}

export default QuickInfo
