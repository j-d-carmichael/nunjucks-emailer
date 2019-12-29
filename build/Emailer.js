"use strict";
exports.__esModule = true;
var tslib_1 = require("tslib");
var path = require("path");
var fs_1 = tslib_1.__importDefault(require("fs"));
var mail_1 = tslib_1.__importDefault(require("@sendgrid/mail"));
var nunjucks_1 = tslib_1.__importDefault(require("nunjucks"));
var EmailerSendTypes_1 = require("./enums/EmailerSendTypes");
var Emailer = /** @class */ (function () {
    function Emailer() {
    }
    Emailer.prototype.send = function (to, from, subject, tplObject, tplRelativePath) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var messageObject, _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.hasBeenInitialized()) {
                            throw new Error('You must first call EmailerSetup before using the Emailer class.');
                        }
                        _a = {
                            from: from
                        };
                        return [4 /*yield*/, this.renderTemplate(path.join(global.OPENAPI_NODEGEN_EMAILER_TEMPLATE_PATH, tplRelativePath + '.html.njk'), tplObject)];
                    case 1:
                        _a.html = _b.sent(),
                            _a.subject = subject;
                        return [4 /*yield*/, this.renderTemplate(path.join(global.OPENAPI_NODEGEN_EMAILER_TEMPLATE_PATH, tplRelativePath + '.txt.njk'), tplObject)];
                    case 2:
                        messageObject = (_a.text = _b.sent(),
                            _a.to = to,
                            _a.tplObject = tplObject,
                            _a.tplRelativePath = tplRelativePath,
                            _a);
                        return [4 /*yield*/, this.sendTo(messageObject)];
                    case 3: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    Emailer.prototype.hasBeenInitialized = function () {
        return !(global.OPENAPI_NODEGEN_EMAILER_TEMPLATE_PATH === undefined
            || global.OPENAPI_NODEGEN_EMAILER_SEND_TYPE === undefined
            || global.OPENAPI_NODEGEN_EMAILER_LOG_PATH === undefined);
    };
    Emailer.prototype.calculateLogFilePath = function (tplRelPath) {
        return path.join(global.OPENAPI_NODEGEN_EMAILER_LOG_PATH, tplRelPath + new Date().getTime() + '.json');
    };
    Emailer.prototype.renderTemplate = function (fullTemplatePath, templateObject) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        fs_1["default"].readFile(fullTemplatePath, 'utf8', function (err, data) {
                            if (err) {
                                return reject(err);
                            }
                            resolve(nunjucks_1["default"].renderString(data, templateObject));
                        });
                    })];
            });
        });
    };
    Emailer.prototype.sendTo = function (sendObject) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        switch (global.OPENAPI_NODEGEN_EMAILER_SEND_TYPE) {
                            case EmailerSendTypes_1.EmailerSendTypes.sendgrid:
                                mail_1["default"].setApiKey(process.env.SENDGRID_API_KEY);
                                return resolve(mail_1["default"].send(sendObject));
                            case EmailerSendTypes_1.EmailerSendTypes.file:
                                var filePath_1 = _this.calculateLogFilePath(sendObject.tplRelativePath);
                                fs_1["default"].writeFile(filePath_1, JSON.stringify(sendObject), 'utf8', function () {
                                    return resolve(filePath_1);
                                });
                                break;
                            case EmailerSendTypes_1.EmailerSendTypes["return"]:
                                return resolve(sendObject);
                            case EmailerSendTypes_1.EmailerSendTypes.log:
                                console.log(sendObject);
                                return resolve('');
                        }
                    })];
            });
        });
    };
    return Emailer;
}());
exports["default"] = new Emailer();