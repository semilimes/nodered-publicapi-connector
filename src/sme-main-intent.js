"use strict";

const Core = require('./sme-main-core.js');
const crypto = require('crypto');

module.exports = function (RED) {

    function SmeIntentNode(config) {
        RED.nodes.createNode(this, config);

        var smeConnector = config.connector && RED.nodes.getNode(config.connector);
        if (!smeConnector)
            return;

        this.name = config.name;
        this.autoName = config.autoName;
        this.actionName = config.actionName;
        this.actionText = config.actionText;

        this.recipientId = config.recipientId;
        this.recipientIdType = config.recipientIdType;

        this.messageId = config.messageId;
        this.messageIdType = config.messageIdType;

        this.limit = config.limit;
        this.limitType = config.limitType;

        this.title = config.title;
        this.titleType = config.titleType;

        this.recipientIds = config.recipientIds;
        this.recipientIdsType = config.recipientIdsType;

        this.groupChatId = config.groupChatId;
        this.groupChatIdType = config.groupChatIdType;

        this.channelId = config.channelId;
        this.channelIdType = config.channelIdType;

        this.messageId = config.messageId;
        this.messageIdType = config.messageIdType;

        var node = this;

        function getNewRequestId () {
            return crypto.randomUUID();
        }

        //Get my P2P Chats (Contacts)
        RED.httpAdmin.get('/sme/recipients', function(req,res,next)
        {
            var connector = smeConnector;
            node.log("Node connector: " + smeConnector);
            var endpoint = "/account/contacts";
            var httpMethod = "GET";
            var data = {
                parameters: {}
            };

            connector.callApi(endpoint, httpMethod, data)
            .then(
                value => {
                    res.json(value);
                },
                error => {
                    res.sendStatus(500).send(error);
                }
            )
            .catch(error => {
                res.sendStatus(500).send(error);
            }) 
        });

        //Get my groupChats
        RED.httpAdmin.get('/sme/groupChats', function(req,res,next)
        {
            var connector = smeConnector;
            node.log("Node connector: " + smeConnector);
            var endpoint = "/communication/groupChat";
            var httpMethod = "GET";
            var data = {
                parameters: {}
            };

            connector.callApi(endpoint, httpMethod, data)
            .then(
                value => {
                    res.json(value);
                },
                error => {
                    res.sendStatus(500).send(error);
                }
            )
            .catch(error => {
                res.sendStatus(500).send(error);
            }) 
        });

        //Get my channels
        RED.httpAdmin.get('/sme/channels', function(req,res,next)
        {
            var connector = smeConnector;
            node.log("Node connector: " + smeConnector);
            var endpoint = "/communication/channel/my";
            var httpMethod = "GET";
            var data = {
                parameters: {
                    owner: true,
                    editor: true,
                    subscriber: true
                }
            };

            connector.callApi(endpoint, httpMethod, data)
            .then(
                value => {
                    res.json(value);
                },
                error => {
                    res.sendStatus(500).send(error);
                }
            )
            .catch(error => {
                res.sendStatus(500).send(error);
            }) 
        });

        node.on('input', function (msg, send, done) {
            send = send || function () { node.send.apply(node, arguments) };

            var core = new Core();
            var smeHelper = new core.SmeHelper();
            var smeSendingBox = smeHelper.getSendingBox(msg);

            switch (node.actionName) {
                case 'account_contacts': {
                    smeHelper.clearSendingBox(msg);
                    var request = {
                        requestId: getNewRequestId(),
                        endpoint: "/account/contacts",
                        httpMethod: "GET" 
                    };
                    smeHelper.addSendingMsg(msg, request);
                    break;
                }
                case 'p2p': {
                    smeHelper.clearSendingBox(msg);
                    var request = {
                        requestId: getNewRequestId(),
                        endpoint: "/communication/p2p",
                        httpMethod: "GET" 
                    };
                    smeHelper.addSendingMsg(msg, request);
                    break;
                }
                case 'p2p_message': {
                    smeHelper.clearSendingBox(msg);
                    var request = {
                        requestId: getNewRequestId(),
                        endpoint: "/communication/p2p/message",
                        httpMethod: "GET",
                        parameters: {}
                    };
                    var recipientIdValue = smeHelper.getNodeConfigValue(node, msg, node.recipientIdType, node.recipientId);
                    var messageIdValue = smeHelper.getNodeConfigValue(node, msg, node.messageIdType, node.messageId);
                    var limitValue = smeHelper.getNodeConfigValue(node, msg, node.limitType, node.limit);
                    if (recipientIdValue) request.parameters.recipientId = recipientIdValue;
                    if (messageIdValue) request.parameters.messageId = messageIdValue;
                    if (limitValue) request.parameters.limit = limitValue;
                    smeHelper.addSendingMsg(msg, request);
                    break;
                }
                case 'p2p_message_send': {
                    if (smeSendingBox) {
                        var recipientIdValue = smeHelper.getNodeConfigValue(node, msg, node.recipientIdType, node.recipientId);
                        smeSendingBox.forEach(smeMsg => {
                            smeMsg.requestId = getNewRequestId();
                            smeMsg.endpoint = "/communication/p2p/message/send";
                            smeMsg.httpMethod = "POST";
                            smeMsg.body = {
                                recipientId: recipientIdValue,
                                dataComponent: smeMsg.dataComponent
                            };
                            delete smeMsg.dataComponent;
                        });
                    }
                    break;
                }
                case 'p2p_message_update': {
                    if (smeSendingBox) {
                        var messageIdValue = smeHelper.getNodeConfigValue(node, msg, node.messageIdType, node.messageId);
                        smeSendingBox.forEach(smeMsg => {
                            smeMsg.requestId = getNewRequestId();
                            smeMsg.endpoint = "/communication/p2p/message/update";
                            smeMsg.httpMethod = "POST";
                            smeMsg.body = {
                                messageId: messageIdValue,
                                dataComponent: smeMsg.dataComponent
                            };
                            delete smeMsg.dataComponent;
                        });
                    }
                    break;
                }
                case 'groupchat' : {
                    smeHelper.clearSendingBox(msg);
                    var request = {
                        requestId: getNewRequestId(),
                        endpoint: "/communication/groupchat",
                        httpMethod: "POST",
                        body: {}
                    };
                    var recipientIdsValue = smeHelper.getNodeConfigValue(node, msg, node.recipientIdsType, node.recipientIds);
                    if (recipientIdsValue) {
                        request.body.recipientIds = [];
                        const rArray = recipientIdsValue.split(',');
                        rArray.forEach(r => {
                            request.body.recipientIds.push(r);
                        });
                    }
                    smeHelper.addSendingMsg(msg, request);
                    break;
                }
                case 'groupchat_create': {
                    smeHelper.clearSendingBox(msg);
                    var request = {
                        requestId: getNewRequestId(),
                        endpoint: "/communication/groupchat/create",
                        httpMethod: "POST",
                        body: {
                            title: smeHelper.getNodeConfigValue(node, msg, node.titleType, node.title)
                        }
                    };
                    var recipientIdsValue = smeHelper.getNodeConfigValue(node, msg, node.recipientIdsType, node.recipientIds);
                    if (recipientIdsValue) {
                        request.body.recipientIds = [];
                        const rArray = recipientIdsValue.split(',');
                        rArray.forEach(r => {
                            request.body.recipientIds.push(r);
                        });
                    }
                    smeHelper.addSendingMsg(msg, request);
                    break;
                }
                case 'groupchat_message' : {
                    smeHelper.clearSendingBox(msg);
                    var request = {
                        requestId: getNewRequestId(),
                        endpoint: "/communication/groupchat/message",
                        httpMethod: "GET",
                        parameters: {}
                    };
                    var groupChatIdValue = smeHelper.getNodeConfigValue(node, msg, node.groupChatIdType, node.groupChatId);
                    var messageIdValue = smeHelper.getNodeConfigValue(node, msg, node.messageIdType, node.messageId);
                    var limitValue = smeHelper.getNodeConfigValue(node, msg, node.limitType, node.limit);
                    if (groupChatIdValue) request.parameters.groupChatId = groupChatIdValue;
                    if (messageIdValue) request.parameters.messageId = messageIdValue;
                    if (limitValue) request.parameters.limit = limitValue;
                    smeHelper.addSendingMsg(msg, request);
                    break;
                }
                case 'groupchat_message_send': {
                    if (smeSendingBox) {
                        var groupChatIdValue = smeHelper.getNodeConfigValue(node, msg, node.groupChatIdType, node.groupChatId);
                        smeSendingBox.forEach(smeMsg => {
                            smeMsg.requestId = getNewRequestId();
                            smeMsg.endpoint = "/communication/groupchat/message/send";
                            smeMsg.httpMethod = "POST";
                            smeMsg.body = {
                                groupChatId: groupChatIdValue,
                                dataComponent: smeMsg.dataComponent
                            };
                            delete smeMsg.dataComponent;
                        });
                    }
                    break;
                }
                case 'groupchat_message_update': {
                    if (smeSendingBox) {
                        var messageIdValue = smeHelper.getNodeConfigValue(node, msg, node.messageIdType, node.messageId);
                        smeSendingBox.forEach(smeMsg => {
                            smeMsg.requestId = getNewRequestId();
                            smeMsg.endpoint = "/communication/groupchat/message/update";
                            smeMsg.httpMethod = "POST";
                            smeMsg.body = {
                                messageId: messageIdValue,
                                dataComponent: smeMsg.dataComponent
                            };
                            delete smeMsg.dataComponent;
                        });
                    }
                    break;
                }
                case 'channel_my' : {
                    smeHelper.clearSendingBox(msg);
                    var request = {
                        requestId: getNewRequestId(),
                        endpoint: "/communication/channel/my",
                        httpMethod: "GET",
                        parameters: {
                            owner: true,
                            editor: true,
                            subscriber: true
                        }
                    };
                    smeHelper.addSendingMsg(msg, request);
                    break;
                }
                case 'channel_create': {
                    smeHelper.clearSendingBox(msg);
                    var request = {
                        requestId: getNewRequestId(),
                        endpoint: "/communication/channel/create",
                        httpMethod: "POST",
                        body: {
                            title: smeHelper.getNodeConfigValue(node, msg, node.titleType, node.title)
                        }
                    };
                    smeHelper.addSendingMsg(msg, request);
                    break;
                }
                case 'channel_message_send': {
                    if (smeSendingBox) {
                        var channelIdValue = smeHelper.getNodeConfigValue(node, msg, node.channelIdType, node.channelId);
                        smeSendingBox.forEach(smeMsg => {
                            smeMsg.endpoint = "/communication/channel/message/send";
                            smeMsg.httpMethod = "POST";
                            smeMsg.body = {
                                channelId: channelIdValue,
                                dataComponent: smeMsg.dataComponent
                            };
                            delete smeMsg.dataComponent;
                        });
                    }
                    break;
                }
                case 'channel_message_update': {
                    if (smeSendingBox) {
                        var messageIdValue = smeHelper.getNodeConfigValue(node, msg, node.messageIdType, node.messageId);
                        smeSendingBox.forEach(smeMsg => {
                            smeMsg.requestId = getNewRequestId();
                            smeMsg.endpoint = "/communication/channel/message/update";
                            smeMsg.httpMethod = "POST";
                            smeMsg.body = {
                                messageId: messageIdValue,
                                dataComponent: smeMsg.dataComponent
                            };
                            delete smeMsg.dataComponent;
                        });
                    }
                    break;
                }
                default:
                    break;
                
            }

            send(msg, false);

            done && done();
        });
    };

    RED.nodes.registerType("sme-main-intent", SmeIntentNode);

};