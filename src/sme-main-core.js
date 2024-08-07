"use strict";

const { clear } = require('console');
const { publicDecrypt } = require('crypto');
const { send } = require('process');
const { debug } = require('util');
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');
const mime = require('mime-types');

module.exports = function (RED) {
    const https = require('https');
    const EventEmitter = require('events');
    const WebSocket = require('ws');

    function getTimestamp() {
        return new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(new Date()).replace(',',''); 
    }

    //--------------------SmeHelper-----------------------------------
    function SmeHelper() {
        const SME_BAG_NAME = '_sme';
        const SME_SENDING_BOX_NAME = 'sendingMsgs';
        const SME_RECEIVED_MSG_NAME = 'receivedMsg';
        const SME_RESPONSE_BOX_NAME = 'responseMsgs';
        const SME_DELIVERY_OPTION_NAME = 'DeliveryOption';
        const SME_DELIVERY_OPTION_TO_OBJECT_NAME = 'ToObject';

        function getSmeBag(nodeRedMsg) {
            if (!nodeRedMsg)
                return null;

            var smeBag = nodeRedMsg[SME_BAG_NAME];
            if (smeBag == null)
                smeBag = nodeRedMsg[SME_BAG_NAME] = {};
            return smeBag;
        }

        function setReceivedMsg(nodeRedMsg, smeMsg) {
            if (nodeRedMsg && smeMsg) {
                var smeBag = getSmeBag(nodeRedMsg);
                if (smeBag) {
                    smeBag[SME_RECEIVED_MSG_NAME] = smeMsg;
                    return smeMsg;
                }
            }

            return null;
        }

        function getReceivedMsg(nodeRedMsg) {
            if (!nodeRedMsg)
                return null;

            var smeBag = getSmeBag(nodeRedMsg);
            return smeBag[SME_RECEIVED_MSG_NAME];
        }

        function getSendingBox(nodeRedMsg) {
            if (!nodeRedMsg)
                return null;

            var smeBag = getSmeBag(nodeRedMsg);
            var smeSendingMsgs = smeBag[SME_SENDING_BOX_NAME];
            if (smeSendingMsgs == null)
                smeSendingMsgs = smeBag[SME_SENDING_BOX_NAME] = [];
            return smeSendingMsgs;
        }

        function getResponseBox(nodeRedMsg) {
            if (!nodeRedMsg)
                return null;

            var smeBag = getSmeBag(nodeRedMsg);
            var smeResponseMsgs = smeBag[SME_RESPONSE_BOX_NAME];
            if (smeResponseMsgs == null)
                smeResponseMsgs = smeBag[SME_RESPONSE_BOX_NAME] = [];
            return smeResponseMsgs;
        }

        function addSendingMsg(nodeRedMsg, smeMsg) {
            if (nodeRedMsg && smeMsg) {
                var smeSendingMsgs = getSendingBox(nodeRedMsg);
                if (smeSendingMsgs)
                    smeSendingMsgs.push(smeMsg);

                return smeMsg;
            }

            return null;
        }

        function addResponseMsg(nodeRedMsg, smeMsg) {
            if (nodeRedMsg && smeMsg) {
                var smeResponseMsgs = getResponseBox(nodeRedMsg);
                if (smeResponseMsgs)
                    smeResponseMsgs.push(smeMsg);

                return smeMsg;
            }

            return null;
        }

        function clearSendingBox(nodeRedMsg) {
            if (nodeRedMsg) {
                var smeBag = getSmeBag(nodeRedMsg);
                delete smeBag[SME_SENDING_BOX_NAME];
            }
        }

        function clearResponseBox(nodeRedMsg) {
            if (nodeRedMsg) {
                var smeBag = getSmeBag(nodeRedMsg);
                delete smeBag[SME_RESPONSE_BOX_NAME];
            }
        }

        function getOrCreateNewSendingFormMessage(nodeRedMsg) {
            if (nodeRedMsg == null)
                return null;

            var smeSendingMsgs = getSendingBox(nodeRedMsg);

            var lastMsg = smeSendingMsgs.length == 0 ? null : smeSendingMsgs[smeSendingMsgs.length - 1];
            var isLastMsgForm = lastMsg && lastMsg.dataComponent && lastMsg.dataComponent.dataComponentType == "form";

            var smeFormMsg = null;
            if (isLastMsgForm)
                smeFormMsg = lastMsg;
            else {
                smeFormMsg = {
                    dataComponent: {
                        dataComponentType: "form",
                        submitEnabled: true,
                        submitText: "Submit",
                        formComponents: []
                    }
                };
                smeSendingMsgs.push(smeFormMsg);
            }

            return smeFormMsg;
        }

        function getNodeConfigValue(node, msg, selectionType, selectionValue) {
            
            if (selectionType && selectionValue !== undefined) {
                //Function to make nested properties work in UI
                const leaf = (obj, path) => {
                    if (path.startsWith('.')) {
                        path = path.substring(1);
                    }
                    return path.length > 0
                            ? (path.split('.').reduce((value,el) => value && value[el], obj)) 
                            : obj;
                }
                var firstProperty = String(selectionValue).split('.')[0];
                var searchPath = String(selectionValue).replace(`${firstProperty}`, '');

                switch (selectionType) {
                    case 'str': return selectionValue;
                    case 'num': return parseInt(selectionValue);
                    case 'bool': return isTrue(selectionValue);
                    case 'json': return JSON.parse(selectionValue);
                    //case 'msg': return msg[selectionValue];
                    case 'msg': return leaf(msg[firstProperty], searchPath);
                    //case 'flow': return node && node.context().flow.get(selectionValue);
                    case 'flow': return node && leaf(node.context().flow.get(firstProperty), searchPath);
                    //case 'global': return node && node.context().global.get(selectionValue);
                    case 'global': return node && leaf(node.context().global.get(firstProperty), searchPath);
                }
            }

            return null;
        }

        function getMsgDeliveryOption(smeMsg) {
            if (!smeMsg)
                return null;

            var deliveryOption = smeMsg[SME_DELIVERY_OPTION_NAME];
            if (deliveryOption == null)
                deliveryOption = smeMsg[SME_DELIVERY_OPTION_NAME] = {};
            return deliveryOption;
        }

        function getMsgDeliveryOptionToObject(smeMsg) {
            var deliveryOption = getMsgDeliveryOption(smeMsg);
            if (!deliveryOption)
                return null;

            var toObject = deliveryOption[SME_DELIVERY_OPTION_TO_OBJECT_NAME];
            if (toObject == null)
                toObject = deliveryOption[SME_DELIVERY_OPTION_TO_OBJECT_NAME] = {};
            return toObject;
        }

        function isTrue(obj) {
            if (obj == null)
                return false;
            if (obj === true)
                return true;
            if (isNaN(obj))
                return ['TRUE', 'YES'].indexOf(('' + obj).toUpperCase()) >= 0;
            return obj > 0;
        }

        function isFalse(obj) {
            return !isTrue(obj);
        }

        //  Export
        this.getSmeBag = getSmeBag;
        this.setReceivedMsg = setReceivedMsg;
        this.getReceivedMsg = getReceivedMsg;
        this.addSendingMsg = addSendingMsg;
        this.getSendingBox = getSendingBox;
        this.clearSendingBox = clearSendingBox;
        this.getResponseBox = getResponseBox;
        this.addResponseMsg = addResponseMsg;
        this.clearResponseBox = clearResponseBox;
        this.getOrAddSendingFormMsg = getOrCreateNewSendingFormMessage;
        this.getNodeConfigValue = getNodeConfigValue;
        this.getMsgDeliveryOption = getMsgDeliveryOption;
        this.getMsgDeliveryOptionToObject = getMsgDeliveryOptionToObject;
        this.isTrue = isTrue;
        this.isFalse = isFalse;
    }

    //--------------------SmeWebSocket-----------------------------------
    function SmeWebSocket(serverWsURL, apiKey, xAccount) {

        var buffer = [];
        var webSocket = null;
        var requestedToClose = false;
        var reconnectTimer = null;
        var messageDeliver = new EventEmitter();

        function connect() {
            disconnect();
            requestedToClose = false;

            var isNoProxyPath = false;
            var envProxy = process.env.HTTP_PROXY || process.env.http_proxy;
            var envNoproxies = (process.env.NO_PROXY || process.env.no_proxy || "").split(",");
            if (envNoproxies) {
                for (var i in envNoproxies) {
                    if (serverWsURL.indexOf(envNoproxies[i].trim()) !== -1) {
                        isNoProxyPath = true;
                        break;
                    }
                }
            }

            var proxyAgent = null;
            if (envProxy && isNoProxyPath == false) {
                proxyAgent = new HttpsProxyAgent(prox);
            }

            var options = {
                perMessageDeflate: false,
                rejectUnauthorized: false,
                headers: {
                    'X-Account': `${xAccount ?? "UNSET"}`,
                    Authorization: `Bearer ${apiKey ?? "UNSET"}`
                }
            };

            if (apiKey) {
                options.headers.Authorization = `Bearer ${apiKey}`;
            }
            if (xAccount) {
                options.headers['X-Account'] = `${xAccount}`;
            }

            if (proxyAgent) {
                options.agent = proxyAgent;
            }

            console.log(`${getTimestamp()} - Connecting to ${serverWsURL}... `);
            
            
            
            webSocket = new WebSocket(serverWsURL, options);
            webSocket.setMaxListeners(0);
            messageDeliver.emit('status', 'connecting...');
            handleConnection(webSocket);
        }

        function disconnect() {
            requestedToClose = true;
            if (webSocket) {
                webSocket.close();
                webSocket = null;
            }
        }

        function reconnect() {
            if (requestedToClose != true) {
                clearTimeout(reconnectTimer);
                reconnectTimer = setTimeout(function () { connect(); }, 5000); // try to reconnect every 5 secs... bit fast ?
            }
        }

        function handleConnection(socket) {
            socket.on('open', function () {
                console.log(`${getTimestamp()} - ws opened!`);
                messageDeliver.emit('status', 'connected');

                if (buffer.length > 0) {
                    for (var i = 0; i < buffer.length; i++)
                        socket.send(buffer[i]);
                    buffer.length = 0;
                }
            });

            socket.on('close', function () {
                console.log(`${getTimestamp()} - ws closed!`);
                messageDeliver.emit('status', 'disconnected');
                reconnect();
            });

            socket.on('message', function (msg, flags) {
                msg = msg.toString();
                if (msg.startsWith('{')) {
                    try {
                        msg = JSON.parse(msg);
                    }
                    catch { }
                }
                messageDeliver.emit('message', msg);
            });

            socket.on('error', function (err) {
                console.error(`${getTimestamp()} - ws error! ${err}`);
                reconnect();
            });
        }

        function send(msg, logEnabled = false) {
            if (msg) {
                if (typeof (msg) === 'object')
                    msg = JSON.stringify(msg);

                if (webSocket && webSocket.readyState == 1)
                    webSocket.send(msg);
                else {
                    buffer.push(msg);
                    if (logEnabled) console.log(`${getTimestamp()} - buffered: `, msg);
                }
            }
        }

        function addMessageListener(listener) {
            messageDeliver.addListener('message', listener);
        }

        function removeMessageListener(listener) {
            messageDeliver.removeListener('message', listener);
        }

        function addStatusListener(listener) {
            messageDeliver.addListener('status', listener);
        }

        //  Export
        this.send = send;
        this.close = disconnect;
        this.addMessageListener = addMessageListener;
        this.removeMessageListener = removeMessageListener;
        this.addStatusListener = addStatusListener;

        if (serverWsURL)
            connect();
    };

    function SmeApiClient(serverApiURL, apiKey, xAccount) {

        function callApi(endpoint, method, data, logEnabled = false) {
            //Upload file
            if (endpoint == "/service/file/upload") {

                return new Promise((resolve, reject) => {
                    
                    let formdata = new FormData();
                    formdata.append('httpFiles', fs.createReadStream(`${data.filePath}`));

                    let config = {
                        method: method,
                        maxBodyLength: Infinity,
                        url: `${serverApiURL}${endpoint}`,
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            ...formdata.getHeaders()
                        },
                        data : formdata
                    };

                    axios.request(config)
                        .then((response) => {
                            if(logEnabled) console.log(`${getTimestamp()} - ${JSON.stringify(response.data)}`);
                            resolve(response.data);
                        })
                        .catch((error) => {
                            console.error(`${getTimestamp()} - Error when calling uploader API: `, error);
                            reject(error);
                        })
                });
            //Download file
            } else if (endpoint == "/service/file/download") {

                return new Promise((resolve, reject) => {
                    if (!data || !data.filePath || !data.fileId) {
                        reject("Data is empty!");
                    }
                    
                    //const writer = fs.createWriteStream(data.filePath);

                    var localData = data && JSON.parse(JSON.stringify(data));
                    delete localData.filePath;

                    let config = {
                        method: method,
                        url: `${serverApiURL}${endpoint}`,
                        responseType: 'stream',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                        },
                        data : localData
                    };

                    axios.request(config)
                        .then((response) => {
                            const contentType = response.headers['content-type'];
                            const mimeExtension = mime.extension(contentType);
                            const fileExtension = mimeExtension ? "."+mimeExtension : "";
                            const writer = fs.createWriteStream(`${data.filePath}${fileExtension}`);
                            response.data.pipe(writer);
                            let error = null;
                            
                            writer.on('error', err => {
                                error = err;
                                writer.close();
                                console.error('Error when writing downloaded file: ', error);
                                reject(err);
                            });
                            
                            writer.on('close', () => {
                                if (!error) {
                                    //console.log('Successfully downloaded file in: ', data.filePath+fileExtension);
                                    resolve(data.filePath+fileExtension);
                                }
                            });
                        })
                        .catch((error) => {
                            console.error('Error when calling downloader API: ', error);
                            reject(error);
                        })
                });

            } 
            else {
                //Message endpoints
                return new Promise((resolve, reject) => {
                    var body = data.body && JSON.stringify(data.body);
                    var query = '';
                    if (data.parameters) {
                        query += '?';
                        Object.entries(data.parameters).forEach((parameter, index) => {
                            const [key, value] = parameter;
                            query += key + '=' + value;
                            if (index < Object.keys(data.parameters).length - 1) {
                                query += '&';
                            }
                        });
                    }
    
                    var baseUrl = new URL(serverApiURL);
                    
                    var options = {
                        hostname: baseUrl.hostname,
                        port: 443,
                        path: `${baseUrl.pathname == "/" ? "" : baseUrl.pathname}${endpoint}${query}`,
                        method: method,
                        rejectUnauthorized: false,
                        headers: {
                            'Content-Type': 'application/json; charset=UTF-8',
                            'Content-Length': (body && Buffer.byteLength(body, 'utf-8')) || 0
                        },
                        timeout: 5000
                    };
                    if (apiKey) {
                        //Authorize
                        options.headers.Authorization = `Bearer ${apiKey}`;
                    }
                    if (xAccount) {
                        //dev mode
                        options.headers['X-Account'] = `${xAccount}`;
                    }
                    
                    if (logEnabled && 
                        options.headers.Authorization && 
                        options.headers.Authorization.length > 20) {
                        var optionsMasked = JSON.parse(JSON.stringify(options));
                        var authText = optionsMasked.headers.Authorization;
                        var firstChunk = authText.substring(0,12);
                        var lastChunk = authText.substring(authText.length - 5, authText.length);
                        var authMasked = `${firstChunk}*****${lastChunk}`;
                        optionsMasked.headers.Authorization = authMasked;
                        console.log(`${getTimestamp()} - Attempt to send call to:`, optionsMasked);
                        console.log('With data: ', body);
                    }                  
    
                    var req = https.request(options, (res) => {
                        if(logEnabled) console.log(`${getTimestamp()} - Status Code: `, res.statusCode);
                        let totalBuffer = "";
                        res.on('data', (buffer) => {
                            totalBuffer += buffer.toString("utf8");
                        });
                        
                        res.on('end', () => {
                            if (typeof (totalBuffer) == 'string' && totalBuffer.startsWith('{')) {
                                try {
                                    var jsonData = JSON.parse(totalBuffer);
                                    if (jsonData) {
                                        if(logEnabled) console.log(`${getTimestamp()} - Call API resolved a JSON: `, jsonData);
                                        resolve(jsonData);
                                        return;
                                    } else {
                                        if(logEnabled) console.log(`${getTimestamp()} - Response raw data: `, totalBuffer);
                                    }
                                }
                                catch (ex) {
                                    console.error(`${getTimestamp()} - Error parsing API JSON result: `, ex);
                                }
                            }
                            if(logEnabled) console.log(`${getTimestamp()} - Call API resolved: `, totalBuffer);
                            resolve(totalBuffer);
                        });
                    });
    
                    // use its "timeout" event to abort the request
                    req.on('timeout', () => {
                        console.error(`${getTimestamp()} - API call timeout. Call aborted.`)
                        req.destroy();
                    });
    
                    req.on('error', (e) => {
                        console.error(`${getTimestamp()} - Call API rejected: `, e);
                        reject(e);
                    });
    
                    if (body) {
                        req.write(body);
                    }
    
                    req.end();
                });
            }

        };

        //  Export.
        this.callApi = callApi;
    };

    function SmeRemoteClient() {
        function callApi(endpoint, method, data, logEnabled = false) {
            return new Promise((resolve, reject) => {
                let reqConfig = {
                    method,
                    url: `${process.env.SME_REMOTE_URL}${endpoint}`,
                    headers: {
                        'Authorization': `Bearer ${process.env.SME_REMOTE_API_KEY}`,
                    },
                    data
                }

                console.log("Trying to make sme remote request: ", reqConfig)

                axios.request(reqConfig)
                .then((response) => {
                    resolve(response.data);
                })
                .catch((error) => {
                    reject(error)
                });
            })
        }
            
        function cameraInitiateCall(recipientId, groupChatId, cameraIds) {
            var endpoint = `/api/cameras/initiatecall`;
            var httpMethod = "POST";

            var data = {
                "recipientId": recipientId,
                "groupChatId": groupChatId,
                "cameraIds": cameraIds
            };
            
            this.callApi(endpoint, httpMethod, data);
        }

        this.callApi = callApi;
        this.cameraInitiateCall = cameraInitiateCall;
    }

    return {
        SmeHelper: SmeHelper,
        SmeApiClient: SmeApiClient,
        SmeWebSocket: SmeWebSocket,
        SmeRemoteClient: SmeRemoteClient
    };
}