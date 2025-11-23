const libName = "xRocketAPI";
const libPrefix = "_xRocketAPI";

const setApiKey = (type, apiKey) => {
    Bot.setProp(libPrefix + type, apiKey);
    Bot.sendMessage(type + " key has been saved");
}

const getApiKey = (type) => {
    return Bot.getProp(libPrefix + type);
}

const encodeQueryParams = (queryData) => {
    return Object.keys(queryData)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryData[key])}`)
        .join("&");
}

const apiCall = (options) => {
    const headers = {
        "Content-Type": "application/json",
        "accept": "application/json;charset=utf-8",
        ...options?.headers
    };

    HTTP[options.method]({
        success: libPrefix + "onApiResponse " + options?.onSuccess,
        error: libPrefix + "onApiError",
        ...options,
        headers
    });
}

const onApiResponse = () => {
    const options = JSON.parse(content);
    
    if (!http_status) {
        http_status = 0;
    }

    if (http_status != 200 && (options?.success === false || options?.error)) {
        const constructedErrorMessage = options?.message + ": "
            + (options?.errors 
                ? options?.errors.map(error => {
                    const [prop, err] = Object.values(error);
                    return `${prop}: ${err}. `;
                })
                : "UNIDENTIFIED_ERROR");

        throw new Error(
            "HTTP return an error with code " 
            + http_status
            + ": " 
            + constructedErrorMessage
        );
    }
    
    Bot.runCommand(params, options);
}

const onApiError = () => {
    throw content;
}

class BaseAPI {
    constructor({ keyType, mainnetUrl, testnetUrl, defaultMainnet = true }) {
        this.keyType = keyType;
        this.mainnetUrl = mainnetUrl;
        this.testnetUrl = testnetUrl;
        this.mainnet = defaultMainnet;
    }

    useMainnet() {
        this.mainnet = true;
    }

    useTestnet() {
        this.mainnet = false;
    }

    getApiBaseUrl() {
        return this.mainnet ? this.mainnetUrl : this.testnetUrl;
    }

    getApiKey() {
        return getApiKey(this.keyType);
    }

    setApiKey(apiKey) {
        setApiKey(this.keyType, apiKey);
    }

    _getHeadersByKeyType(keyType) {
        switch (keyType) {
            case "PayAPI":
                return "Rocket-Pay-Key";
            case "TradeAPI": 
                return "Rocket-Exchange-Key";
            default:
                return "Rocket-Pay-Key";
        }
    }

    _request(method, path, options) {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error(`${this.keyType}: missing API key. Use setApiKey()`);
        }

        options.url = this.getApiBaseUrl() + path;
        options.method = method;

        options.headers = {};
        options.headers[
            this._getHeadersByKeyType(this.keyType)
        ] = apiKey;

        apiCall(options);
    }

    _requestWithValidation(method, basePath, requiredParams = [], options = {}) {
        const params = options.params || {};

        // required validators
        for (const rp of requiredParams) {
            if (!(rp in params)) throw new Error(`Missing param "${rp}" for ${basePath}`);
        }

        let path = basePath;

        // path params
        if (options.pathParams) {
            options.pathParams.forEach(key => {
                if (!(key in params)) throw new Error(`Missing path param "${key}"`);
                path += "/" + encodeURIComponent(params[key]);
            });
        }

        // query params
        if (options.queryParams) {
            const q = {};
            options.queryParams.forEach(key => {
                if (key in params) q[key] = params[key];
            });

            const qs = encodeQueryParams(q);
            if (qs) path += "?" + qs;
        }

        // body params
        if (options.bodyParams) {
            const b = {};
            options.bodyParams.forEach(key => {
                if (key in params) b[key] = params[key];
            });
            options.body = b;
        }

        delete options.params;
        delete options.pathParams;
        delete options.queryParams;
        delete options.bodyParams;

        this._request(method, path, options);
    }
}

class PayAPI extends BaseAPI {
    constructor() {
        super({
            keyType: "PayAPI",
            mainnetUrl: "https://pay.xrocket.tg",
            testnetUrl: "https://pay.testnet.xrocket.tg",
            defaultMainnet: true
        });

        this.app = new PayAppAPI(this);
        this.cheque = new PayChequeAPI(this);
        this.invoice = new PayInvoiceAPI(this);
    }

    version(options) {
        this._requestWithValidation("get", "/version", [], options);
    }

    getAvailableCurrencies(options) {
        this._requestWithValidation("get", "/currencies/available", [], options);
    }

    generateWithdrawalLink(options) {
        this._requestWithValidation("get", "/withdrawal-link",
            [
                "currency",
                "network",
                "address"
            ],
            {
                queryParams: [
                    "currency",
                    "network",
                    "address",
                    "amount",
                    "comment",
                    "platform"
                ],
                ...options
            }
        );
    }

    health(options) {
        this._requestWithValidation("get", "/health", [], options);
    }
}

class PayAppAPI {
    constructor(api) {
        this.api = api;
    }

    info(options) {
        this.api._requestWithValidation("get", "/app/info", [], options);
    }

    initTransfer(options) {
        this.api._requestWithValidation("post", "/app/transfer",
            [
                "tgUserId",
                "currency",
                "amount",
                "transferId"
            ],
            {
                bodyParams: [
                    "tgUserId",
                    "currency",
                    "amount",
                    "transferId",
                    "description"
                ],
                ...options
            }
        );
    }

    initWithdrawal(options) {
        this.api._requestWithValidation("post", "/app/withdrawal",
            [
                "network",
                "address",
                "currency",
                "amount",
                "withdrawalId"
            ],
            {
                bodyParams: [
                    "network",
                    "address",
                    "currency",
                    "amount",
                    "withdrawalId",
                    "comment"
                ],
                ...options
            }
        );
    }

    getWithdrawalStatus(options) {
        this.api._requestWithValidation("get", "/app/withdrawal/status",
            ["withdrawalId"], {
            pathParams: ["withdrawalId"],
            ...options
        }
        );
    }

    getWithdrawalFees(options) {
        this.api._requestWithValidation("get", "/app/withdrawal/fees", [], {
            queryParams: ["currency"],
            ...options
        });
    }
}

class PayChequeAPI {
    constructor(api) {
        this.api = api;
    }

    createMultiCheque(options) {
        this.api._requestWithValidation("post", "/multi-cheque",
            [
                "currency",
                "chequePerUser",
                "usersNumber",
                "sendNotification",
                "enableCaptcha",
                "refProgram",
                "forPremium",
                "linkedWallet"
            ],
            {
                bodyParams: [
                    "currency",
                    "chequePerUser",
                    "usersNumber",
                    "refProgram",
                    "password",
                    "description",
                    "sendNotifications",
                    "enableCaptcha",
                    "telegramResourcesIds",
                    "forPremium",
                    "linkedWallet",
                    "disabledLanguages",
                    "enabledCountries"
                ],
                ...options
            }
        );
    }

    getMultiCheque(options) {
        this.api._requestWithValidation("get", "/multi-cheque", [], {
            queryParams: ["limit", "offset"],
            ...options
        });
    }

    getMultiChequeById(options) {
        this.api._requestWithValidation("get", "/multi-cheque",
            ["chequeId"], {
            pathParams: ["chequeId"],
            ...options
        });
    }

    updateMultiChequeById(options) {
        this.api._requestWithValidation("put", "/multi-cheque",
            ["chequeId"], 
            {
                pathParams: ["chequeId"],
                bodyParams: [
                    "password",
                    "description",
                    "sendNotifications",
                    "enableCaptcha",
                    "telegramResourcesIds",
                    "forPremium",
                    "linkedWallet",
                    "disabledLanguages",
                    "enabledCountries"
                ],
                ...options
            }
        );
    }

    deleteMultiChequeById(options) {
        this.api._requestWithValidation("delete", "/multi-cheque",
            ["chequeId"], {
            pathParams: ["chequeId"],
            ...options
        });
    }
}

class PayInvoiceAPI {
    constructor(api) {
        this.api = api;
    }

    createInvoice(options) {
        this.api._requestWithValidation("post", "/tg-invoices",
            ["amount", "currency"], 
            {
                bodyParams: [
                    "amount",
                    "minPayment",
                    "numPayments",
                    "currency",
                    "description",
                    "hiddenMessage",
                    "commentsEnabled",   
                    "callbackUrl",
                    "payload",
                    "expiredIn",
                    "platformId"
                ],
                ...options
            }
        );
    }

    getInvoice(options) {
        this.api._requestWithValidation("get", "/tg-invoices", [], {
            queryParams: ["limit", "offset"],
            ...options
        });
    }

    getInvoiceById(options) {
        this.api._requestWithValidation("get", "/tg-invoices", ["invoiceId"], {
            pathParams: ["invoiceId"],
            ...options
        });
    }

    deleteInvoiceById(options) {
        this.api._requestWithValidation("delete", "/tg-invoices", ["invoiceId"], {
            pathParams: ["invoiceId"],
            ...options
        });
    }
}

class TradeAPI extends BaseAPI {
    constructor() {
        super({
            keyType: "TradeAPI",
            mainnetUrl: "https://trade.xrocket.tg",
            testnetUrl: "https://trade.testnet.xrocket.tg",
            defaultMainnet: true
        });
        
        this.account = new TradeAccountAPI(this);
        this.pair = new TradePairAPI(this);
        this.rate = new TradeRateAPI(this);
        this.order = new TradeOrderAPI(this);
    }

    version(options) {
        this._requestWithValidation("get", "/version", [], options);
    }

    getLastTrades(options) {
        this._requestWithValidation("get", "/trades/last", ["pair"], {
            pathParams: ["pair"],
            queryParams: ["limit"],
            ...options
        });
    }

    health(options) {
        this._requestWithValidation("get", "/health", [], options);
    }
}

class TradeAccountAPI {
    constructor(api) {
        this.api = api;
    }

    getAccountBalance(options) {
        this._requestWithValidation("get", "/account/balance", [], options);
    }

    getAccountFees(options) {
        this._requestWithValidation("get", "/account/fees", [], options);
    }

    getAccountBalanceByCoin(options) {
        this._requestWithValidation("get", "/account/balance", ["coin"], {
            pathParams: ["coin"],
            ...options
        });
    }

    getAccountWithdrawalFees(options) {
        this._requestWithValidation("get", "/account/withdrawal/fees", [], {
            queryParams: ["currency"]
        });
    }

    initAccountWithdrawal(options) {
        this._requestWithValidation("post", "/account/withdrawal", 
            [
                "network",
                "address",
                "currency",
                "amount",
                "withdrawalId"
            ],
            {
                bodyParams: [
                    "network",
                    "address",
                    "currency",
                    "amount",
                    "withdrawalId",
                    "comment"
                ],
                ...options
            }
        );
    }

    getAccountWithdrawalStatus(options) {
        this._requestWithValidation("get", "/account/withdrawal/status", ["withdrawalId"], {
            pathParams: ["withdrawalId"],
            ...options
        });
    }
}

class TradePairAPI {
    constructor(api) {
        this.api = api;
    }

    getPair(options) {
        this._requestWithValidation("get", "/pairs", ["pair"], {
            pathParams: ["pair"],
            ...options
        });
    }

    getAllPairs(options) {
        this._requestWithValidation("get", "/pairs", [], options);
    }

    getTimeSeries(options) {
        this._requestWithValidation("get", "/time-series", 
            [
                "pair",
                "startDate",
                "endDate",
                "period"
            ],
            {
                pathParams: ["pair"],
                queryParams: [
                    "startDate",
                    "endDate",
                    "period"
                ],
                ...options
            }
        );
    }

    getFullOrderBookByPair(options) {
        this._requestWithValidation("get", "/order-book/full", ["pair"], {
            pathParams: ["pair"],
            ...options
        });
    }

    getCompactOrderBookByPair(options) {
        this._requestWithValidation("get", "/order-book/compact", ["pair"], {
            pathParams: ["pair"],
            ...options
        });
    }
}

class TradeRateAPI {
    constructor(api) {
        this.api = api;
    }

    getAvailableFiat(options) {
        this._requestWithValidation("get", "/rates/fiat/available", [], options);
    }

    getAvailableCrypto(options) {
        this._requestWithValidation("get", "/rates/crypto/available", [], options);
    }

    getCryptoRate(options) {
        this._requestWithValidation("get", "/rates/crypto", ["base", "quote"], {
            pathParams: ["base", "quote"],
            ...options
        });
    }

    getCryptoRateByFiat(options) {
        this._requestWithValidation("get", "/rates/fiat", ["crypto", "fiat"], {
            pathParams: ["crypto", "fiat"],
            ...options
        });
    }
}

class TradeOrderAPI {
    constructor(api) {
        this.api = api;
    }

    getAllOrders(options) {
        this._requestWithValidation("get", "/orders", ["onlyActive"], {
            queryParams: [
                "onlyActive",
                "limit",
                "offset"
            ],
            ...options
        });
    }

    getOrdersByPair(options) {
        this._requestWithValidation("get", "/orders/pair", ["pair", "onlyActive"], {
            pathParams: ["pair"],
            queryParams: [
                "onlyActive",
                "limit",
                "offset"
            ],
            ...options
        });
    }

    getOrderById(options) {
        this._requestWithValidation("get", "/orders", ["orderId"], {
            pathParams: ["orderId"],
            ...options
        });
    }

    deleteOrderById(options) {
        this._requestWithValidation("delete", "/orders", ["orderId"], {
            pathParams: ["orderId"],
            ...options
        });
    }

    estimateOrder(options) {
        this._requestWithValidation("post", "/orders/estimate",
            [
                "pair",
                "type",
                "executeType",
                "rate",
                "amount",
                "currency"
            ],
            {
                bodyParams: [
                    "pair",
                    "type",
                    "executeType",
                    "rate",
                    "amount",
                    "currency"
                ],
                ...options
            }
        );
    }

    createOrder(options) {
        this._requestWithValidation("post", "/orders", 
            [
                "pair",
                "type",
                "executeType",
                "rate",
                "amount",
                "currency"
            ],
            {
                bodyParams: [
                    "pair",
                    "type",
                    "executeType",
                    "rate",
                    "amount",
                    "currency"
                ],
                ...options
            }
        );
    }
}

publish({
  pay: new PayAPI(),
  trade: new TradeAPI()
});

on(libPrefix + "onApiResponse", onApiResponse);
on(libPrefix + "onApiError", onApiError);
