"use strict";

const Core = require('./sme-main-core.js');
const crypto = require('crypto');

module.exports = function (RED) {

    function SmeSenderNode(config) {
        RED.nodes.createNode(this, config);
        this.async = config.async != "0";

        this.name = config.name;

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

        this.silent = config.silent;
        this.silentType = config.silentType;

        this.saveLocation = config.saveLocation;
        this.saveLocationType = config.saveLocationType;

        this.saveRequestIdLocation = config.saveRequestIdLocation;
        this.saveRequestIdLocationType = config.saveRequestIdLocationType;

        this.logToConsole = config.logToConsole;

        this.cameraList = config.cameraList;

        var smeConnector = config.connector && RED.nodes.getNode(config.connector);
        if (!smeConnector)
            return;

        var node = this;

        function getNewRequestId() {
            return crypto.randomUUID();
        }

        node.on('input', function (msg, send, done) {
            send = send || function () { node.send.apply(node, arguments) };

            var core = new Core();
            var smeHelper = new core.SmeHelper();
            var smeSendingBox = smeHelper.getSendingBox(msg);

            var saveMode = "";

            switch (node.actionName) {
                case 'account_my': {
                    smeHelper.clearSendingBox(msg);
                    var request = {
                        requestId: getNewRequestId(),
                        endpoint: "/account/my",
                        httpMethod: "GET",
                        parameters: {
                            main: true,
                            sub: true,
                            shared: true,
                            details: true
                        }
                    };
                    smeHelper.addSendingMsg(msg, request);
                    break;
                }
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
                    saveMode = "messageId";
                    if (smeSendingBox) {
                        var recipientIdValue = smeHelper.getNodeConfigValue(node, msg, node.recipientIdType, node.recipientId);
                        var silentValue = smeHelper.getNodeConfigValue(node, msg, node.silentType, node.silent);
                        smeSendingBox.forEach(smeMsg => {
                            smeMsg.requestId = getNewRequestId();
                            smeMsg.endpoint = "/communication/p2p/message/send";
                            smeMsg.httpMethod = "POST";
                            smeMsg.body = {
                                recipientId: recipientIdValue,
                                options: {
                                    silent: typeof silentValue === 'boolean' ? silentValue : false
                                },
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
                        var silentValue = smeHelper.getNodeConfigValue(node, msg, node.silentType, node.silent);
                        smeSendingBox.forEach(smeMsg => {
                            smeMsg.requestId = getNewRequestId();
                            smeMsg.endpoint = "/communication/p2p/message/update";
                            smeMsg.httpMethod = "POST";
                            smeMsg.body = {
                                messageId: messageIdValue,
                                options: {
                                    silent: typeof silentValue === 'boolean' ? silentValue : false
                                },
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
                    saveMode = "groupChatId";
                    smeHelper.clearSendingBox(msg);
                    var request = {
                        requestId: getNewRequestId(),
                        endpoint: "/communication/groupchat/create",
                        httpMethod: "POST",
                        body: {
                            title: smeHelper.getNodeConfigValue(node, msg, node.titleType, node.title),
                            recipientIds: []
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
                    saveMode = "messageId";
                    if (smeSendingBox) {
                        var groupChatIdValue = smeHelper.getNodeConfigValue(node, msg, node.groupChatIdType, node.groupChatId);
                        var silentValue = smeHelper.getNodeConfigValue(node, msg, node.silentType, node.silent);
                        smeSendingBox.forEach(smeMsg => {
                            smeMsg.requestId = getNewRequestId();
                            smeMsg.endpoint = "/communication/groupchat/message/send";
                            smeMsg.httpMethod = "POST";
                            smeMsg.body = {
                                groupChatId: groupChatIdValue,
                                options: {
                                    silent: typeof silentValue === 'boolean' ? silentValue : false
                                },
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
                        var silentValue = smeHelper.getNodeConfigValue(node, msg, node.silentType, node.silent);
                        smeSendingBox.forEach(smeMsg => {
                            smeMsg.requestId = getNewRequestId();
                            smeMsg.endpoint = "/communication/groupchat/message/update";
                            smeMsg.httpMethod = "POST";
                            smeMsg.body = {
                                messageId: messageIdValue,
                                options: {
                                    silent: typeof silentValue === 'boolean' ? silentValue : false
                                },
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
                    saveMode = "channelId";
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
                case 'groupchat_message' : {
                    smeHelper.clearSendingBox(msg);
                    var request = {
                        requestId: getNewRequestId(),
                        endpoint: "/communication/channel/message",
                        httpMethod: "GET",
                        parameters: {}
                    };
                    var channelIdValue = smeHelper.getNodeConfigValue(node, msg, node.channelIdType, node.channelId);
                    var messageIdValue = smeHelper.getNodeConfigValue(node, msg, node.messageIdType, node.messageId);
                    var limitValue = smeHelper.getNodeConfigValue(node, msg, node.limitType, node.limit);
                    if (channelIdValue) request.parameters.channelId = channelIdValue;
                    if (messageIdValue) request.parameters.messageId = messageIdValue;
                    if (limitValue) request.parameters.limit = limitValue;
                    smeHelper.addSendingMsg(msg, request);
                    break;
                }
                case 'channel_message_send': {
                    saveMode = "messageId";
                    if (smeSendingBox) {
                        var channelIdValue = smeHelper.getNodeConfigValue(node, msg, node.channelIdType, node.channelId);
                        var silentValue = smeHelper.getNodeConfigValue(node, msg, node.silentType, node.silent);
                        smeSendingBox.forEach(smeMsg => {
                            smeMsg.requestId = getNewRequestId();
                            smeMsg.endpoint = "/communication/channel/message/send";
                            smeMsg.httpMethod = "POST";
                            smeMsg.body = {
                                channelId: channelIdValue,
                                options: {
                                    silent: typeof silentValue === 'boolean' ? silentValue : false
                                },
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
                        var silentValue = smeHelper.getNodeConfigValue(node, msg, node.silentType, node.silent);
                        smeSendingBox.forEach(smeMsg => {
                            smeMsg.requestId = getNewRequestId();
                            smeMsg.endpoint = "/communication/channel/message/update";
                            smeMsg.httpMethod = "POST";
                            smeMsg.body = {
                                messageId: messageIdValue,
                                options: {
                                    silent: typeof silentValue === 'boolean' ? silentValue : false
                                },
                                dataComponent: smeMsg.dataComponent
                            };
                            delete smeMsg.dataComponent;
                        });
                    }
                    break;
                }
                case 'camera_call': {
                    smeConnector.remoteAppInitiateCall(this.recipientId, this.groupChatId, this.cameraList);
                }
                default:
                    break;
                
            }

            //SEND MESSAGE
            smeSendingBox = smeHelper.getSendingBox(msg);
            if (smeSendingBox && smeSendingBox.length > 0) {
                if (node.async) {
                    //  Send message via WebSocket
                    smeSendingBox.forEach(smeMsg => {
                        smeConnector.postMessage({
                            requestId: smeMsg.requestId,
                            requestType: smeMsg.endpoint,
                            version: "2",
                            parameters: smeMsg.parameters || {},
                            body: smeMsg.body || {}
                        },
                        node.logToConsole)
                    });

                    //Extract request id(s)
                    var requestIdToSave = undefined
                    if (smeSendingBox.length === 1) {
                        requestIdToSave = smeSendingBox[0].requestId;
                    } else if (smeSendingBox.length > 1) {
                        requestIdToSave = [];
                        smeSendingBox.forEach(smeMsg => {
                            requestIdToSave.push(smeMsg.requestId);
                        });
                    }

                    //Save request id in saved location
                    if (requestIdToSave !== undefined && node.saveRequestIdLocation) {
                        switch (node.saveRequestIdLocationType) {
                            case 'msg':
                                msg[node.saveRequestIdLocation] = requestIdToSave;
                                break;
                            case 'flow':
                                node.context().flow.set(node.saveRequestIdLocation, requestIdToSave);
                                break;
                            case 'global':
                                node.context().global.set(node.saveRequestIdLocation, requestIdToSave);
                                break;
                            default:
                                break;
                        }
                    } else {
                        node.warn('Save requestId location value is invalid!');
                    }

                    smeHelper.clearSendingBox(msg);
                    send(msg, false);
                    done && done();
                }
                else {
                    //  Send message via HTTP REST
                    var entityToSave = undefined;
                    if (smeSendingBox.length === 1) {
                        entityToSave = "";
                    } else if (smeSendingBox.length > 1) {
                        entityToSave = [];
                    }

                    smeSendingBox.forEach((smeMsg, index) => {
                        var promise = smeConnector.sendMessage(smeMsg, node.logToConsole);
                        promise.then(
                            value => {
                                if (typeof value === 'object') {
                                    value.requestId = smeMsg.requestId || '';
                                }
                                smeHelper.addResponseMsg(msg, value);

                                //Save entity id (message, groupchat, channel) in saved location
                                if (saveMode) {
                                    var tempValueToSave = undefined;
                                    switch (saveMode) {
                                        case 'messageId':
                                            tempValueToSave = value.data?.sentMessage?.messageId;
                                            break;
                                        case 'groupChatId':
                                            tempValueToSave = value.data?.createdGroupChat?.groupChatId;
                                            break;
                                        case 'channelId':
                                            tempValueToSave = value.data?.createdChannel?.channelId;
                                            break;
                                        default:
                                            break;
                                    }
                                    //Add tempValue to entityToSave
                                    if(tempValueToSave) {
                                        if (Array.isArray(entityToSave)) {
                                            entityToSave.push(tempValueToSave);
                                        } else {
                                            entityToSave = tempValueToSave;
                                        }
                                    }
                                }

                                if (saveMode) {
                                    if (node.saveLocation) {
                                        //Finally save entity to location
                                        if (entityToSave) {
                                            switch (node.saveLocationType) {
                                                case 'msg':
                                                    msg[node.saveLocation] = entityToSave;
                                                    break;
                                                case 'flow':
                                                    node.context().flow.set(node.saveLocation, entityToSave);
                                                    break;
                                                case 'global':
                                                    node.context().global.set(node.saveLocation, entityToSave);
                                                    break;
                                                default:
                                                    break;
                                            }
                                        }
                                    } else {
                                        node.warn('Save location value is invalid!');
                                    }
                                }
                                
                                send(msg, false);
                                done && done();
                            },
                            reason => {
                                //reason.requestId = smeMsg.requestId || '';
                                smeHelper.addResponseMsg(msg, reason);
                                msg.error = reason;
                                send(msg, false);
                                done && done(reason);
                            }
                        );
                        //  Wait for last message sent.
                        if (index == smeSendingBox.length - 1) {
                            smeHelper.clearSendingBox(msg);
                        }
                    });
                }
            }
            else {
                node.debug('Sending box is empty!');
                done && done();
            }
        });
    };

    RED.nodes.registerType("smeSender", SmeSenderNode);
};