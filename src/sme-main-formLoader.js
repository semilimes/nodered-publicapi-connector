"use strict";

const Core = require('./sme-main-core.js');

module.exports = function (RED) {

    function SmeFormLoaderNode(config) {
        RED.nodes.createNode(this, config);
        
        var node = this;

        node.location = config.location;
        node.locationType = config.locationType;

        node.on('input', function (msg, send, done) {
            send = send || function () { node.send.apply(node, arguments) };

            var core = new Core();
            var smeHelper = new core.SmeHelper();
            var formMsg = smeHelper.getNodeConfigValue(node, msg, node.locationType, node.location);

            if (formMsg && formMsg.dataComponentType == "form") {
                smeHelper.addSendingMsg(msg, { dataComponent: formMsg });
            }

            send(msg, false);
            done && done();        

        });
    };

    RED.nodes.registerType("sme-main-formLoader", SmeFormLoaderNode);
};