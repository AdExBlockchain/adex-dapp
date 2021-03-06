import React, { useState, useEffect, useCallback, useRef } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import NO_IMAGE from 'resources/no-image-box-eddie.jpg'
import VIDEO_IMAGE from 'resources/video-placeholder.jpg'
import CircularProgress from '@material-ui/core/CircularProgress'
import classnames from 'classnames'
import FullscreenIcon from '@material-ui/icons/Fullscreen'
// import IconButton from '@material-ui/core/IconButton'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import Button from '@material-ui/core/Button'
import Fab from '@material-ui/core/Fab'
import { ipfsSrc } from 'helpers/ipfsHelpers'
import { isVideoMedia } from 'helpers/mediaHelpers'
import { t } from 'selectors'

const MAX_IMG_LOAD_TIME = 7000

const styles = theme => ({
	imgLoading: {
		top: 0,
		left: 0,
		width: 'auto',
		height: '100%',
		position: 'relative',
		display: 'inline-block',
	},
	circular: {
		position: 'relative',
		top: 'calc(50% - 20px)', //UGLY but works best - DEFAULT circular size is 40px
		left: 'calc(50% - 20px)',
		display: 'inline-block',
	},
	fullscreenIcon: {
		position: 'absolute',
		top: theme.spacing(1),
		right: theme.spacing(1),
		cursor: 'pointer',
		width: '30px',
		height: '30px',
		minHeight: '24px',
	},
	dialog: {
		'@media(max-width:744px)': {
			minWidth: `calc(100vw - ${theme.spacing(2)}px)`,
		},
		'@media(max-height:823px)': {
			minHeight: 'auto',
		},
	},
	dialogImageParent: {
		'@media(max-width:1080px)': {
			maxWidth: '80vw',
			maxHeight: '100vw',
			display: 'block',
			margin: 'auto',
		},
		'@media(max-width:744px)': {
			paddingLeft: 0,
			paddingRight: 0,
		},
	},
	dialogImage: {
		height: 'auto',
		maxWidth: '80vw',
	},
	img: {
		width: '100%',
		height: '100%',
		objectFit: 'contain',
	},
	wrapper: {
		height: '100%',
		width: '100%',
	},
	cellImg: {
		// Fixed width to avoid col resizing while loading
		height: 46,
		width: 69,
		cursor: 'pointer',
		display: 'flex',
	},
})

const useStyles = makeStyles(styles)

