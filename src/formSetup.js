"use strict";

const Core = require('./sme-main-core.js');

module.exports = function (RED) {
    function CompFormNode(config) {
        RED.nodes.createNode(this, config);

        var smeConnector = config.connector && RED.nodes.getNode(config.connector);
        if (!smeConnector)
            return;
        this.saveLocation = config.saveLocation;
        this.saveLocationType = config.saveLocationType;

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

            
            if (!node.saveLocation || !node.saveLocationType) {
                var error = "Save location is invalid!";
                done && done(error);
            }
            
            var form = {
                dataComponentType: "form"
            }


            var submitTextValue = smeHelper.getNodeConfigValue(node, msg, node.submitTextType, node.submitText);
            var recipientIdValue = smeHelper.getNodeConfigValue(node, msg, node.recipientIdType, node.recipientId);
            var groupChatIdValue = smeHelper.getNodeConfigValue(node, msg, node.groupChatIdType, node.groupChatId);
            var channelIdValue = smeHelper.getNodeConfigValue(node, msg, node.channelIdType, node.channelId);
            var refNameValue = smeHelper.getNodeConfigValue(node, msg, node.refNameType, node.refName);
            


            //Initializing 
            form.submitEnabled = node.submitEnabled == "1";
            form.retainStatus = node.retainStatus == "1";
            form.submitText = submitTextValue;
            form.receiver = {};
            switch (node.receiverType) {
                case 'none':
                    break;
                case 'contact':
                    if (recipientIdValue) {
                        form.receiver.id = recipientIdValue;
                        form.receiver.featureType = node.receiverType;
                    }
                    break;
                case 'groupchat':
                    if (groupChatIdValue) {
                        form.receiver.id = groupChatIdValue;
                        form.receiver.featureType = node.receiverType;
                    }
                    break;
                case 'channel':
                    if (channelIdValue) {
                        form.receiver.id = channelIdValue;
                        form.receiver.featureType = node.receiverType;
                    }
                    break;
                default:
                    break;
            }
            form.refName = refNameValue;
            form.formComponents = [];


            switch (node.saveLocationType) {
                case 'msg':
                    msg[node.saveLocation] = form;
                    break;
                case 'flow':
                    node.context().flow.set(node.saveLocation, form);
                    break;
                case 'global':
                    node.context().global.set(node.saveLocation, form);
                    break;
                default:
                    break;
            }

            msg["_formSetupLocation"] = {
                type: node.saveLocationType,
                var: node.saveLocation
            }

            send(msg);

            done && done();
        });
    }
    RED.nodes.registerType("formSetup", CompFormNode);
}