"use strict";

const Core = require('../sme-main-core.js');

module.exports = function (RED) {

    function SmeFilterFormSubmissionNode(config) {
        RED.nodes.createNode(this, config);

        this.reference = config.reference;
        this.referenceType = config.referenceType;

        var node = this;

        node.on('input', function (msg, send, done) {
            send = send || function () { node.send.apply(node, arguments) };

            var core = new Core();
            var smeHelper = new core.SmeHelper();
            var smeReceivedMsg = smeHelper.getReceivedMsg(msg);

            var isMatchedSubmissionMessage = 
                smeReceivedMsg &&
                smeReceivedMsg.eventType == "MessageReceived" &&
                smeReceivedMsg.eventBody &&
                smeReceivedMsg.eventBody.dataComponent &&
                smeReceivedMsg.eventBody.dataComponent.dataComponentType == "formsubmission";
            
            if (isMatchedSubmissionMessage && node.reference) {
                var referenceValue = smeHelper.getNodeConfigValue(node, msg, node.referenceType, node.reference);
                node.log(`Node reference is: ${referenceValue}`);
                isMatchedSubmissionMessage = 
                    smeReceivedMsg.eventBody.dataComponent.replyTo &&
                    smeReceivedMsg.eventBody.dataComponent.replyTo.refName == referenceValue;
            }

            if (isMatchedSubmissionMessage) {
                msg = {};
                msg.payload = {};
                msg.payload.submission = smeReceivedMsg;
                send(msg, false);
            }

            done && done();
        });
    };

    RED.nodes.registerType("sme-filter-formSubmission", SmeFilterFormSubmissionNode);
};