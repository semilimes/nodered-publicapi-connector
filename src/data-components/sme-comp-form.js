"use strict";

const Core = require('../sme-main-core.js');

module.exports = function (RED) {
    function CompFormNode(config) {
        RED.nodes.createNode(this, config);

        this.submitText = config.submitText;
        this.submitTextType = config.submitTextType;
        this.submitEnabled = config.submitEnabled;
        this.receiverId = config.receiverId;
        this.receiverIdType = config.receiverIdType;
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
            var receiverIdValue = smeHelper.getNodeConfigValue(node, msg, node.receiverIdType, node.receiverId);
            var refNameValue = smeHelper.getNodeConfigValue(node, msg, node.refNameType, node.refName);
            
            //Initializing 
            smeFormMsg.dataComponent.submitEnabled = node.submitEnabled == "1";
            smeFormMsg.dataComponent.submitText = submitTextValue;
            smeFormMsg.dataComponent.receiver = {};
            if (node.receiverType != "none") {
                smeFormMsg.dataComponent.receiver.id = receiverIdValue;
                smeFormMsg.dataComponent.receiver.featureType = node.receiverType;
            }
            smeFormMsg.dataComponent.refName = refNameValue;
            smeFormMsg.dataComponent.formComponents = [];

            send(msg);

            done && done();
        });
    }
    RED.nodes.registerType("sme-comp-form", CompFormNode);
}