"use strict";

const Core = require('./sme-main-core.js');

module.exports = function (RED) {	
    function validateMessage(msg) {
        if (!msg)
            throw new Error('Invalid message!');

        var type = typeof (msg);
        if (type === 'object')
            return msg;

        if (type === 'string' && msg.startsWith('{')) {
            try {
                return JSON.parse(msg);
            }
            catch{ }
        }

        return {
            Body: '' + msg,
        };
    }

    function SmeConnectorNode(config) {		
        RED.nodes.createNode(this, config);

        this.apiKeyType = config.apiKeyType;

        var server = (this.credentials && this.credentials.server) || "api.semilimes.net";
        var apiKey = RED.util.evaluateNodeProperty(this.credentials.apiKey, this.apiKeyType, this);
        
        var xAccount = this.credentials.xAccount;
        var connectorId = this.id;

        var serverApiURL = `https://${server}`;
        var serverWsURL = `wss://${server}/service/ws`;

        var core = new Core();

        var apiClient = new core.SmeApiClient(serverApiURL, apiKey, xAccount);
        var webSocket = new core.SmeWebSocket(serverWsURL, apiKey, xAccount);
        var apiRemoteClient = new core.SmeRemoteClient();

        var pjson = require('../package.json');

        webSocket.addStatusListener(status => {
            switch (status) {
                case 'connected': {
                    sendWebSocketMessage({
                        TypeID: 'A2A9468D-92AB-4176-B883-233FF53DDAFD',
                        Application: 'semilimes Messenger',
                        Platform: 'Node-RED',
                        Version: pjson.version,
                        Versions: {
                            NodeVersion: process.versions.node,
                            NodeREDVersion: RED.version()
                        },
                    });
                    break;
                }
                default: {
                    break;
                }
            }
        });

        var node = this;

        node.on('close', function (removed, done) {
            webSocket.close();
            done();
        });
		
        function sendWebSocketMessage(msg, logEnabled = false) {
            msg = validateMessage(msg);
            webSocket.send(msg, logEnabled);
        }

        function sendApiMessage(msg, logEnabled = false) {
            msg = validateMessage(msg);
            var endpoint = msg.endpoint || "NoEndpointSet";
            var method = msg.httpMethod || "NoHttpMethodSet";
            return apiClient.callApi(endpoint, method, msg, logEnabled);
        }

        function callApi(endpoint, method, data, logEnabled = false) {
            return apiClient.callApi(endpoint, method, data, logEnabled);
        }

        function remoteAppCallApi(endpoint, method, data, logEnabled = false) {
            return apiRemoteClient.callApi(endpoint, method, data, logEnabled);
        }

        function remoteAppInitiateCall(recipientId, groupChatId, cameraIds) {
            return apiRemoteClient.cameraInitiateCall(recipientId, groupChatId, cameraIds);
        }

        function addMessageListener(listener) {
            webSocket.addMessageListener(listener);
        }

        function removeMessageListener(listener) {
            webSocket.removeMessageListener(listener);
        }

        function addStatusListener(listener) {
            webSocket.addStatusListener(listener);
        }

        //  Export
        this.postMessage = sendWebSocketMessage;
        this.sendMessage = sendApiMessage;
        this.callApi = callApi;
        this.addMessageListener = addMessageListener;
        this.removeMessageListener = removeMessageListener;
        this.addStatusListener = addStatusListener;
        this.remoteAppInitiateCall = remoteAppInitiateCall;

        //Get my P2P Chats (Contacts)
        RED.httpAdmin.get(`/${connectorId}/sme/recipients`, function (req, res, next) {
            var endpoint = "/account/contacts";
            var httpMethod = "GET";
            var data = {
                parameters: {}
            };

            callApi(endpoint, httpMethod, data)
                .then(
                    value => {
                        res.json(value);
                    },
                    error => {
                        res.status(500).send(error);
                    }
                )
                .catch(error => {
                    res.status(500).send(error);
                })
        });

        //Get my groupChats
        RED.httpAdmin.get(`/${connectorId}/sme/groupChats`, function (req, res, next) {
            var endpoint = "/communication/groupChat";
            var httpMethod = "GET";
            var data = {
                parameters: {}
            };

            callApi(endpoint, httpMethod, data)
                .then(
                    value => {
                        res.json(value);
                    },
                    error => {
                        res.status(500).send(error);
                    }
                )
                .catch(error => {
                    res.status(500).send(error);
                })
        });

        //Get my channels
        RED.httpAdmin.get(`/${connectorId}/sme/channels`, function (req, res, next) {
            var endpoint = "/communication/channel/my";
            var httpMethod = "GET";
            var data = {
                parameters: {
                    owner: true,
                    editor: true,
                    subscriber: true
                }
            };

            callApi(endpoint, httpMethod, data)
                .then(
                    value => {
                        res.json(value);
                    },
                    error => {
                        console.log(error);
                        res.status(500).send(error);
                    }
                )
                .catch(error => {
                    res.status(500).send(error);
                })
        });

        //Get cameras list
        RED.httpAdmin.get(`/${connectorId}/sme-remote/cameras`, function (req, res, next) {
            var endpoint = "/api/cameras";
            var httpMethod = "GET";
            
            remoteAppCallApi(endpoint, httpMethod, null)
                .then(
                    value => {
                        res.json(value);
                    },
                    error => {
                        console.log(error);
                        res.status(500).send(error);
                    }
                )
                .catch(error => {
                    res.status(500).send(error);
                })
        });

        //Initiate camera call
        RED.httpAdmin.post(`/${connectorId}/sme-remote/cameras/initiatecall`, function (req, res, next) {
            var body = req.body;

            var endpoint = `/api/cameras/${body.cameraId}/initiatecall`;
            var httpMethod = "POST";

            var data = {
                "groupChatId": body.groupChatId,
                "cameraIds": body.cameraIds
            };
            
            remoteAppCallApi(endpoint, httpMethod, null)
                .then(
                    value => {
                        res.json(value);
                    },
                    error => {
                        console.log(error);
                        res.status(500).send(error);
                    }
                )
                .catch(error => {
                    res.status(500).send(error);
                })
        });
    };
	
    RED.nodes.registerType("sme-main-connector", SmeConnectorNode, {
        credentials: {
            server: { type: "text" },
            apiKey: { type: "text" },
            xAccount: { type: "text" }
        }
    });
};