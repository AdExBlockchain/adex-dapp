import React from 'react'
import {
	Box,
	List,
	ListItem,
	ListItemText,
	ListSubheader,
	ExpansionPanel,
	ExpansionPanelSummary,
	Typography,
} from '@material-ui/core'
import { ExpandMoreSharp as ExpandMoreIcon } from '@material-ui/icons'
import { AUTH_TYPES } from 'constants/misc'
import { TopLoading } from 'components/common/dialog/content'
import { t } from 'selectors'

export const WalletAction = ({ t, authType }) => {
	let msg = ''
	let subMsg
	switch (authType) {
		case AUTH_TYPES.METAMASK.name:
			msg = 'METAMASK_WAITING_ACTION'
			subMsg = 'METAMASK_WAITING_ACTION_INFO'
			break
		case AUTH_TYPES.TREZOR.name:
			msg = 'TREZOR_WAITING_ACTION'
			break
		default:
			msg = 'WAITING_FOR_USER_ACTION'
			break
	}

	return <TopLoading msg={t(msg)} subMsg={t(subMsg)} />
}

export const FeesBreakdown = ({ breakdownFormatted = {}, symbol }) => (
	<Box p={1}>
		<ExpansionPanel square={true} variant='outlined'>
			<ExpansionPanelSummary
				expandIcon={<ExpandMoreIcon />}
				aria-controls='fees-breakdown'
				id='fees-breakdown'
			>
				<Typography>{t('FEES_BREAKDOWN_ADVANCED')}</Typography>
			</ExpansionPanelSummary>
			<List
				disablePadding
				dense
				subheader={
					<ListSubheader component='div'>
						{t('BD_TOTAL_FEE', {
							args: [breakdownFormatted.feeAmount, symbol],
						})}
					</ListSubheader>
				}
			>
				{!!breakdownFormatted.deployFee && (
					<ListItem>
						<ListItemText
							primary={t('BD_DEPLOY_FEE', {
								args: [breakdownFormatted.deployFee, symbol],
							})}
						/>
					</ListItem>
				)}
				<ListItem>
					<ListItemText
						primary={t('BD_TXNS_FEE', {
							args: [
								breakdownFormatted.executeAction,
								breakdownFormatted.txnsFee,
								symbol,
							],
						})}
					/>
				</ListItem>
				{!!breakdownFormatted.sweepTxnsCount && (
					<ListItem>
						<ListItemText
							primary={t('BD_SWEEP_FEE', {
								args: [
									breakdownFormatted.sweepTxnsCount,
									breakdownFormatted.sweepTxnsFeeAmount,
									symbol,
								],
							})}
						/>
					</ListItem>
				)}
			</List>
		</ExpansionPanel>
	</Box>
)
