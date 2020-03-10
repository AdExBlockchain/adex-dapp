import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import actions from 'actions'
import {
	Grid,
	IconButton,
	Input,
	InputLabel,
	InputAdornment,
	FormControl,
	Chip,
} from '@material-ui/core'
import EditIcon from '@material-ui/icons/Edit'
import { schemas, Joi } from 'adex-models'
import { Prompt } from 'react-router'
import Translate from 'components/translate/Translate'
import SaveBtn from 'components/dashboard/containers/SaveBtn'
import { withStyles } from '@material-ui/core/styles'
import InfoOutlineIcon from '@material-ui/icons/Info'
import FormHelperText from '@material-ui/core/FormHelperText'
import { styles } from './styles'
import { validName } from 'helpers/validators'
import ValidItemHoc from 'components/dashboard/forms/ValidItemHoc'
import PageNotFound from 'components/page_not_found/PageNotFound'
import { selectSide } from 'selectors'

const { adSlotPut, adUnitPut, campaignPut } = schemas

export default function ItemHoc(Decorated) {
	class Item extends Component {
		constructor(props) {
			super(props)
			this.save = this.save.bind(this)
			this.state = {
				activeFields: {},
				item: null,
				initialItemState: {},
				dirtyProps: [],
				editImg: false,
				_activeInput: null,
			}
		}

		componentWillMount() {
			const { item, objModel } = this.props

			const initialItemState = new objModel(item)

			this.setState({ item: { ...item }, initialItemState: initialItemState })
		}

		// shouldComponentUpdate(nextProps, nextState) {
		//     let diffProps = JSON.stringify(this.props) !== JSON.stringify(nextProps)
		//     let diffState = JSON.stringify(this.state) !== JSON.stringify(nextState)
		//     return diffProps || diffState
		// }

		componentWillReceiveProps(nextProps, nextState) {
			const { objModel } = this.props
			const { item } = this.state
			let currentItemInst = new objModel(item || {})
			// Assume that the this.props.match.params.itemId can not be changed without remount of the component
			// TODO: check the above
			let nextItem = nextProps.item
			let nexItemInst = new objModel(nextItem || {})

			if (currentItemInst.modifiedOn !== nexItemInst.modifiedOn) {
				// if (
				// 	JSON.stringify(currentItemInst.plainObj()) !==
				// 	JSON.stringify(nexItemInst.plainObj())
				// ) {
				this.setState({
					item: nexItemInst.plainObj(),
					initialItemState: nexItemInst,
					activeFields: {},
					dirtyProps: [],
				})
			}

			this.updateNav(nexItemInst)
		}

		componentWillUnmount() {
			if (this.state.item) {
				this.props.actions.updateSpinner('update' + this.state.item.id, false)
			}
		}

		handleChange = (name, value) => {
			const { objModel } = this.props
			const { item, dirtyProps } = this.state

			const newItem = new objModel(item)
			newItem[name] = value

			const dp = dirtyProps.slice(0)

			if (dp.indexOf(name) < 0) {
				dp.push(name)
			}

			this.setState({ item: newItem.plainObj(), dirtyProps: dp })
		}

		returnPropToInitialState = propName => {
			const { objModel, actions } = this.props
			const { dirtyProps, initialItemState, item } = this.state
			const initialItemStateValue = initialItemState[propName]
			const newItem = new objModel(item)
			newItem[propName] = initialItemStateValue

			const dp = dirtyProps.filter(dp => {
				return dp !== propName
			})

			this.setState({ item: newItem.plainObj(), dirtyProps: dp })
			// TEMP fix, we assume that the initial values are validated
			actions.resetValidationErrors(item.id, propName)
		}

		setActiveFields = (field, value) => {
			let newActiveFields = { ...this.state.activeFields }
			newActiveFields[field] = value
			this.setState({ activeFields: newActiveFields })
		}

		//TODO: Do not save if not dirty!
		save = () => {
			const { itemType, spinner, actions } = this.props
			const { item, dirtyProps } = this.state

			if (dirtyProps.length && !spinner) {
				actions.updateItem({
					itemType,
					item,
				})
				this.setState({ dirtyProps: [] })
			}
		}

		isDirtyProp(prop) {
			return this.state.item.dirtyProps.indexOf(prop) > -1
		}

		handleToggle = () => {
			const isDemo = this.props.account._authType === 'demo'

			if (isDemo) return

			let active = this.state.editImg
			this.setState({ editImg: !active })
		}

		isNameValid(name) {
			const { msg } = validName(name)
			return !msg
		}

		validateTitle(name, dirty, errMsg) {
			const { itemType, validate } = this.props
			let schema = null

			switch (itemType) {
				case 'AdSlot':
					schema = adSlotPut.title
					break
				case 'AdUnit':
					schema = adUnitPut.title
					break
				case 'Campaign':
					schema = campaignPut.title
					break
				default:
					break
			}

			const result = Joi.validate(name, schema)
			validate('title', {
				isValid: !result.error,
				err: { msg: result.error ? result.error.message : '' },
				dirty: dirty,
			})
		}

		validateDescription(name, dirty, errMsg) {
			const { itemType, validate } = this.props
			let schema = null

			switch (itemType) {
				case 'AdSlot':
					schema = adSlotPut.description
					break
				case 'AdUnit':
					schema = adUnitPut.description
					break
				default:
					break
			}
			const result = Joi.validate(name, schema)
			validate('description', {
				isValid: !result.error,
				err: { msg: result.error ? result.error.message : '' },
				dirty: dirty,
			})
		}

		render() {
			const {
				validations,
				classes,
				t,
				account,
				itemType,
				objModel,
				matchId,
				side,
				invalidFields,
				validateId,
				...rest
			} = this.props
			const propsItem = this.props.item

			if (!propsItem) {
				return (
					<PageNotFound
						title={t('ITEM_NOT_FOUND_TITLE')}
						subtitle={t('ITEM_NOT_FOUND_SUBTITLE', {
							args: [itemType.toUpperCase(), matchId],
						})}
						goToPath={`/dashboard/${side}`}
						goToTxt='GO_TO_DASHBOARD'
					/>
				)
			}
			/*
			 * NOTE: using instance of the item, the instance is passes to the Unit, Slot, Channel and Campaign components,
			 * in this case there is no need to make instance inside them
			 */

			const isDemo = account._authType === 'demo'
			const item = new objModel(this.state.item || {})
			let canEdit = itemType === 'AdSlot'

			const titleErr = invalidFields['title']
			const descriptionErr = invalidFields['description']
			return (
				<div>
					<Prompt
						when={!!this.state.dirtyProps.length}
						message={t('UNSAVED_CHANGES_ALERT')}
					/>
					<div>
						<FormControl
							fullWidth
							className={classes.textField}
							margin='dense'
							error={!!titleErr && !!titleErr.errMsg}
						>
							<InputLabel>{t('title', { isProp: true })}</InputLabel>
							<Input
								fullWidth
								autoFocus
								type='text'
								name={t('title', { isProp: true })}
								value={item.title}
								onChange={ev => {
									this.validateTitle(ev.target.value, true)
									this.handleChange('title', ev.target.value)
								}}
								maxLength={1024}
								onBlur={ev => {
									this.setActiveFields('title', false)
								}}
								onFocus={() => this.validateTitle(item.title, false)}
								disabled={!this.state.activeFields.title}
								endAdornment={
									<InputAdornment position='end'>
										<IconButton
											// disabled
											// size='small'
											disabled={isDemo}
											color='secondary'
											className={classes.buttonRight}
											onClick={ev => this.setActiveFields('title', true)}
										>
											<EditIcon />
										</IconButton>
									</InputAdornment>
								}
							/>
							{titleErr && titleErr.errMsg && titleErr.dirty && (
								<FormHelperText>
									{t(titleErr.errMsg, { args: titleErr.errMsgArgs })}
								</FormHelperText>
							)}
						</FormControl>
					</div>

					{itemType !== 'Campaign' && (
						<div>
							<div>
								<Grid container spacing={2}>
									<Grid item xs={12} sm={12} md={12} lg={7}>
										<div>
											<FormControl
												margin='dense'
												fullWidth
												className={classes.textField}
												error={!!descriptionErr && !!descriptionErr.errMsg}
											>
												<InputLabel htmlFor='description'>
													{t('description', { isProp: true })}
												</InputLabel>
												<Input
													fullWidth
													autoFocus
													multiline
													rows={3}
													type='text'
													name='description'
													value={item.description || ''}
													onChange={ev => {
														this.validateDescription(ev.target.value, true)
														this.handleChange('description', ev.target.value)
													}}
													maxLength={1024}
													onBlur={ev => {
														this.setActiveFields('description', false)
													}}
													onFocus={() =>
														this.validateDescription(item.description, false)
													}
													disabled={!this.state.activeFields.description}
													endAdornment={
														<InputAdornment position='end'>
															<IconButton
																// size='small'
																color='secondary'
																className={classes.buttonRight}
																disabled={isDemo}
																onClick={ev =>
																	this.setActiveFields('description', true)
																}
															>
																<EditIcon />
															</IconButton>
														</InputAdornment>
													}
												/>
												{descriptionErr && !!descriptionErr.errMsg ? (
													<FormHelperText>
														{t(descriptionErr.errMsg, {
															args: descriptionErr.errMsgArgs,
														})}
													</FormHelperText>
												) : (
													!item.description && (
														<FormHelperText>
															{t('NO_DESCRIPTION_YET')}
														</FormHelperText>
													)
												)}
											</FormControl>
										</div>
									</Grid>
								</Grid>
							</div>
						</div>
					)}
					<div>
						{!!this.state.dirtyProps.length && (
							<div className={classes.changesLine}>
								<InfoOutlineIcon className={classes.buttonLeft} />
								<span className={classes.buttonLeft}>
									{t('UNSAVED_CHANGES')}:
								</span>
								{this.state.dirtyProps.map(p => {
									return (
										<Chip
											className={classes.changeChip}
											key={p}
											label={t(p, { isProp: true })}
											onDelete={() => this.returnPropToInitialState(p)}
										/>
									)
								})}
							</div>
						)}
					</div>
					<div>
						<SaveBtn
							spinnerId={'update' + item.id}
							validationId={'update-' + validateId}
							dirtyProps={this.state.dirtyProps}
							save={this.save}
							disabled={
								!this.state.dirtyProps.length ||
								!!Object.keys(invalidFields).length
							}
						/>
					</div>
					<div>
						<Decorated
							{...rest}
							account={account}
							t={t}
							inEdit={!!this.state.dirtyProps.length}
							item={item}
							save={this.save}
							handleChange={this.handleChange}
							toggleImgEdit={this.handleToggle.bind(this)}
							activeFields={this.state.activeFields}
							setActiveFields={this.setActiveFields.bind(this)}
							canEdit={canEdit}
							itemType={itemType}
							isDemo={isDemo}
							validateId={validateId}
						/>
					</div>
				</div>
			)
		}
	}

	Item.propTypes = {
		actions: PropTypes.object.isRequired,
		account: PropTypes.object.isRequired,
		item: PropTypes.object.isRequired,
		spinner: PropTypes.bool,
		itemType: PropTypes.string.isRequired,
		objModel: PropTypes.func.isRequired,
	}

	const tryGetItemByIpfs = ({ items, ipfs }) => {
		let keys = Object.keys(items)

		for (let index = 0; index < keys.length; index++) {
			const key = keys[index]
			const item = items[key]

			if (!!item && item._ipfs && !!ipfs && item._ipfs === ipfs) {
				return item
			}
		}

		return null
	}

	function mapStateToProps(state, props) {
		const { persist } = state
		// const memory = state.memory
		const items = persist.items[props.itemType]
		const id = props.match.params.itemId
		let item = items[id]

		if (!item && props.itemType !== undefined) {
			item = tryGetItemByIpfs({ items: items, ipfs: id })
		}

		return {
			account: persist.account,
			item: item,
			validateId: 'update-' + (item ? item.id || item.ipfs : 'notfound'),
			matchId: id,
			side: selectSide(state),
		}
	}

	function mapDispatchToProps(dispatch) {
		return {
			actions: bindActionCreators(actions, dispatch),
		}
	}

	return connect(
		mapStateToProps,
		mapDispatchToProps
	)(withStyles(styles)(ValidItemHoc(Translate(Item))))
}
