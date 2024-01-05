"use strict";

const Core = require('../sme-main-core.js');

module.exports = function(RED) {
    function CompTunnelNode(config) {
        RED.nodes.createNode(this, config);

        this.tunnelId = config.tunnelId;
        this.tunnelIdType = config.tunnelIdType;

        var node = this;

        node.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) }
            if (node.tunnelId) {
                var core = new Core();
                var smeHelper = new core.SmeHelper();

                var tunnelIdValue = smeHelper.getNodeConfigValue(node, msg, node.tunnelIdType, node.tunnelId);
                if (tunnelIdValue) {
                    var smeMsg = {
                        dataComponentType: "tunnel",
                        tunnelId: tunnelIdValue
                    };
                    smeHelper.addSendingMsg(msg, smeMsg);
                }
            }

            send(msg);

            done && done();
        });
    }
    RED.nodes.registerType("sme-comp-tunnel", CompTunnelNode);
}