// SPDX-License-Identifier: BUSL-1.1

interface PostEntry {
    _accountAddress: string
    _accountNumber: number
    _txAmount: number
    _txType: string
    _txDate: string
    _txDescription: string
    _vchType: string
}

export { PostEntry }