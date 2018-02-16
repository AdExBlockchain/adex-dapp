import { cfg, getWeb3, web3Utils } from 'services/smart-contracts/ADX'
import { GAS_PRICE, MULT, DEFAULT_TIMEOUT } from 'services/smart-contracts/constants'
import { toHexParam, ipfsHashToHex } from 'services/smart-contracts/utils'
import { encrypt } from 'services/crypto/crypto'
import { exchange as EXCHANGE_CONSTANTS } from 'adex-constants'


const GAS_LIMIT_ACCEPT_BID = 450000
const GAS_LIMIT_APPROVE_0_WHEN_NO_0 = 65136 + 1
const GAS_LIMIT_APPROVE_OVER_0_WHEN_0 = 65821 + 1

const toBN = web3Utils.toBN

const getHexAdx = (amountStr, noMultiply) => {
    let am = toBN(amountStr)
    if (!noMultiply) {
        am = am.mul(toBN(MULT))
    }
    let amHex = web3Utils.toHex(am)
    return amHex
}


const logTime = (msg, start, end) => {
    console.log(msg + ' ' + (end - start) + ' ms')
}

export const acceptBid = ({ placedBid: { _advertiser, _adUnit, _opened, _target, _amount, _timeout = DEFAULT_TIMEOUT, _signature: { v, r, s, sig_mode } },
    _adSlot, _addr, gas, gasPrice, bidHash } = {}) => {
    return new Promise((resolve, reject) => {

        getWeb3.then(({ web3, exchange, token }) => {

            let start = Date.now()

            _adUnit = ipfsHashToHex(_adUnit)
            _adSlot = ipfsHashToHex(_adSlot)
            _opened = _opened.toString()
            _target = _target.toString()
            _amount = _amount.toString()
            _timeout = _timeout.toString()
            v = '0x' + v.toString(16)
            sig_mode = (sig_mode).toString()

            exchange.methods.didSign(
                _advertiser,
                bidHash,
                v,
                r,
                s,
                sig_mode
            )
                .call()
                .then((didSign) => {
                    console.log('didSign', didSign)
                    if (!didSign) {
                        return reject('didSign err')
                    }

                    exchange.methods.acceptBid(
                        _advertiser,
                        _adUnit,
                        _opened,
                        _target,
                        _amount,
                        _timeout,
                        _adSlot,
                        v,
                        r,
                        s,
                        sig_mode
                    )
                        .send({ from: _addr, gas: gas || GAS_LIMIT_ACCEPT_BID })
                        .on('transactionHash', (hash) => {
                            let end = Date.now()
                            logTime('trHshEnd', start, end)
                            // console.log('registerItem transactionHash', hash)
                        })
                        .on('confirmation', (confirmationNumber, receipt) => {
                            let end = Date.now()
                            logTime('confirmation', start, end)
                            console.log('acceptBid confirmation confirmationNumber', confirmationNumber)
                            console.log('acceptBid confirmation receipt', receipt)

                            resolve(receipt)
                        })
                        .on('receipt', (receipt) => {
                            let end = Date.now()
                            logTime('receipt', start, end)
                            console.log('acceptBid receipt', receipt)
                        })
                        .on('error', (err) => {
                            let end = Date.now()
                            logTime('error', start, end)
                            // console.log('acceptBid err', err)
                            reject(err)
                        })
                })
        })
    })
}

const getRsvFromSig = (sig) => {
    sig = sig.slice(2)

    var r = '0x' + sig.substring(0, 64)
    var s = '0x' + sig.substring(64, 128)
    var v = parseInt(sig.substring(128, 130), 16)

    return { r: r, s: s, v: v }
}
// NOTE: works with typed data in format {type: 'solidity data type', name: 'string (label)', value: 'preferable string'} 
const getTypedDataHash = ({ typedData }) => {
    let values = typedData.map((entry) => {
        return entry.value // ? .toString().toLowerCase()
    })
    let valuesHash = web3Utils.soliditySha3.apply(null, values)

    let schema = typedData.map((entry) => { return entry.type + ' ' + entry.name })
    let schemaHash = web3Utils.soliditySha3.apply(null, schema)

    let hash = web3Utils.soliditySha3(schemaHash, valuesHash)

    return hash
}

