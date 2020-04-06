import React, { Fragment } from 'react'
import { Paper, Grid, Box, InputAdornment } from '@material-ui/core'
import {
	DirtyProps,
	ItemTitle,
	MediaCard,
	ItemSpecProp,
} from 'components/dashboard/containers/ItemCommon/'
import { t, selectMainToken } from 'selectors'
import { formatDateTime, formatTokenAmount } from 'helpers/formatters'
import { mapStatusIcons } from 'components/dashboard/containers/Tables/tableHelpers'
import { bigNumberify } from 'ethers/utils'

export const CampaignBasic = ({ item, ...hookProps }) => {
	const { title, mediaUrl, mediaMime } = item

	const { decimals, symbol } = selectMainToken()
	const { title: errTitle } = hookProps.validations

	const status = item.status || {}

	return (
		<Fragment>
			<DirtyProps {...hookProps} />
			<Paper elevation={2}>
				<Box p={2}>
					<Grid container spacing={2}>
						<Grid item xs={12} sm={12} md={6} lg={5}>
							<Box my={1}>
								<MediaCard mediaUrl={mediaUrl} mediaMime={mediaMime} />
							</Box>
						</Grid>

						<Grid item xs={12} sm={12} md={6} lg={7}>
							<Box my={1}>
								<ItemTitle title={title} errTitle={errTitle} {...hookProps} />
							</Box>
							<Box my={1}>
								<ItemSpecProp
									prop={'id'}
									value={item.id}
									label={t('id', { isProp: true })}
								/>
							</Box>

							<Grid container spacing={2}>
								<Grid item xs={12} sm={12} md={6}>
									<Box my={1}>
										<ItemSpecProp
											prop={'created'}
											value={formatDateTime(item.created)}
											label={t('created', { isProp: true })}
										/>
									</Box>
									<Box my={1}>
										<ItemSpecProp
											prop={'activeFrom'}
											value={formatDateTime(item.activeFrom)}
											label={t('activeFrom', { isProp: true })}
										/>
									</Box>
									<Box my={1}>
										<ItemSpecProp
											prop={'withdrawPeriodStart'}
											value={formatDateTime(item.withdrawPeriodStart)}
											label={t('withdrawPeriodStart', { isProp: true })}
										/>
									</Box>
									<Box my={1}>
										<ItemSpecProp
											prop={'CAMPAIGN_MIN_TARGETING'}
											value={item.minTargetingScore > 0 ? t('YES') : t('NO')}
											label={t('CAMPAIGN_MIN_TARGETING')}
										/>
									</Box>
								</Grid>
								<Grid item xs={12} sm={12} md={6}>
									<Box my={1}>
										<ItemSpecProp
											prop={'humanFriendlyName'}
											value={status.humanFriendlyName}
											label={t('status', { isProp: true })}
											InputProps={{
												endAdornment: (
													<InputAdornment position='end'>
														{mapStatusIcons(
															status.humanFriendlyName,
															status.name,
															'md'
														)}
													</InputAdornment>
												),
											}}
										/>
									</Box>
									<Box my={1}>
										<ItemSpecProp
											prop={'fundsDistributedRatio'}
											value={((status.fundsDistributedRatio || 0) / 10).toFixed(
												2
											)}
											label={t('PROP_DISTRIBUTED', { args: ['%'] })}
										/>
									</Box>
									<Box my={1}>
										<ItemSpecProp
											prop={'depositAmount'}
											value={
												formatTokenAmount(item.depositAmount, decimals) +
												' ' +
												symbol
											}
											label={t('depositAmount', { isProp: true })}
										/>
									</Box>
									<Box my={1}>
										<ItemSpecProp
											prop={'CPM'}
											value={
												formatTokenAmount(
													bigNumberify(item.minPerImpression || 0).mul(1000),
													decimals,
													true
												) +
												' ' +
												symbol
											}
											label={t('CPM', { isProp: true })}
										/>
									</Box>
								</Grid>
							</Grid>
						</Grid>
						<Grid item xs={12} sm={12} md={12} lg={6}></Grid>
					</Grid>
				</Box>
			</Paper>
		</Fragment>
	)
}