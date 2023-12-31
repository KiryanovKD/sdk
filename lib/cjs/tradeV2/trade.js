"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeV2 = void 0;
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const bn_js_1 = __importDefault(require("bn.js"));
const base_1 = require("../base");
const clmm_1 = require("../clmm");
const constants_1 = require("../clmm/utils/constants");
const common_1 = require("../common");
const entity_1 = require("../entity");
const liquidity_1 = require("../liquidity");
const token_1 = require("../token");
const instrument_1 = require("./instrument");
class TradeV2 extends base_1.Base {
    static getAllRoute({ inputMint, outputMint, apiPoolList, clmmList, allowedRouteToken2022 = false, }) {
        var _a, _b;
        inputMint = inputMint.toString() === web3_js_1.PublicKey.default.toString() ? new web3_js_1.PublicKey(token_1.WSOL.mint) : inputMint;
        outputMint = outputMint.toString() === web3_js_1.PublicKey.default.toString() ? new web3_js_1.PublicKey(token_1.WSOL.mint) : outputMint;
        const needSimulate = {};
        const needTickArray = {};
        const needCheckToken = new Set();
        const directPath = [];
        const routePathDict = {}; // {[route mint: string]: {in: [] , out: []}}
        for (const itemAmmPool of clmmList !== null && clmmList !== void 0 ? clmmList : []) {
            if ((itemAmmPool.mintA.mint.equals(inputMint) && itemAmmPool.mintB.mint.equals(outputMint)) ||
                (itemAmmPool.mintA.mint.equals(outputMint) && itemAmmPool.mintB.mint.equals(inputMint))) {
                directPath.push(itemAmmPool);
                needTickArray[itemAmmPool.id.toString()] = itemAmmPool;
            }
            if (itemAmmPool.mintA.mint.equals(inputMint) &&
                (itemAmmPool.mintB.programId.equals(spl_token_1.TOKEN_PROGRAM_ID) || allowedRouteToken2022)) {
                const t = itemAmmPool.mintB.mint.toString();
                if (routePathDict[t] === undefined)
                    routePathDict[t] = {
                        mintProgram: itemAmmPool.mintB.programId,
                        in: [],
                        out: [],
                        mDecimals: itemAmmPool.mintB.decimals,
                    };
                routePathDict[t].in.push(itemAmmPool);
            }
            if (itemAmmPool.mintB.mint.equals(inputMint) &&
                (itemAmmPool.mintA.programId.equals(spl_token_1.TOKEN_PROGRAM_ID) || allowedRouteToken2022)) {
                const t = itemAmmPool.mintA.mint.toString();
                if (routePathDict[t] === undefined)
                    routePathDict[t] = {
                        mintProgram: itemAmmPool.mintA.programId,
                        in: [],
                        out: [],
                        mDecimals: itemAmmPool.mintA.decimals,
                    };
                routePathDict[t].in.push(itemAmmPool);
            }
            if (itemAmmPool.mintA.mint.equals(outputMint) &&
                (itemAmmPool.mintB.programId.equals(spl_token_1.TOKEN_PROGRAM_ID) || allowedRouteToken2022)) {
                const t = itemAmmPool.mintB.mint.toString();
                if (routePathDict[t] === undefined)
                    routePathDict[t] = {
                        mintProgram: itemAmmPool.mintB.programId,
                        in: [],
                        out: [],
                        mDecimals: itemAmmPool.mintB.decimals,
                    };
                routePathDict[t].out.push(itemAmmPool);
            }
            if (itemAmmPool.mintB.mint.equals(outputMint) &&
                (itemAmmPool.mintA.programId.equals(spl_token_1.TOKEN_PROGRAM_ID) || allowedRouteToken2022)) {
                const t = itemAmmPool.mintA.mint.toString();
                if (routePathDict[t] === undefined)
                    routePathDict[t] = {
                        mintProgram: itemAmmPool.mintA.programId,
                        in: [],
                        out: [],
                        mDecimals: itemAmmPool.mintA.decimals,
                    };
                routePathDict[t].out.push(itemAmmPool);
            }
        }
        const addLiquidityPools = [];
        const _inputMint = inputMint.toString();
        const _outputMint = outputMint.toString();
        for (const itemAmmPool of (_a = (apiPoolList !== null && apiPoolList !== void 0 ? apiPoolList : {}).official) !== null && _a !== void 0 ? _a : []) {
            if ((itemAmmPool.baseMint === _inputMint && itemAmmPool.quoteMint === _outputMint) ||
                (itemAmmPool.baseMint === _outputMint && itemAmmPool.quoteMint === _inputMint)) {
                directPath.push(itemAmmPool);
                needSimulate[itemAmmPool.id] = itemAmmPool;
                addLiquidityPools.push(itemAmmPool);
            }
            if (itemAmmPool.baseMint === _inputMint) {
                if (routePathDict[itemAmmPool.quoteMint] === undefined)
                    routePathDict[itemAmmPool.quoteMint] = {
                        mintProgram: spl_token_1.TOKEN_PROGRAM_ID,
                        in: [],
                        out: [],
                        mDecimals: itemAmmPool.quoteDecimals,
                    };
                routePathDict[itemAmmPool.quoteMint].in.push(itemAmmPool);
            }
            if (itemAmmPool.quoteMint === _inputMint) {
                if (routePathDict[itemAmmPool.baseMint] === undefined)
                    routePathDict[itemAmmPool.baseMint] = {
                        mintProgram: spl_token_1.TOKEN_PROGRAM_ID,
                        in: [],
                        out: [],
                        mDecimals: itemAmmPool.baseDecimals,
                    };
                routePathDict[itemAmmPool.baseMint].in.push(itemAmmPool);
            }
            if (itemAmmPool.baseMint === _outputMint) {
                if (routePathDict[itemAmmPool.quoteMint] === undefined)
                    routePathDict[itemAmmPool.quoteMint] = {
                        mintProgram: spl_token_1.TOKEN_PROGRAM_ID,
                        in: [],
                        out: [],
                        mDecimals: itemAmmPool.quoteDecimals,
                    };
                routePathDict[itemAmmPool.quoteMint].out.push(itemAmmPool);
            }
            if (itemAmmPool.quoteMint === _outputMint) {
                if (routePathDict[itemAmmPool.baseMint] === undefined)
                    routePathDict[itemAmmPool.baseMint] = {
                        mintProgram: spl_token_1.TOKEN_PROGRAM_ID,
                        in: [],
                        out: [],
                        mDecimals: itemAmmPool.baseDecimals,
                    };
                routePathDict[itemAmmPool.baseMint].out.push(itemAmmPool);
            }
        }
        const _insertAddLiquidityPool = addLiquidityPools.length === 0;
        for (const itemAmmPool of (_b = (apiPoolList !== null && apiPoolList !== void 0 ? apiPoolList : {}).unOfficial) !== null && _b !== void 0 ? _b : []) {
            if ((itemAmmPool.baseMint === _inputMint && itemAmmPool.quoteMint === _outputMint) ||
                (itemAmmPool.baseMint === _outputMint && itemAmmPool.quoteMint === _inputMint)) {
                directPath.push(itemAmmPool);
                needSimulate[itemAmmPool.id] = itemAmmPool;
                if (_insertAddLiquidityPool)
                    addLiquidityPools.push(itemAmmPool);
            }
            if (itemAmmPool.baseMint === _inputMint) {
                if (routePathDict[itemAmmPool.quoteMint] === undefined)
                    routePathDict[itemAmmPool.quoteMint] = {
                        mintProgram: spl_token_1.TOKEN_PROGRAM_ID,
                        in: [],
                        out: [],
                        mDecimals: itemAmmPool.quoteDecimals,
                    };
                routePathDict[itemAmmPool.quoteMint].in.push(itemAmmPool);
            }
            if (itemAmmPool.quoteMint === _inputMint) {
                if (routePathDict[itemAmmPool.baseMint] === undefined)
                    routePathDict[itemAmmPool.baseMint] = {
                        mintProgram: spl_token_1.TOKEN_PROGRAM_ID,
                        in: [],
                        out: [],
                        mDecimals: itemAmmPool.baseDecimals,
                    };
                routePathDict[itemAmmPool.baseMint].in.push(itemAmmPool);
            }
            if (itemAmmPool.baseMint === _outputMint) {
                if (routePathDict[itemAmmPool.quoteMint] === undefined)
                    routePathDict[itemAmmPool.quoteMint] = {
                        mintProgram: spl_token_1.TOKEN_PROGRAM_ID,
                        in: [],
                        out: [],
                        mDecimals: itemAmmPool.quoteDecimals,
                    };
                routePathDict[itemAmmPool.quoteMint].out.push(itemAmmPool);
            }
            if (itemAmmPool.quoteMint === _outputMint) {
                if (routePathDict[itemAmmPool.baseMint] === undefined)
                    routePathDict[itemAmmPool.baseMint] = {
                        mintProgram: spl_token_1.TOKEN_PROGRAM_ID,
                        in: [],
                        out: [],
                        mDecimals: itemAmmPool.baseDecimals,
                    };
                routePathDict[itemAmmPool.baseMint].out.push(itemAmmPool);
            }
        }
        for (const t of Object.keys(routePathDict)) {
            if (routePathDict[t].in.length === 1 &&
                routePathDict[t].out.length === 1 &&
                String(routePathDict[t].in[0].id) === String(routePathDict[t].out[0].id)) {
                delete routePathDict[t];
                continue;
            }
            if (routePathDict[t].in.length === 0 || routePathDict[t].out.length === 0) {
                delete routePathDict[t];
                continue;
            }
            const info = routePathDict[t];
            for (const infoIn of info.in) {
                for (const infoOut of info.out) {
                    if (infoIn.version === 6 && needTickArray[infoIn.id.toString()] === undefined) {
                        needTickArray[infoIn.id.toString()] = infoIn;
                        if (infoIn.mintA.programId.equals(spl_token_1.TOKEN_2022_PROGRAM_ID))
                            needCheckToken.add(infoIn.mintA.mint.toString());
                        if (infoIn.mintB.programId.equals(spl_token_1.TOKEN_2022_PROGRAM_ID))
                            needCheckToken.add(infoIn.mintB.mint.toString());
                    }
                    else if (infoIn.version !== 6 && needSimulate[infoIn.id] === undefined) {
                        needSimulate[infoIn.id] = infoIn;
                    }
                    if (infoOut.version === 6 && needTickArray[infoOut.id.toString()] === undefined) {
                        needTickArray[infoOut.id.toString()] = infoOut;
                        if (infoOut.mintA.programId.equals(spl_token_1.TOKEN_2022_PROGRAM_ID))
                            needCheckToken.add(infoOut.mintA.mint.toString());
                        if (infoOut.mintB.programId.equals(spl_token_1.TOKEN_2022_PROGRAM_ID))
                            needCheckToken.add(infoOut.mintB.mint.toString());
                    }
                    else if (infoOut.version !== 6 && needSimulate[infoOut.id] === undefined) {
                        needSimulate[infoOut.id] = infoOut;
                    }
                }
            }
        }
        for (const item of directPath) {
            if (item.version === 6) {
                if (item.mintA.programId.equals(spl_token_1.TOKEN_2022_PROGRAM_ID))
                    needCheckToken.add(item.mintA.mint.toString());
                if (item.mintB.programId.equals(spl_token_1.TOKEN_2022_PROGRAM_ID))
                    needCheckToken.add(item.mintB.mint.toString());
            }
        }
        return {
            directPath,
            addLiquidityPools,
            routePathDict,
            needSimulate: Object.values(needSimulate),
            needTickArray: Object.values(needTickArray),
            needCheckToken: [...needCheckToken],
        };
    }
    static fetchMultipleInfo({ connection, pools, batchRequest = true, }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (pools.find((i) => i.version === 5))
                yield (0, liquidity_1.initStableModelLayout)(connection);
            const instructions = pools.map((pool) => liquidity_1.Liquidity.makeSimulatePoolInfoInstruction({ poolKeys: (0, common_1.jsonInfo2PoolKeys)(pool) }));
            const logs = yield (0, common_1.simulateMultipleInstruction)(connection, instructions.map((i) => i.innerTransaction.instructions).flat(), 'GetPoolData', batchRequest);
            const poolsInfo = {};
            for (const log of logs) {
                const json = (0, common_1.parseSimulateLogToJson)(log, 'GetPoolData');
                const ammId = JSON.parse(json)['amm_id'];
                const status = new bn_js_1.default((0, common_1.parseSimulateValue)(json, 'status'));
                const baseDecimals = Number((0, common_1.parseSimulateValue)(json, 'coin_decimals'));
                const quoteDecimals = Number((0, common_1.parseSimulateValue)(json, 'pc_decimals'));
                const lpDecimals = Number((0, common_1.parseSimulateValue)(json, 'lp_decimals'));
                const baseReserve = new bn_js_1.default((0, common_1.parseSimulateValue)(json, 'pool_coin_amount'));
                const quoteReserve = new bn_js_1.default((0, common_1.parseSimulateValue)(json, 'pool_pc_amount'));
                const lpSupply = new bn_js_1.default((0, common_1.parseSimulateValue)(json, 'pool_lp_supply'));
                // TODO fix it when split stable
                let startTime = '0';
                try {
                    startTime = (0, common_1.parseSimulateValue)(json, 'pool_open_time');
                }
                catch (error) {
                    //
                }
                poolsInfo[ammId] = {
                    ammId,
                    status,
                    baseDecimals,
                    quoteDecimals,
                    lpDecimals,
                    baseReserve,
                    quoteReserve,
                    lpSupply,
                    startTime: new bn_js_1.default(startTime),
                };
            }
            return poolsInfo;
        });
    }
    static getAddLiquidityDefaultPool({ addLiquidityPools, poolInfosCache, }) {
        if (addLiquidityPools.length === 0)
            return undefined;
        if (addLiquidityPools.length === 1)
            return addLiquidityPools[0];
        addLiquidityPools.sort((a, b) => b.version - a.version);
        if (addLiquidityPools[0].version !== addLiquidityPools[1].version)
            return addLiquidityPools[0];
        const _addLiquidityPools = addLiquidityPools.filter((i) => i.version === addLiquidityPools[0].version);
        _addLiquidityPools.sort((a, b) => this.ComparePoolSize(a, b, poolInfosCache));
        return _addLiquidityPools[0];
    }
    static ComparePoolSize(a, b, ammIdToPoolInfo) {
        const aInfo = ammIdToPoolInfo[a.id];
        const bInfo = ammIdToPoolInfo[b.id];
        if (aInfo === undefined)
            return 1;
        if (bInfo === undefined)
            return -1;
        if (a.baseMint === b.baseMint) {
            const sub = aInfo.baseReserve.sub(bInfo.baseReserve);
            return sub.gte(entity_1.ZERO) ? -1 : 1;
        }
        else {
            const sub = aInfo.baseReserve.sub(bInfo.quoteReserve);
            return sub.gte(entity_1.ZERO) ? -1 : 1;
        }
    }
    static getAllRouteComputeAmountOut({ inputTokenAmount, outputToken, directPath, routePathDict, simulateCache, tickCache, mintInfos, slippage, chainTime, epochInfo, feeConfig, }) {
        const _amountInFee = feeConfig === undefined
            ? new bn_js_1.default(0)
            : inputTokenAmount.raw.mul(new bn_js_1.default(feeConfig.feeBps.toNumber())).div(new bn_js_1.default(10000));
        const _amoutIn = inputTokenAmount.raw.sub(_amountInFee);
        const amountIn = inputTokenAmount instanceof entity_1.TokenAmount
            ? new entity_1.TokenAmount(inputTokenAmount.token, _amoutIn)
            : new entity_1.CurrencyAmount(inputTokenAmount.currency, _amoutIn);
        const _inFeeConfig = feeConfig === undefined
            ? undefined
            : {
                feeAmount: _amountInFee,
                feeAccount: feeConfig.feeAccount,
            };
        const outRoute = [];
        for (const itemPool of directPath) {
            if (itemPool.version === 6) {
                try {
                    const { realAmountIn, amountOut, minAmountOut, expirationTime, currentPrice, executionPrice, priceImpact, fee, remainingAccounts, } = clmm_1.Clmm.computeAmountOutFormat({
                        poolInfo: itemPool,
                        tickArrayCache: tickCache[itemPool.id.toString()],
                        amountIn,
                        currencyOut: outputToken,
                        slippage,
                        token2022Infos: mintInfos,
                        epochInfo,
                    });
                    outRoute.push({
                        amountIn: realAmountIn,
                        amountOut,
                        minAmountOut,
                        currentPrice,
                        executionPrice,
                        priceImpact,
                        fee: [fee],
                        remainingAccounts: [remainingAccounts],
                        routeType: 'amm',
                        poolKey: [itemPool],
                        poolReady: itemPool.startTime < chainTime,
                        poolType: 'CLMM',
                        feeConfig: _inFeeConfig,
                        expirationTime: (0, base_1.minExpirationTime)(realAmountIn.expirationTime, expirationTime),
                    });
                }
                catch (e) {
                    //
                }
            }
            else {
                try {
                    if (![1, 6, 7].includes(simulateCache[itemPool.id].status.toNumber()))
                        continue;
                    const { amountOut, minAmountOut, currentPrice, executionPrice, priceImpact, fee } = liquidity_1.Liquidity.computeAmountOut({
                        poolKeys: (0, common_1.jsonInfo2PoolKeys)(itemPool),
                        poolInfo: simulateCache[itemPool.id],
                        amountIn,
                        currencyOut: outputToken,
                        slippage,
                    });
                    outRoute.push({
                        amountIn: { amount: amountIn, fee: undefined, expirationTime: undefined },
                        amountOut: { amount: amountOut, fee: undefined, expirationTime: undefined },
                        minAmountOut: { amount: minAmountOut, fee: undefined, expirationTime: undefined },
                        currentPrice,
                        executionPrice,
                        priceImpact,
                        fee: [fee],
                        routeType: 'amm',
                        poolKey: [itemPool],
                        remainingAccounts: [],
                        poolReady: simulateCache[itemPool.id].startTime.toNumber() < chainTime,
                        poolType: itemPool.version === 5 ? 'STABLE' : undefined,
                        feeConfig: _inFeeConfig,
                        expirationTime: undefined,
                    });
                }
                catch (e) {
                    //
                }
            }
        }
        for (const [routeMint, info] of Object.entries(routePathDict)) {
            for (const iFromPool of info.in) {
                if (!simulateCache[iFromPool.id] && !tickCache[iFromPool.id.toString()])
                    continue;
                if (iFromPool.version !== 6 && ![1, 6, 7].includes(simulateCache[iFromPool.id].status.toNumber()))
                    continue;
                for (const iOutPool of info.out) {
                    if (!simulateCache[iOutPool.id] && !tickCache[iOutPool.id.toString()])
                        continue;
                    if (iOutPool.version !== 6 && ![1, 6, 7].includes(simulateCache[iOutPool.id].status.toNumber()))
                        continue;
                    try {
                        const { amountOut, minAmountOut, executionPrice, priceImpact, fee, remainingAccounts, minMiddleAmountFee, expirationTime, realAmountIn, middleToken, } = TradeV2.computeAmountOut({
                            middleMintInfo: { programId: info.mintProgram, mint: new web3_js_1.PublicKey(routeMint), decimals: info.mDecimals },
                            amountIn,
                            currencyOut: outputToken,
                            slippage,
                            fromPool: iFromPool,
                            toPool: iOutPool,
                            simulateCache,
                            tickCache,
                            epochInfo,
                            mintInfos,
                        });
                        const infoAPoolOpen = iFromPool.version === 6
                            ? iFromPool.startTime < chainTime
                            : simulateCache[iFromPool.id].startTime.toNumber() < chainTime;
                        const infoBPoolOpen = iOutPool.version === 6
                            ? iOutPool.startTime < chainTime
                            : simulateCache[iOutPool.id].startTime.toNumber() < chainTime;
                        const poolTypeA = iFromPool.version === 6 ? 'CLMM' : iFromPool.version === 5 ? 'STABLE' : undefined;
                        const poolTypeB = iOutPool.version === 6 ? 'CLMM' : iOutPool.version === 5 ? 'STABLE' : undefined;
                        outRoute.push({
                            amountIn: realAmountIn,
                            amountOut,
                            minAmountOut,
                            currentPrice: undefined,
                            executionPrice,
                            priceImpact,
                            fee,
                            routeType: 'route',
                            poolKey: [iFromPool, iOutPool],
                            remainingAccounts,
                            minMiddleAmountFee,
                            middleToken,
                            poolReady: infoAPoolOpen && infoBPoolOpen,
                            poolType: [poolTypeA, poolTypeB],
                            feeConfig: _inFeeConfig,
                            expirationTime,
                        });
                    }
                    catch (e) {
                        //
                    }
                }
            }
        }
        outRoute.sort((a, b) => (a.amountOut.amount.raw.sub(b.amountOut.amount.raw).gt(entity_1.ZERO) ? -1 : 1));
        return outRoute;
    }
    static computeAmountOut({ middleMintInfo, amountIn, currencyOut, slippage, fromPool, toPool, simulateCache, tickCache, epochInfo, mintInfos, }) {
        var _a, _b, _c, _d;
        const middleToken = new entity_1.Token(middleMintInfo.programId, middleMintInfo.mint, middleMintInfo.decimals);
        let firstPriceImpact;
        let firstFee;
        let firstRemainingAccounts = undefined;
        let minMiddleAmountOut;
        let firstExpirationTime = undefined;
        let realAmountIn = {
            amount: amountIn,
            fee: undefined,
            expirationTime: undefined,
        };
        const _slippage = new entity_1.Percent(0, 100);
        if (fromPool.version === 6) {
            const { minAmountOut: _minMiddleAmountOut, priceImpact: _firstPriceImpact, fee: _firstFee, remainingAccounts: _firstRemainingAccounts, expirationTime: _expirationTime, realAmountIn: _realAmountIn, } = clmm_1.Clmm.computeAmountOutFormat({
                poolInfo: fromPool,
                tickArrayCache: tickCache[fromPool.id.toString()],
                amountIn,
                currencyOut: middleToken,
                slippage: _slippage,
                token2022Infos: mintInfos,
                epochInfo,
            });
            minMiddleAmountOut = _minMiddleAmountOut;
            firstPriceImpact = _firstPriceImpact;
            firstFee = _firstFee;
            firstRemainingAccounts = _firstRemainingAccounts;
            firstExpirationTime = _expirationTime;
            realAmountIn = _realAmountIn;
        }
        else {
            const { minAmountOut: _minMiddleAmountOut, priceImpact: _firstPriceImpact, fee: _firstFee, } = liquidity_1.Liquidity.computeAmountOut({
                poolKeys: (0, common_1.jsonInfo2PoolKeys)(fromPool),
                poolInfo: simulateCache[fromPool.id],
                amountIn,
                currencyOut: middleToken,
                slippage: _slippage,
            });
            minMiddleAmountOut = {
                amount: _minMiddleAmountOut,
                fee: undefined,
                expirationTime: undefined,
            };
            firstPriceImpact = _firstPriceImpact;
            firstFee = _firstFee;
        }
        let amountOut;
        let minAmountOut;
        let secondPriceImpact;
        let secondFee;
        let secondRemainingAccounts = undefined;
        let secondExpirationTime = undefined;
        let realAmountRouteIn = minMiddleAmountOut;
        if (toPool.version === 6) {
            const { amountOut: _amountOut, minAmountOut: _minAmountOut, priceImpact: _secondPriceImpact, fee: _secondFee, remainingAccounts: _secondRemainingAccounts, expirationTime: _expirationTime, realAmountIn: _realAmountIn, } = clmm_1.Clmm.computeAmountOutFormat({
                poolInfo: toPool,
                tickArrayCache: tickCache[toPool.id.toString()],
                amountIn: new entity_1.TokenAmount(minMiddleAmountOut.amount.token, minMiddleAmountOut.amount.raw.sub(minMiddleAmountOut.fee === undefined ? entity_1.ZERO : minMiddleAmountOut.fee.raw)),
                currencyOut,
                slippage,
                token2022Infos: mintInfos,
                epochInfo,
            });
            amountOut = _amountOut;
            minAmountOut = _minAmountOut;
            secondPriceImpact = _secondPriceImpact;
            secondFee = _secondFee;
            secondRemainingAccounts = _secondRemainingAccounts;
            secondExpirationTime = _expirationTime;
            realAmountRouteIn = _realAmountIn;
        }
        else {
            const { amountOut: _amountOut, minAmountOut: _minAmountOut, priceImpact: _secondPriceImpact, fee: _secondFee, } = liquidity_1.Liquidity.computeAmountOut({
                poolKeys: (0, common_1.jsonInfo2PoolKeys)(toPool),
                poolInfo: simulateCache[toPool.id],
                amountIn: new entity_1.TokenAmount(minMiddleAmountOut.amount.token, minMiddleAmountOut.amount.raw.sub(minMiddleAmountOut.fee === undefined ? entity_1.ZERO : minMiddleAmountOut.fee.raw)),
                currencyOut,
                slippage,
            });
            amountOut = {
                amount: _amountOut,
                fee: undefined,
                expirationTime: undefined,
            };
            minAmountOut = {
                amount: _minAmountOut,
                fee: undefined,
                expirationTime: undefined,
            };
            secondPriceImpact = _secondPriceImpact;
            secondFee = _secondFee;
        }
        let executionPrice = null;
        const amountInRaw = amountIn.raw;
        const amountOutRaw = amountOut.amount.raw;
        const currencyIn = amountIn instanceof entity_1.TokenAmount ? amountIn.token : amountIn.currency;
        if (!amountInRaw.isZero() && !amountOutRaw.isZero()) {
            executionPrice = new entity_1.Price(currencyIn, amountInRaw, currencyOut, amountOutRaw);
        }
        return {
            minMiddleAmountFee: minMiddleAmountOut.fee !== undefined
                ? new entity_1.TokenAmount(middleToken, ((_b = (_a = minMiddleAmountOut.fee) === null || _a === void 0 ? void 0 : _a.raw) !== null && _b !== void 0 ? _b : new bn_js_1.default(0)).add((_d = (_c = realAmountRouteIn.fee) === null || _c === void 0 ? void 0 : _c.raw) !== null && _d !== void 0 ? _d : new bn_js_1.default(0)))
                : undefined,
            middleToken,
            realAmountIn,
            amountOut,
            minAmountOut,
            executionPrice,
            priceImpact: firstPriceImpact.add(secondPriceImpact),
            fee: [firstFee, secondFee],
            remainingAccounts: [firstRemainingAccounts, secondRemainingAccounts],
            expirationTime: (0, base_1.minExpirationTime)(firstExpirationTime, secondExpirationTime),
        };
    }
    static makeSwapInstruction({ routeProgram, ownerInfo, inputMint, swapInfo }) {
        var _a, _b, _c, _d, _e, _f;
        if (swapInfo.routeType === 'amm') {
            if (swapInfo.poolKey[0].version === 6) {
                const _poolKey = swapInfo.poolKey[0];
                const sqrtPriceLimitX64 = inputMint.equals(_poolKey.mintA.mint)
                    ? constants_1.MIN_SQRT_PRICE_X64.add(entity_1.ONE)
                    : constants_1.MAX_SQRT_PRICE_X64.sub(entity_1.ONE);
                return clmm_1.Clmm.makeSwapBaseInInstructions({
                    poolInfo: _poolKey,
                    ownerInfo: {
                        wallet: ownerInfo.wallet,
                        tokenAccountA: _poolKey.mintA.mint.equals(inputMint) ? ownerInfo.sourceToken : ownerInfo.destinationToken,
                        tokenAccountB: _poolKey.mintA.mint.equals(inputMint) ? ownerInfo.destinationToken : ownerInfo.sourceToken,
                    },
                    inputMint,
                    amountIn: swapInfo.amountIn.amount.raw,
                    amountOutMin: swapInfo.minAmountOut.amount.raw.sub((_b = (_a = swapInfo.minAmountOut.fee) === null || _a === void 0 ? void 0 : _a.raw) !== null && _b !== void 0 ? _b : entity_1.ZERO),
                    sqrtPriceLimitX64,
                    remainingAccounts: swapInfo.remainingAccounts[0],
                });
            }
            else {
                const _poolKey = swapInfo.poolKey[0];
                return liquidity_1.Liquidity.makeSwapInstruction({
                    poolKeys: (0, common_1.jsonInfo2PoolKeys)(_poolKey),
                    userKeys: {
                        tokenAccountIn: ownerInfo.sourceToken,
                        tokenAccountOut: ownerInfo.destinationToken,
                        owner: ownerInfo.wallet,
                    },
                    amountIn: swapInfo.amountIn.amount.raw,
                    amountOut: swapInfo.minAmountOut.amount.raw.sub((_d = (_c = swapInfo.minAmountOut.fee) === null || _c === void 0 ? void 0 : _c.raw) !== null && _d !== void 0 ? _d : entity_1.ZERO),
                    fixedSide: 'in',
                });
            }
        }
        else if (swapInfo.routeType === 'route') {
            const poolKey1 = swapInfo.poolKey[0];
            const poolKey2 = swapInfo.poolKey[1];
            if (ownerInfo.routeToken === undefined)
                throw Error('owner route token account check error');
            return {
                address: {},
                innerTransaction: {
                    instructions: [
                        (0, instrument_1.routeInstruction)(routeProgram, ownerInfo.wallet, ownerInfo.sourceToken, ownerInfo.routeToken, ownerInfo.destinationToken, inputMint.toString(), swapInfo.middleToken.mint.toString(), poolKey1, poolKey2, swapInfo.amountIn.amount.raw, swapInfo.minAmountOut.amount.raw.sub((_f = (_e = swapInfo.minAmountOut.fee) === null || _e === void 0 ? void 0 : _e.raw) !== null && _f !== void 0 ? _f : entity_1.ZERO), swapInfo.remainingAccounts),
                    ],
                    signers: [],
                    lookupTableAddress: [
                        poolKey1.lookupTableAccount ? new web3_js_1.PublicKey(poolKey1.lookupTableAccount) : web3_js_1.PublicKey.default,
                        poolKey2.lookupTableAccount ? new web3_js_1.PublicKey(poolKey2.lookupTableAccount) : web3_js_1.PublicKey.default,
                    ],
                    instructionTypes: [base_1.InstructionType.routeSwap],
                },
            };
        }
        else {
            throw Error('route type error');
        }
    }
    static makeSwapInstructionSimple({ connection, swapInfo, ownerInfo, computeBudgetConfig, routeProgram, makeTxVersion, lookupTableCache, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const frontInstructions = [];
            const endInstructions = [];
            const frontInstructionsType = [];
            const endInstructionsType = [];
            const signers = [];
            const amountIn = swapInfo.amountIn;
            const amountOut = swapInfo.amountOut;
            const useSolBalance = !(amountIn.amount instanceof entity_1.TokenAmount);
            const outSolBalance = !(amountOut.amount instanceof entity_1.TokenAmount);
            const inputMint = amountIn.amount instanceof entity_1.TokenAmount ? amountIn.amount.token.mint : entity_1.Token.WSOL.mint;
            const inputProgramId = amountIn.amount instanceof entity_1.TokenAmount ? amountIn.amount.token.programId : entity_1.Token.WSOL.programId;
            const outputMint = amountOut.amount instanceof entity_1.TokenAmount ? amountOut.amount.token.mint : entity_1.Token.WSOL.mint;
            const outputProgramId = amountOut.amount instanceof entity_1.TokenAmount ? amountOut.amount.token.programId : entity_1.Token.WSOL.programId;
            const sourceToken = yield this._selectOrCreateTokenAccount({
                programId: inputProgramId,
                mint: inputMint,
                tokenAccounts: useSolBalance ? [] : ownerInfo.tokenAccounts,
                createInfo: useSolBalance
                    ? {
                        connection,
                        payer: ownerInfo.wallet,
                        amount: amountIn.amount.raw,
                        frontInstructions,
                        endInstructions,
                        signers,
                        frontInstructionsType,
                        endInstructionsType,
                    }
                    : undefined,
                owner: ownerInfo.wallet,
                associatedOnly: useSolBalance ? false : ownerInfo.associatedOnly,
                checkCreateATAOwner: ownerInfo.checkCreateATAOwner,
            });
            if (sourceToken === undefined) {
                throw Error('input account check error');
            }
            const destinationToken = yield this._selectOrCreateTokenAccount({
                programId: outputProgramId,
                mint: outputMint,
                tokenAccounts: ownerInfo.tokenAccounts,
                createInfo: {
                    connection,
                    payer: ownerInfo.wallet,
                    amount: 0,
                    frontInstructions,
                    endInstructions: outSolBalance ? endInstructions : undefined,
                    signers,
                    frontInstructionsType,
                    endInstructionsType,
                },
                owner: ownerInfo.wallet,
                associatedOnly: ownerInfo.associatedOnly,
                checkCreateATAOwner: ownerInfo.checkCreateATAOwner,
            });
            let routeToken = undefined;
            if (swapInfo.routeType === 'route') {
                const middleMint = swapInfo.middleToken;
                routeToken = yield this._selectOrCreateTokenAccount({
                    programId: middleMint.programId,
                    mint: middleMint.mint,
                    tokenAccounts: ownerInfo.tokenAccounts,
                    createInfo: {
                        connection,
                        payer: ownerInfo.wallet,
                        amount: 0,
                        frontInstructions,
                        endInstructions,
                        signers,
                        frontInstructionsType,
                        endInstructionsType,
                    },
                    owner: ownerInfo.wallet,
                    associatedOnly: false,
                    checkCreateATAOwner: ownerInfo.checkCreateATAOwner,
                });
            }
            const ins = this.makeSwapInstruction({
                routeProgram,
                inputMint,
                swapInfo,
                ownerInfo: {
                    wallet: ownerInfo.wallet,
                    sourceToken,
                    routeToken,
                    destinationToken,
                },
            });
            const transferIns = [];
            const transferInsType = [];
            if (swapInfo.feeConfig !== undefined) {
                transferIns.push((0, spl_token_1.createTransferInstruction)(sourceToken, swapInfo.feeConfig.feeAccount, ownerInfo.wallet, swapInfo.feeConfig.feeAmount.toNumber()));
                transferInsType.push(base_1.InstructionType.transferAmount);
            }
            const transferAddCheck = yield (0, common_1.splitTxAndSigners)({
                connection,
                makeTxVersion,
                computeBudgetConfig,
                payer: ownerInfo.wallet,
                innerTransaction: [
                    { instructionTypes: transferInsType, instructions: transferIns, signers: [] },
                    ins.innerTransaction,
                ],
                lookupTableCache,
            });
            return {
                address: ins.address,
                innerTransactions: yield (0, common_1.splitTxAndSigners)({
                    connection,
                    makeTxVersion,
                    computeBudgetConfig,
                    payer: ownerInfo.wallet,
                    innerTransaction: [
                        { instructionTypes: frontInstructionsType, instructions: frontInstructions, signers },
                        ...(transferAddCheck.length > 1
                            ? []
                            : [{ instructionTypes: transferInsType, instructions: transferIns, signers: [] }]),
                        ins.innerTransaction,
                        { instructionTypes: endInstructionsType, instructions: endInstructions, signers: [] },
                    ],
                    lookupTableCache,
                }),
            };
        });
    }
}
exports.TradeV2 = TradeV2;
//# sourceMappingURL=trade.js.map