// gets the hash (bid id) from adex exchange contract
const getAdexExchangeBidHash = ({ exchange, typedData }) => {
    return new Promise((resolve, reject) => {
        // getBidID(address _advertiser, bytes32 _adunit, uint _opened, uint _target, uint _amount, uint _timeout)
        exchange.methods.getBidID(typedData[0].value, typedData[1].value, typedData[2].value, typedData[3].value, typedData[4].value, typedData[5].value)
            .call()
            .then((scHash) => {
                return resolve(scHash)
            })
            .catch((err) => {
                return reject(err)
            })
    })
}

export const signBid = ({ userAddr, bid }) => {
    return new Promise((resolve, reject) => {
        getWeb3.then(({ cfg, web3, exchange, token, mode }) => {
            //NOTE: We need to set the exchangeAddr because it is needed for the hash
            bid.exchangeAddr = cfg.addr.exchange //Need bid instance

            let typed = bid.typed

            let hash = getTypedDataHash({ typedData: typed })

            getAdexExchangeBidHash({ exchange: exchange, typedData: typed })
                .then((scHash) => {
                    if (scHash === hash) {
                        return hash
                    } else {
                        throw new Error('Error calculated hash does not match exchange id  ')
                    }
                })
                .then((checkedHash) => {
                    if (mode === EXCHANGE_CONSTANTS.SIGN_TYPES.Eip.id) {
                        web3.currentProvider.sendAsync({
                            method: 'eth_signTypedData',
                            params: [typed, userAddr],
                            from: userAddr
                        }, (err, res) => {
                            if (err) {
                                throw new Error(err)
                            }

                            if (res.error) {
                                throw new Error(res.error)
                            }

                            //TODO: do it with the Bid model
                            let signature = { sig_mode: mode, signature: res.result, hash: checkedHash, ...getRsvFromSig(res.result) }
                            return resolve(signature)
                        })
                    }
                })
                .catch((err) => {
                    return reject(err)
                })
        })
    })
}

function approveTokens({ token, _addr, exchangeAddr, amount, gas }) {
    return new Promise((resolve, reject) => {
        token.methods.approve(cfg.addr.exchange, amount)
            .send({ from: _addr, gas: gas })
            .on('transactionHash', (hash) => {
                resolve()
            })
            .on('error', (err) => {
                reject(err)
            })
    })
}

function sendDeposit({ exchange, _addr, amount, gas }) {
    return new Promise((resolve, reject) => {
        exchange.methods.deposit(amount)
            .send({ from: _addr, gas: gas })
            .on('transactionHash', (hash) => {
                resolve()
            })
            .on('error', (err) => {
                reject(err)
            })
    })
}

export const depositToExchange = ({ amountToDeposit, _addr, gas }) => {
    let amount = getHexAdx(amountToDeposit)

    return new Promise((resolve, reject) => {
        getWeb3.then(({ web3, exchange, token, mode }) => {
            var p
            token.methods
                .allowance(_addr, cfg.addr.exchange)
                .call()
                .then((allowance) => {
                    if (parseInt(allowance, 10) !== 0) {
                        p = approveTokens({ token: token, _addr: _addr, exchangeAddr: cfg.addr.exchange, amount: getHexAdx(0), gas: GAS_LIMIT_APPROVE_0_WHEN_NO_0 })
                            .then(() => {
                                approveTokens({ token: token, _addr: _addr, exchangeAddr: cfg.addr.exchange, amount: amount, gas: GAS_LIMIT_APPROVE_OVER_0_WHEN_0 })
                            })

                    } else {
                        p = approveTokens({ token: token, _addr: _addr, exchangeAddr: cfg.addr.exchange, amount: amount, gas: GAS_LIMIT_APPROVE_OVER_0_WHEN_0 })
                    }

                    return p.then(() => {
                        return sendDeposit({ exchange: exchange, _addr: _addr, amount: amount, gas: 90000 })
                    })
                })
                .then((result) => {
                    console.log('depositToExchange result ', result)
                    return resolve(result)
                })
                .catch((err) => {
                    console.log('token approve err', err)
                    reject(err)
                })
        })
    })
}