const Media = ({
	type,
	src,
	fallbackSrc,
	mediaMime,
	allowVideo,
	alt,
	allowFullscreen,
	className,
	classNameImg,
	fullScreenOnClick,
	onClick,
	isCellImg,
	controls,
}) => {
	const classes = useStyles()
	const loadTimeout = useRef(null)
	const displayImage = useRef(null)
	const displayVideo = useRef(null)
	const [active, setActive] = useState(false)

	const [media, setMedia] = useState({
		src: null,
		isVideo: !!mediaMime && isVideoMedia(mediaMime),
	})

	const handleToggle = ev => {
		ev && ev.stopPropagation && ev.stopPropagation()
		ev && ev.preventDefault && ev.preventDefault()
		setActive(!active)
	}

	const clearLoadTimeout = () => {
		if (loadTimeout && loadTimeout.current) {
			clearTimeout(loadTimeout.current)
			loadTimeout.current = null
		}
	}

	const clearEvents = () => {
		if (displayImage.current) {
			displayImage.current.onerror = null
			displayImage.current.onload = null
			displayImage.current.onabort = null
		}

		if (displayVideo.current) {
			displayVideo.current.onloadedmetadata = null
		}
	}

	const onFail = useCallback(fallback => {
		clearLoadTimeout()
		clearEvents()
		setMedia({
			src: fallback,
			isVideo: false,
		})
	}, [])

	useEffect(() => {
		const isVideo = !!mediaMime && isVideoMedia(mediaMime)
		if (isVideo && !allowVideo) {
			setMedia({
				src: VIDEO_IMAGE,
				isVideo: false,
			})
		}

		clearLoadTimeout()
		clearEvents()

		const fallback = ipfsSrc(fallbackSrc) || NO_IMAGE
		const mediaSrc = ipfsSrc(src)

		loadTimeout.current = setTimeout(() => {
			onFail(fallback)
		}, MAX_IMG_LOAD_TIME)

		if (isVideo) {
			if (!displayVideo.current) {
				const video = document.createElement('video')
				displayVideo.current = video
			}

			displayVideo.current.src = mediaSrc

			displayVideo.current.onloadedmetadata = () => {
				clearLoadTimeout()
				setMedia({
					src: mediaSrc,
					isVideo: true,
				})
			}
		} else {
			if (!displayImage.current) {
				displayImage.current = new Image()
			}

			displayImage.current.src = mediaSrc

			displayImage.current.onerror = displayImage.current.onabort = () =>
				onFail(fallback)

			displayImage.current.onload = () => {
				clearLoadTimeout()
				setMedia({
					src: mediaSrc,
					isVideo: false,
				})
			}
		}

		return () => {
			clearLoadTimeout()
			clearEvents()
		}
	}, [allowVideo, fallbackSrc, mediaMime, onFail, src])

	const renderMedia = ({ onclick, imgClasses, videoClasses, controls }) => {
		if (!media.isVideo) {
			return (
				<img
					alt={alt}
					src={media.src}
					draggable='false'
					className={imgClasses}
					onDragStart={event => event.preventDefault() /*Firefox*/}
					onClick={onclick}
				/>
			)
		} else {
			return (
				<video
					src={media.src}
					autoPlay
					muted
					loop
					className={videoClasses}
					onClick={onclick}
					controls={controls}
				></video>
			)
		}
	}

	const renderFullscreenDialog = () => {
		return (
			<Dialog
				open={active}
				type={type || 'normal'}
				maxWidth={false}
				onClose={handleToggle}
				classes={{ paper: classes.dialog }}
			>
				<DialogContent className={classes.dialogImageParent}>
					{renderMedia({
						imgClasses: classnames(classes.dialogImage, classes.imgLoading),
						videoClasses: classnames(classes.dialogImage, classes.imgLoading),
					})}
				</DialogContent>
				<DialogActions>
					<Button onClick={handleToggle} color='primary'>
						{t('CLOSE')}
					</Button>
				</DialogActions>
			</Dialog>
		)
	}

	const fullScreenBtn = () => {
		return (
			<span>
				<Fab
					size='small'
					color='default'
					className={classnames(classes.fullscreenIcon)}
					onClick={() => {
						handleToggle()
					}}
				>
					<FullscreenIcon />
				</Fab>
				{renderFullscreenDialog()}
			</span>
		)
	}

	return media && media.src ? (
		<div
			className={classnames(className, classes.wrapper, {
				[classes.cellImg]: !!isCellImg,
			})}
		>
			{renderMedia({
				onclick: onClick || (fullScreenOnClick && handleToggle),
				imgClasses: classnames(classes.imgLoading, classes.img, classNameImg),
				videoClasses: classnames(classes.imgLoading, classes.img),
				controls: !!controls,
			})}
			{allowFullscreen && fullScreenBtn()}
			{fullScreenOnClick && renderFullscreenDialog()}
		</div>
	) : (
		<span className={classnames(classes.imgLoading, className)}>
			<span className={classes.circular}>
				<CircularProgress />
			</span>
		</span>
	)
}

Media.propTypes = {
	src: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
	fallbackSrc: PropTypes.string,
	alt: PropTypes.string,
	allowFullscreen: PropTypes.bool,
	fullScreenOnClick: PropTypes.bool,
	mediaMime: PropTypes.string,
}

export default Media
