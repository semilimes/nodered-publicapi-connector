"use strict";

const Core = require('../sme-main-core.js');

module.exports = function (RED) {
    function CompFormNode(config) {
        RED.nodes.createNode(this, config);

        var smeConnector = config.connector && RED.nodes.getNode(config.connector);
        if (!smeConnector)
            return;

        this.submitText = config.submitText;
        this.submitTextType = config.submitTextType;
        this.submitEnabled = config.submitEnabled;
        this.retainStatus = config.retainStatus;
        this.recipientId = config.recipientId;
        this.recipientIdType = config.recipientIdType;
        this.receiverType = config.receiverType;
        this.refName = config.refName;
        this.refNameType = config.refNameType;

        var node = this;

        node.on('input', function (msg, send, done) {
            send = send || function () { node.send.apply(node, arguments) }

            var core = new Core();
            var smeHelper = new core.SmeHelper();
            //already referencing a new pushed message in sending box
            var smeFormMsg = smeHelper.getOrAddSendingFormMsg(msg);

            var submitTextValue = smeHelper.getNodeConfigValue(node, msg, node.submitTextType, node.submitText);
            var recipientIdValue = smeHelper.getNodeConfigValue(node, msg, node.recipientIdType, node.recipientId);
            var groupChatIdValue = smeHelper.getNodeConfigValue(node, msg, node.groupChatIdType, node.groupChatId);
            var channelIdValue = smeHelper.getNodeConfigValue(node, msg, node.channelIdType, node.channelId);
            var refNameValue = smeHelper.getNodeConfigValue(node, msg, node.refNameType, node.refName);
            
            //Initializing 
            smeFormMsg.dataComponent.submitEnabled = node.submitEnabled == "1";
            smeFormMsg.dataComponent.retainStatus = node.retainStatus == "1";
            smeFormMsg.dataComponent.submitText = submitTextValue;
            smeFormMsg.dataComponent.receiver = {};
            switch (node.receiverType) {
                case 'none':
                    break;
                case 'contact':
                    if (recipientIdValue) {
                        smeFormMsg.dataComponent.receiver.id = recipientIdValue;
                        smeFormMsg.dataComponent.receiver.featureType = node.receiverType;
                    }
                    break;
                case 'groupchat':
                    if (groupChatIdValue) {
                        smeFormMsg.dataComponent.receiver.id = groupChatIdValue;
                        smeFormMsg.dataComponent.receiver.featureType = node.receiverType;
                    }
                    break;
                case 'channel':
                    if (channelIdValue) {
                        smeFormMsg.dataComponent.receiver.id = channelIdValue;
                        smeFormMsg.dataComponent.receiver.featureType = node.receiverType;
                    }
                    break;
                default:
                    break;
            }
            smeFormMsg.dataComponent.refName = refNameValue;
            smeFormMsg.dataComponent.formComponents = [];

            send(msg);

            done && done();
        });
    }
    RED.nodes.registerType("sme-comp-form", CompFormNode);
}