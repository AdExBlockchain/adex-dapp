
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as actions from 'actions/itemActions'
import { ItemsTypes, AdTypes, Sizes, TargetsWeight, Locations, TargetWeightLabels, Genders } from 'constants/itemsTypes'
import Dropdown from 'react-toolbox/lib/dropdown'
import ItemHoc from './ItemHoc'
import { Grid, Row, Col } from 'react-flexbox-grid'
import Img from 'components/common/img/Img'
import Item from 'models/Item'
import Input from 'react-toolbox/lib/input'
import theme from './theme.css'
import Autocomplete from 'react-toolbox/lib/autocomplete'
import Slider from 'react-toolbox/lib/slider'
import classnames from 'classnames'
import AdUnit from 'models/AdUnit'

const autocompleteLocations = () => {
    let locs = {}
    Locations.map((loc) => {
        locs[loc.value] = loc.label
    })

    return locs
}

const AcLocations = autocompleteLocations()

const autocompleteGenders = () => {
    let genders = {}
    Genders.map((gen) => {
        genders[gen.value] = gen.label
    })

    return genders
}

const AcGenders = autocompleteGenders()

const ages = (() => {
    let ages = []
    for (var index = 0; index < 99; index++) {
        ages.push(index + '')
    }

    return ages
})()

export class Unit extends Component {
    handleTargetChange = (target, valueKey, newValue) => {
        let newWeight
        if (valueKey === 'updateWeight') {
            newWeight = newValue
            newValue = target.value
        }
        else if (valueKey) {
            let tempValue = { ...target.value }
            tempValue[valueKey] = newValue
            newValue = tempValue
        }

        let newTargets = AdUnit.updateTargets(this.props.item._meta.targets, target, newValue, newWeight)
        this.props.handleChange('targets', newTargets)
    }

    renderLocationTarget = (target) => {
        return (
            <Autocomplete
                direction="down"
                multiple={true}
                onChange={this.handleTargetChange.bind(this, target, null)}
                label="Location"
                source={AcLocations}
                value={target.value}
                suggestionMatch='anywhere'
                showSuggestionsWhenValueIsSet={true}
                allowCreate={false}
            />
        )
    }

    renderGendersTarget = (target) => {
        return (
            <Autocomplete
                direction="down"
                multiple={true}
                onChange={this.handleTargetChange.bind(this, target, null)}
                label="Genders"
                source={AcGenders}
                value={target.value}
                suggestionMatch='anywhere'
                showSuggestionsWhenValueIsSet={true}
                allowCreate={false}
            />
        )
    }

    renderAgeTarget = (target) => {
        return (
            <div>
                <Grid fluid className={theme.agesGrid}>
                    <Row>
                        <Col lg={6}>

                            <Autocomplete
                                direction="down"
                                multiple={false}
                                onChange={this.handleTargetChange.bind(this, target, 'from')}
                                label="Age from"
                                source={ages}
                                value={target.value.from | 0}
                                suggestionMatch='anywhere'
                                showSuggestionsWhenValueIsSet={true}
                                allowCreate={false}
                            />
                        </Col>
                        <Col lg={6}>

                            <Autocomplete
                                direction="down"
                                multiple={false}
                                onChange={this.handleTargetChange.bind(this, target, 'to')}
                                label="Age to"
                                source={ages.slice(target.value.from)}
                                value={target.value.to | 0}
                                suggestionMatch='anywhere'
                                showSuggestionsWhenValueIsSet={true}
                                allowCreate={false}
                            />
                        </Col>
                    </Row>
                </Grid >
            </div>
        )
    }

    render() {
        let item = this.props.item
        let meta = item._meta
        let t = this.props.t

        if (!item) return (<h1>Unit '404'</h1>)

        return (
            <div>
                <div className={theme.itemPropTop}>
                    <div className={theme.imgHolder}>
                        <Img src={Item.getImgUrl(meta.img)} alt={meta.fullName} className={theme.img} />
                    </div>
                    <div className={theme.bannerProps}>
                        <div>
                            <Dropdown
                                onChange={this.props.handleChange.bind(this, 'adType')}
                                source={AdTypes}
                                value={meta.adType}
                                label={t('adType', { isProp: true })}
                            />
                        </div>
                        <div>
                            <Dropdown
                                onChange={this.props.handleChange.bind(this, 'size')}
                                source={Sizes}
                                value={meta.size}
                                label={t('size', { isProp: true })}
                            />
                        </div>
                    </div>
                </div>

                <Grid fluid>
                    <Row>
                        <Col lg={6}>
                            <Row className={theme.targetsHead}>
                                <Col lg={7}>
                                    TARGET
                                </Col>
                                <Col lg={5}>
                                    Weight
                                </Col>
                            </Row>


                            {
                                meta.targets.map((target) => {
                                    return (<Row key={target.name} className={theme.targetRow}>
                                        <Col lg={7}>
                                            {(() => {
                                                switch (target.name) {
                                                    case 'location':
                                                        return this.renderLocationTarget(target)
                                                    case 'gender':
                                                        return this.renderGendersTarget(target)
                                                    case 'age':
                                                        return this.renderAgeTarget(target)
                                                    default: null
                                                }
                                            })()}
                                        </Col>
                                        <Col lg={5} style={{ position: 'relative' }}>
                                            <div className={classnames(theme.sliderWrapper)}>
                                                <label className={classnames(theme.sliderLabel, theme.weightLabel)}>
                                                    {target.name}  weight:
                                                    <strong> {target.weight} </strong>
                                                    ({TargetWeightLabels[target.weight]})
                                                </label>
                                                <Slider className={theme.weightSlider}
                                                    pinned
                                                    snaps
                                                    min={0}
                                                    max={4}
                                                    step={1}
                                                    value={target.weight}
                                                    onChange={this.handleTargetChange.bind(this, target, 'updateWeight')}
                                                />
                                            </div>
                                        </Col>

                                    </Row>
                                    )
                                })
                            }

                        </Col>
                        <Col lg={6}>
                        </Col>
                    </Row>

                </Grid>
            </div>

        )
    }
}

Unit.propTypes = {
    actions: PropTypes.object.isRequired,
    account: PropTypes.object.isRequired,
    items: PropTypes.array.isRequired,
    item: PropTypes.object.isRequired,
    spinner: PropTypes.bool
};

function mapStateToProps(state) {
    return {
        account: state.account,
        items: state.items[ItemsTypes.AdUnit.id],
        // item: state.currentItem,
        spinner: state.spinners[ItemsTypes.AdUnit.name]
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(actions, dispatch)
    };
}

const UnitItem = ItemHoc(Unit)
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(UnitItem);
