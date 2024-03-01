"use strict";

const Core = require('./sme-main-core.js');

module.exports = function (RED) {

    function SmeFilterNode(config) {
        RED.nodes.createNode(this, config);

        this.filter = config.filter;

        this.reference = config.reference;
        this.referenceType = config.referenceType;
        this.messageId = config.messageId;
        this.messageIdType = config.messageIdType;
        this.extractValues = config.extractValues;

        this.chat = config.chat;
        this.senderId = config.senderId;
        this.senderIdType = config.senderIdType;
        this.groupChatId = config.groupChatId;
        this.groupChatIdType = config.groupChatIdType;
        this.channelId = config.channelId;
        this.channelIdType = config.channelIdType;

        this.requestId = config.requestId;
        this.requestIdType = config.requestIdType;

        this.saveLocation = config.saveLocation;
        this.saveLocationType = config.saveLocationType;

        var smeConnector = config.connector && RED.nodes.getNode(config.connector);
        if (!smeConnector)
            return;

        var node = this;

        function isSubmission(recMsg, options = {}) {
            var result = recMsg &&
                    recMsg.eventType === "MessageReceived" &&
                    recMsg.eventBody &&
                    ((options && options.senderId) ? recMsg.eventBody.senderId === options.senderId : true) &&
                    recMsg.eventBody.dataComponent &&
                    recMsg.eventBody.dataComponent.dataComponentType === "formsubmission" &&
                    recMsg.eventBody.dataComponent.replyTo &&
                    ((options && options.reference) ? recMsg.eventBody.dataComponent.replyTo.refName === options.reference : true) &&
                    ((options && options.messageId) ? recMsg.eventBody.dataComponent.replyTo.messageId === options.messageId : true);
            return result;
        }

        function isMessage(recMsg, options = {}) {
            return  recMsg &&
                    recMsg.eventType === "MessageReceived" &&
                    recMsg.featureType &&
                    ((options && options.chatType) ? recMsg.featureType === options.chatType : true) &&
                    recMsg.eventBody &&
                    ((options && options.senderId) ? recMsg.eventBody.senderId === options.senderId : true) &&
                    ((options && options.groupChatId) ? recMsg.eventBody.groupChatId === options.groupChatId : true) &&
                    ((options && options.channelId) ? recMsg.eventBody.channelId === options.channelId : true)
        }

        function isResponse(recMsg, options = {}) {
            return  recMsg &&
                    recMsg.eventType === "Response" &&
                    recMsg.requestId &&
                    ((options && options.requestId) ? recMsg.requestId === options.requestId : true)
        }  

        function saveOutput(currMsg, output, location, locationType) {
            if (output && location && locationType) {
                //Location specified: extract submission form and save into location
                switch (locationType) {
                    case 'msg': 
                        currMsg[location] = output; 
                        break;
                    case 'flow':
                        node.context().flow.set(location, output);
                        break;
                    case 'global':
                        node.context().global.set(location, output);
                        break;
                    default: 
                        break;
                }
            }
        }

        node.on('input', function (msg, send, done) {
            send = send || function () { node.send.apply(node, arguments) };

            var core = new Core();
            var smeHelper = new core.SmeHelper();
            var smeReceivedMsg = smeHelper.getReceivedMsg(msg);

            switch (node.filter) {
                case 'submission':
                    var referenceValue = node.reference ? smeHelper.getNodeConfigValue(node, msg, node.referenceType, node.reference) : undefined;
                    var messageIdValue = node.messageId ? smeHelper.getNodeConfigValue(node, msg, node.messageIdType, node.messageId) : undefined;
                    var senderIdValue = node.senderId ? smeHelper.getNodeConfigValue(node, msg, node.senderIdType, node.senderId) : undefined;

                    //Set filter options
                    var filterOptions = {};
                    if (senderIdValue) {
                        filterOptions.senderId = senderIdValue;
                    }
                    if (referenceValue) {
                        filterOptions.reference = referenceValue;
                    }
                    if (messageIdValue) { 
                        filterOptions.messageId = messageIdValue;
                    }

                    //Check matching
                    if (isSubmission(smeReceivedMsg, filterOptions)) {
                        var submission = {
                            senderId: smeReceivedMsg.eventBody.senderId,
                            replyTo: smeReceivedMsg.eventBody.dataComponent.replyTo,
                            formComponents: smeReceivedMsg.eventBody.dataComponent.formComponents
                        }
                        
                        //Save into location
                        saveOutput(msg, submission, node.saveLocation, node.saveLocationType);
                        
                        //Extract values in msg: 
                        if (node.saveLocation && node.extractValues) {
                            submission.formComponents.forEach(comp => {
                                if (comp.value !== undefined) {
                                    msg[`${comp.refName}`] = comp.value;
                                }
                            });
                        }
                        
                        send(msg, false);
                    }
                    break;
                case 'message':
                    var senderIdValue = node.senderId ? smeHelper.getNodeConfigValue(node, msg, node.senderIdType, node.senderId) : undefined;
                    var groupChatIdValue = node.groupChatId ? smeHelper.getNodeConfigValue(node, msg, node.groupChatIdType, node.groupChatId) : undefined;
                    var channelIdValue = node.channelId ? smeHelper.getNodeConfigValue(node, msg, node.channelIdType, node.channelId) : undefined;

                    var filterOptions = {};
                    filterOptions.chatType = node.chat;
                    if (senderIdValue) {
                        filterOptions.senderId = senderIdValue;
                    }
                    if (node.chat === "groupchat" && groupChatIdValue) {
                        filterOptions.groupChatId = groupChatIdValue;
                    }
                    if (node.chat === "channel" && channelIdValue) {
                        filterOptions.channelId = channelIdValue;
                    }

                    if (isMessage(smeReceivedMsg, filterOptions)) {
                        saveOutput(msg, smeReceivedMsg, node.saveLocation, node.saveLocationType);
                        send(msg, false);
                    }

                    break;
                case 'response':
                    var requestIdValue = node.requestId ? smeHelper.getNodeConfigValue(node, msg, node.requestIdType, node.requestId) : undefined;

                    var filterOptions = {};
                    if (requestIdValue) {
                        filterOptions.requestId = requestIdValue;
                    }

                    if (isResponse(smeReceivedMsg, filterOptions)) {
                        saveOutput(msg, smeReceivedMsg, node.saveLocation, node.saveLocationType);
                        send(msg, false);
                    }
                    break;
                default:
                    break;
            }

            done && done();
        });
    };

    RED.nodes.registerType("smeFilter", SmeFilterNode);
};
