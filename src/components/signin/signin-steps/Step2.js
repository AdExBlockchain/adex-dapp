import React, { Component } from 'react';
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import actions from 'actions'
import SigninStepHocStep from './SigninStepHocStep'
import Chip from 'react-toolbox/lib/chip'
import Avatar from 'react-toolbox/lib/avatar'
import Translate from 'components/translate/Translate'
import lightwallet from 'eth-lightwallet'

const keystore = lightwallet.keystore

const TextIcon = ({ txt }) => (
    <svg viewBox="0 0 32 32" width="32px" height="32px">
        <g>
            <text x="50%" y="50%" textAnchor="middle" fontSize="18">{txt}</text>
        </g>
    </svg>
)

class Step2 extends Component {

    generateSeed() {
        let signin = this.props.signin
        let seed = signin

        /* TODO: Are we gonna make new seed if the user can not confirm the seed
            and return to this step or keep the prev seed ot to make btn to start again?
        */

        if (seed && seed.length) {
            return
        }

        let randomSeed = []

        let extraEntropy = signin.name + signin.email + signin.password + Date.now()
        let seedString = keystore.generateRandomSeed(extraEntropy)
        randomSeed = seedString.split(' ')
        this.props.handleChange('seed', randomSeed)
    }

    componentWillMount() {
        this.generateSeed()
    }

    render() {
        let signin = this.props.signin
        let seedString = signin.seed.join(' ')
        let t = this.props.t
        return (
            <div>
                <h2>{t('MEMORIZE_SEED')}</h2>
                <h4>{t('MEMORIZE_SEED_WARNING')}</h4>
                {
                    signin.seed.map((seed, index) => {
                        return (
                            <Chip key={index + seed}>
                                <Avatar icon={<TextIcon txt={(index + 1).toString()} />} />
                                <span> {seed} </span>
                            </Chip>
                        )
                    })
                }
                <br />
                <small> {seedString}</small>
            </div>
        )
    }
}

const SigninStep2 = SigninStepHocStep(Step2)
export default Translate(SigninStep2)
