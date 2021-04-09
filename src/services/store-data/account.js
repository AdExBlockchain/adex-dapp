import Loop from './loop'
import { getState } from 'store'
import { selectAuth } from 'selectors'
import { execute, updateAccountStatsPlatform } from 'actions'

const LOOP_TIMEOUT = 60 * 1000

const accountStatsLoop = new Loop({
	timeout: LOOP_TIMEOUT,
	syncAction: async () =>
		selectAuth(getState()) && (await execute(updateAccountStatsPlatform())),
	loopName: '_ACCOUNTS_STATS_PLATFORM',
	stopOn: () => !selectAuth(getState()),
})

export default accountStatsLoop
