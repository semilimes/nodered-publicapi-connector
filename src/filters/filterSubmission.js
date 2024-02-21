"use strict";

const Core = require('../sme-main-core.js');

module.exports = function (RED) {

    function SmeFilterFormSubmissionNode(config) {
        RED.nodes.createNode(this, config);

        this.reference = config.reference;
        this.referenceType = config.referenceType;
        this.messageId = config.messageId;
        this.messageIdType = config.messageIdType;
        this.saveLocation = config.saveLocation;
        this.saveLocationType = config.saveLocationType;
        this.extractValues = config.extractValues;

        var node = this;

        node.on('input', function (msg, send, done) {
            send = send || function () { node.send.apply(node, arguments) };

            var core = new Core();
            var smeHelper = new core.SmeHelper();
            var smeReceivedMsg = smeHelper.getReceivedMsg(msg);
            var referenceValue = smeHelper.getNodeConfigValue(node, msg, node.referenceType, node.reference);
            var messageIdValue = smeHelper.getNodeConfigValue(node, msg, node.messageIdType, node.messageId);
            
            //filter submissions
            var isMatchedSubmissionMessage = 
                smeReceivedMsg &&
                smeReceivedMsg.eventType == "MessageReceived" &&
                smeReceivedMsg.eventBody &&
                smeReceivedMsg.eventBody.dataComponent &&
                smeReceivedMsg.eventBody.dataComponent.dataComponentType == "formsubmission";
            
            if (isMatchedSubmissionMessage && referenceValue) {
                //filter submissions by form reference
                isMatchedSubmissionMessage = 
                    smeReceivedMsg.eventBody.dataComponent.replyTo &&
                    smeReceivedMsg.eventBody.dataComponent.replyTo.refName == referenceValue;
            }

            if (isMatchedSubmissionMessage && messageIdValue) {
                //filter submissions by message id
                isMatchedSubmissionMessage = 
                    smeReceivedMsg.eventBody.dataComponent.replyTo &&
                    smeReceivedMsg.eventBody.dataComponent.replyTo.messageId == messageIdValue;
            }

            if (isMatchedSubmissionMessage) {
                var submission = undefined;
                if (node.saveLocation) {
                    //Location specified: extract submission form and save into location
                    submission = {
                        replyTo: smeReceivedMsg.eventBody.dataComponent.replyTo,
                        formComponents: smeReceivedMsg.eventBody.dataComponent.formComponents
                    }
                    switch (node.saveLocationType) {
                        case 'msg': 
                            msg[node.saveLocation] = submission; 
                            break;
                        case 'flow':
                            node.context().flow.set(node.saveLocation, submission);
                            break;
                        case 'global':
                            node.context().global.set(node.saveLocation, submission);
                            break;
                        default: 
                            break;
                    }

                    //Extract values specified: 
                    if (node.saveLocation && node.extractValues) {
                        submission.formComponents.forEach(comp => {
                            if (comp.value !== undefined) {
                                msg[`${comp.refName}`] = comp.value;
                            }
                        });
                    }
                }

                send(msg, false);
            }

            done && done();
        });
    };

    RED.nodes.registerType("filterSubmission", SmeFilterFormSubmissionNode);
};
