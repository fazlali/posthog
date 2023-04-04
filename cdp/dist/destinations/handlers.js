/**
 * @file Handlers for destination resources
 * @module destinations/handlers
 * @see module:destinations
 *
 * This file is responsible for handling the destination API. It provides
 * handlers for creating, updating, and deleting destinations, as well as
 * listing destinations.
 *
 * Note that we do not delete destinations, but instead mark them as deleted. This
 * is to ensure that we can keep a history of destinations that have been used
 * in the past.
 *
 */ function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) {
        resolve(value);
    } else {
        Promise.resolve(value).then(_next, _throw);
    }
}
function _async_to_generator(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(undefined);
        });
    };
}
var __generator = this && this.__generator || function(thisArg, body) {
    var f, y, t, g, _ = {
        label: 0,
        sent: function() {
            if (t[0] & 1) throw t[1];
            return t[1];
        },
        trys: [],
        ops: []
    };
    return(g = {
        next: verb(0),
        "throw": verb(1),
        "return": verb(2)
    }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
    }), g);
    function verb(n) {
        return function(v) {
            return step([
                n,
                v
            ]);
        };
    }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while(_)try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [
                op[0] & 2,
                t.value
            ];
            switch(op[0]){
                case 0:
                case 1:
                    t = op;
                    break;
                case 4:
                    _.label++;
                    return {
                        value: op[1],
                        done: false
                    };
                case 5:
                    _.label++;
                    y = op[1];
                    op = [
                        0
                    ];
                    continue;
                case 7:
                    op = _.ops.pop();
                    _.trys.pop();
                    continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                        _ = 0;
                        continue;
                    }
                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                        _.label = op[1];
                        break;
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                        _.label = t[1];
                        t = op;
                        break;
                    }
                    if (t && _.label < t[2]) {
                        _.label = t[2];
                        _.ops.push(op);
                        break;
                    }
                    if (t[2]) _.ops.pop();
                    _.trys.pop();
                    continue;
            }
            op = body.call(thisArg, _);
        } catch (e) {
            op = [
                6,
                e
            ];
            y = 0;
        } finally{
            f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return {
            value: op[0] ? op[1] : void 0,
            done: true
        };
    }
};
import { randomUUID } from "crypto";
export var createDestinationHandler = function(database) {
    return function() {
        var _ref = _async_to_generator(function(ctx) {
            var destination, identifier, result;
            return __generator(this, function(_state) {
                switch(_state.label){
                    case 0:
                        destination = ctx.request.toJSON();
                        identifier = randomUUID();
                        return [
                            4,
                            database.query("INSERT INTO destinations (identifier, name, description, type, config) VALUES ($1, $2, $3, $4, $5) RETURNING *", [
                                identifier,
                                destination.name,
                                destination.description,
                                destination.type,
                                destination.config
                            ])
                        ];
                    case 1:
                        result = _state.sent();
                        ctx.status = 201;
                        ctx.body = result.rows[0];
                        return [
                            2
                        ];
                }
            });
        });
        return function(ctx) {
            return _ref.apply(this, arguments);
        };
    }();
};
export var updateDestinationHandler = function(database) {
    return function() {
        var _ref = _async_to_generator(function(ctx) {
            var destination, identifier, result;
            return __generator(this, function(_state) {
                switch(_state.label){
                    case 0:
                        destination = ctx.request.toJSON();
                        identifier = ctx.params.destinationId;
                        return [
                            4,
                            database.query("UPDATE destinations SET name = $1, description = $2, type = $3, config = $4 WHERE identifier = $5 AND is_deleted = false RETURNING *", [
                                destination.name,
                                destination.description,
                                destination.type,
                                destination.config,
                                identifier
                            ])
                        ];
                    case 1:
                        result = _state.sent();
                        if (result.rowCount === 0) {
                            ctx.status = 404;
                            return [
                                2
                            ];
                        }
                        ctx.status = 200;
                        return [
                            2
                        ];
                }
            });
        });
        return function(ctx) {
            return _ref.apply(this, arguments);
        };
    }();
};
export var deleteDestinationHandler = function(database) {
    return function() {
        var _ref = _async_to_generator(function(ctx) {
            var identifier;
            return __generator(this, function(_state) {
                switch(_state.label){
                    case 0:
                        identifier = ctx.params.destinationId;
                        return [
                            4,
                            database.query("UPDATE destinations SET is_deleted = true WHERE identifier = $1", [
                                identifier
                            ])
                        ];
                    case 1:
                        _state.sent();
                        ctx.status = 204;
                        return [
                            2
                        ];
                }
            });
        });
        return function(ctx) {
            return _ref.apply(this, arguments);
        };
    }();
};
