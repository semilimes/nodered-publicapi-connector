"use strict";

const Core = require('../sme-main-core.js');

module.exports = function(RED) {
    function CompChannelNode(config) {
        RED.nodes.createNode(this, config);

        this.channelId = config.channelId;
        this.channelIdType = config.channelIdType;

        var node = this;

        node.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) }
            if (node.channelId) {
                var core = new Core();
                var smeHelper = new core.SmeHelper();

                var channelIdValue = smeHelper.getNodeConfigValue(node, msg, node.channelIdType, node.channelId);
                if (channelIdValue) {
                    var smeMsg = {
                        dataComponent: {
                            dataComponentType: "channel",
                            channelId: channelIdValue
                        }
                    };
                    smeHelper.addSendingMsg(msg, smeMsg);
                }
            }

            send(msg);

            done && done();
        });
    }
    RED.nodes.registerType("sme-comp-channel", CompChannelNode);
}