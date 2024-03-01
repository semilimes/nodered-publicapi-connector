"use strict";

const Core = require('./sme-main-core.js');

module.exports = function (RED) {

    function SmeNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var smeConnector = config.connector && RED.nodes.getNode(config.connector);
        if (!smeConnector)
            return;

        var listenerCallback = (smeMsg) => {
            var clonedMsg = JSON.parse(JSON.stringify(smeMsg));
            var nodeRedMsg = { payload: null };

            var core = new Core();
            var smeHelper = new core.SmeHelper();
            smeHelper.setReceivedMsg(nodeRedMsg, clonedMsg);

            node.send(nodeRedMsg, false);
        }
        //	Add message Listener on creation
        smeConnector.addMessageListener(listenerCallback);
        //	Remove listener on redeploy
        node.on('close', function () {
            smeConnector.removeMessageListener(listenerCallback);
        });
    };

    RED.nodes.registerType("smeListener", SmeNode);
};