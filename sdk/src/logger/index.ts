// SPDX-License-Identifier: BUSL-1.1

"use strict";
let _censorErrors = false;
const LogLevels: { [name: string]: number } = { debug: 1, "default": 2, info: 2, warning: 3, error: 4, off: 5 };
let _logLevel = LogLevels["default"];

const _version = 'Logger/0.0.1';

export enum LogLevel {
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARNING = "WARNING",
    ERROR = "ERROR",
    OFF = "OFF"
}

export enum ErrorCode {
    ///////////////////
    // Generic Errors
    // Unknown Error
    UNKNOWN_ERROR = "UNKNOWN_ERROR",
    // Not Implemented
    NOT_IMPLEMENTED = "NOT_IMPLEMENTED",
    // Unsupported Operation
    //   - operation
    UNSUPPORTED_OPERATION = "UNSUPPORTED_OPERATION",
    // Network Error (i.e. Ethereum Network, such as an invalid chain ID)
    //   - event ("noNetwork" is not re-thrown in provider.ready; otherwise thrown)
    NETWORK_ERROR = "NETWORK_ERROR",
    // Some sort of bad response from the server
    SERVER_ERROR = "SERVER_ERROR",
    // Timeout
    TIMEOUT = "TIMEOUT",
    ///////////////////
    // Operational  Errors
    // Buffer Overrun
    BUFFER_OVERRUN = "BUFFER_OVERRUN",
    // Numeric Fault
    //   - operation: the operation being executed
    //   - fault: the reason this faulted
    NUMERIC_FAULT = "NUMERIC_FAULT",
    ///////////////////
    // Argument Errors
    // Missing new operator to an object
    //  - name: The name of the class
    MISSING_NEW = "MISSING_NEW",
    // Invalid argument (e.g. value is incompatible with type) to a function:
    //   - argument: The argument name that was invalid
    //   - value: The value of the argument
    INVALID_ARGUMENT = "INVALID_ARGUMENT",
    // Missing argument to a function:
    //   - count: The number of arguments received
    //   - expectedCount: The number of arguments expected
    MISSING_ARGUMENT = "MISSING_ARGUMENT",
    // Too many arguments
    //   - count: The number of arguments received
    //   - expectedCount: The number of arguments expected
    UNEXPECTED_ARGUMENT = "UNEXPECTED_ARGUMENT",
    ///////////////////
    // Blockchain Errors
    // Call exception
    //  - transaction: the transaction
    //  - address?: the contract address
    //  - args?: The arguments passed into the function
    //  - method?: The Solidity method signature
    //  - errorSignature?: The EIP848 error signature
    //  - errorArgs?: The EIP848 error parameters
    //  - reason: The reason (only for EIP848 "Error(string)")
    CALL_EXCEPTION = "CALL_EXCEPTION",
    // Insufficien funds (< value + gasLimit * gasPrice)
    //   - transaction: the transaction attempted
    INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS",
    // Nonce has already been used
    //   - transaction: the transaction attempted
    NONCE_EXPIRED = "NONCE_EXPIRED",
    // The replacement fee for the transaction is too low
    //   - transaction: the transaction attempted
    REPLACEMENT_UNDERPRICED = "REPLACEMENT_UNDERPRICED",
    // The gas limit could not be estimated
    //   - transaction: the transaction passed to estimateGas
    UNPREDICTABLE_GAS_LIMIT = "UNPREDICTABLE_GAS_LIMIT",
};

export class Logger {
    readonly version: string;
    static errors = ErrorCode;
    static levels = LogLevel;

    constructor(version?: string) {
        this.version = version || _version;
    }

    _log(logLevel: LogLevel, args: Array<any>): void {
        const level = logLevel.toLowerCase();
        if (LogLevels[level] == null) {
            this.throwArgumentError("invalid log level name", "logLevel", logLevel);
        }
        if (_logLevel > LogLevels[level]) { return; }
        console.log.apply(console, args);
    }

    debug(...args: Array<any>): void {
        this._log(Logger.levels.DEBUG, args);
    }

    info(...args: Array<any>): void {
        this._log(Logger.levels.INFO, args);
    }

    warn(...args: Array<any>): void {
        this._log(Logger.levels.WARNING, args);
    }

    makeError(message: string, code?: ErrorCode, params?: any): Error {
        // Errors are being censored
        if (_censorErrors) {
            return this.makeError("censored error", code, {});
        }
        if (!code) { code = Logger.errors.UNKNOWN_ERROR; }
        if (!params) { params = {}; }
        const messageDetails: Array<string> = [];
        Object.keys(params).forEach((key) => {
            try {
                messageDetails.push(key + "=" + JSON.stringify(params[key]));
            } catch (error) {
                messageDetails.push(key + "=" + JSON.stringify(params[key].toString()));
            }
        });
        messageDetails.push(`code=${code}`);
        messageDetails.push(`version=${this.version}`);
        const reason = message;
        if (messageDetails.length) {
            message += " (" + messageDetails.join(", ") + ")";
        }
        // @TODO: Any??
        const error: any = new Error(message);
        error.reason = reason;
        error.code = code
        Object.keys(params).forEach(function (key) {
            error[key] = params[key];
        });
        return error;
    }

    throwError(message: string, code?: ErrorCode, params?: any): never {
        throw this.makeError(message, code, params);
    }

    throwArgumentError(message: string, name: string, value: any): never {
        return this.throwError(message, Logger.errors.INVALID_ARGUMENT, {
            argument: name,
            value: value
        });
    }

    assert(condition: any, message: string, code?: ErrorCode, params?: any): void {
        if (!!condition) { return; }
        this.throwError(message, code, params);
    }

    assertArgument(condition: any, message: string, name: string, value: any): void {
        if (!!condition) { return; }
        this.throwArgumentError(message, name, value);
    }

    static setLogLevel(logLevel: LogLevel): void {
        const level = LogLevels[logLevel.toLowerCase()];
        if (level == null) {
            return;
        }
        _logLevel = level;
    }

    static from(version: string): Logger {
        return new Logger(version);
    }
}