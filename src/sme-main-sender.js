"use strict";

const Core = require('./sme-main-core.js');

module.exports = function (RED) {

    function SmeSenderNode(config) {
        RED.nodes.createNode(this, config);
        this.async = config.async != "0";
        var node = this;

        var smeConnector = config.connector && RED.nodes.getNode(config.connector);
        if (!smeConnector)
            return;

        node.on('input', function (msg, send, done) {
            send = send || function () { node.send.apply(node, arguments) };

            var core = new Core();
            var smeHelper = new core.SmeHelper();
            var smeSendingBox = smeHelper.getSendingBox(msg);
            if (smeSendingBox && smeSendingBox.length > 0) {
                if (node.async) {
                    //  Send message via WebSocket
                    node.log(`Sending ${smeSendingBox.length} websocket messages...`);

                    smeSendingBox.forEach(smeMsg => {
                        smeConnector.postMessage({
                            requestId: smeMsg.requestId,
                            requestType: smeMsg.endpoint,
                            version: "2",
                            parameters: smeMsg.parameters || {},
                            body: smeMsg.body || {}
                        })
                    });
                    smeHelper.clearSendingBox(msg);
                    send(msg, false);
                    done && done();
                }
                else {
                    //  Send message via HTTP REST
                    node.log(`Sending ${smeSendingBox.length} http messages...`);
                    
                    //  Send message synchronously
                    smeSendingBox.forEach((smeMsg, index) => {
                        var promise = smeConnector.sendMessage(smeMsg);
                        promise.then(
                            value => {
                                if (typeof value === 'object') {
                                    value.requestId = smeMsg.requestId || '';
                                }
                                smeHelper.addResponseMsg(msg, value);
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

    RED.nodes.registerType("sme-main-sender", SmeSenderNode);
};