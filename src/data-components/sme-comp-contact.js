"use strict";

const Core = require('../sme-main-core.js');

module.exports = function(RED) {
    function CompContactNode(config) {
        RED.nodes.createNode(this, config);

        this.contactIds = config.contactIds;
        this.contactIdsType = config.contactIdsType;

        var node = this;

        node.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) }
            if (node.contactIds) {
                var core = new Core();
                var smeHelper = new core.SmeHelper();

                var contactIdsValue = smeHelper.getNodeConfigValue(node, msg, node.contactIdsType, node.contactIds);
                if (contactIdsValue) {
                    
                    var smeMsg = {
                        dataComponent: {
                            dataComponentType: "contact",
                            contactIds: []
                        }
                    };

                    const contactIdArray = contactIdsValue.split(',');
                    contactIdArray.forEach(contactId => {
                        smeMsg.dataComponent.contactIds.push(contactId.trim());
                    });

                    smeHelper.addSendingMsg(msg, smeMsg);
                }
            }

            send(msg);

            done && done();
        });
    }
    RED.nodes.registerType("sme-comp-contact", CompContactNode);
}