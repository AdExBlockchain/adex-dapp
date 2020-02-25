import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Line, Chart } from 'react-chartjs-2'
import { CHARTS_COLORS } from 'components/dashboard/charts/options'
import Helper from 'helpers/miscHelpers'
import { selectStatsChartData, selectMainToken } from 'selectors'

const commonDsProps = {
	fill: false,
	lineTension: 0,
	borderWidth: 0,
	pointRadius: 3,
	pointHitRadius: 10,
}

export const SimpleStatistics = ({
	side,
	timeframe = '',
	eventType,
	payouts,
	impressions,
	clicks,
	options = {},
	t,
	xLabel = 'TIMEFRAME',
	y1Label = 'DATA1',
	y2Label = 'DATA2',
	y3Label = 'DATA3',
	y1Color = CHARTS_COLORS[1],
	y2Color = CHARTS_COLORS[2],
	y3Color = CHARTS_COLORS[3],
}) => {
	const { symbol } = useSelector(selectMainToken)

	// Vertical line / crosshair
	useEffect(() => {
		Chart.pluginService.register({
			afterDraw: function(chart) {
				if (chart.tooltip._active && chart.tooltip._active.length) {
					const activePoint = chart.controller.tooltip._active[0]
					const ctx = chart.ctx
					const x = activePoint.tooltipPosition().x
					const chartScalesy1 = chart.scales['y-axis-1']
					if (chartScalesy1) {
						const topY = chartScalesy1.top
						const bottomY = chartScalesy1.bottom
						ctx.save()
						ctx.beginPath()
						ctx.moveTo(x, topY)
						ctx.lineTo(x, bottomY)
						ctx.lineWidth = 1 // line width
						ctx.setLineDash([1, 5])
						ctx.strokeStyle = '#C0C0C0' // color of the vertical line
						ctx.stroke()
						ctx.restore()
					}
				}
			},
		})
	})

	const chartData = {
		labels: payouts.labels,
		datasets: [
			{
				...commonDsProps,
				backgroundColor: Helper.hexToRgbaColorString(y1Color, 0.5),
				borderColor: Helper.hexToRgbaColorString(y1Color, 1),
				label: y1Label,
				data: payouts.datasets,
				yAxisID: 'y-axis-1',
				pointBackgroundColor: 'transparent',
			},
			{
				...commonDsProps,
				backgroundColor: Helper.hexToRgbaColorString(y2Color, 0.5),
				borderColor: Helper.hexToRgbaColorString(y2Color, 1),
				label: y2Label,
				data: impressions.datasets,
				yAxisID: 'y-axis-2',
			},
			{
				...commonDsProps,
				backgroundColor: Helper.hexToRgbaColorString(y3Color, 0.5),
				borderColor: Helper.hexToRgbaColorString(y3Color, 1),
				label: y3Label,
				data: clicks.datasets,
				yAxisID: 'y-axis-3',
			},
		],
	}

	const linesOptions = {
		animation: false,
		responsive: true,
		// This and fixed height are used for proper mobile display of the chart
		maintainAspectRatio: false,
		title: {
			display: true,
			text: options.title,
		},
		tooltips: {
			backgroundColor: 'black',
			mode: 'index',
			intersect: false,
			callbacks: {
				label: function(t, d) {
					// This adds currency MainToken (DAI) to y1Label in the tooltips
					var xLabel = d.datasets[t.datasetIndex].label
					var yLabel = xLabel === y1Label ? `${t.yLabel} ${symbol}` : t.yLabel
					return `${xLabel}: ${yLabel}`
				},
			},
		},
		hover: {
			mode: 'index',
			intersect: false,
		},
		scales: {
			xAxes: [
				{
					display: true,
					gridLines: {
						display: false,
					},
					scaleLabel: {
						display: true,
						labelString: t(xLabel || 'TIMEFRAME'),
					},
				},
			],
			yAxes: [
				{
					gridLines: {
						display: true,
					},
					ticks: {
						beginAtZero: true,
					},
					scaleLabel: {
						display: true,
						labelString: y1Label,
					},
					id: 'y-axis-1',
				},
				{
					type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
					display: true,
					position: 'right',
					scaleLabel: {
						display: true,
						labelString: y2Label,
					},
					id: 'y-axis-2',
					ticks: {
						beginAtZero: true,
						precision: 0,
					},
					// grid line settings
					gridLines: {
						drawOnChartArea: false, // only want the grid lines for one axis to show up
					},
				},
				{
					type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
					display: true,
					position: 'right',
					scaleLabel: {
						display: true,
						labelString: y3Label,
					},
					id: 'y-axis-3',
					ticks: {
						beginAtZero: true,
						precision: 0,
					},
					// grid line settings
					gridLines: {
						drawOnChartArea: false, // only want the grid lines for one axis to show up
					},
				},
			],
		},
	}

	return <Line height={500} data={chartData} options={linesOptions} />
}
