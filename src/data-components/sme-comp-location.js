"use strict";

const Core = require('../sme-main-core.js');

module.exports = function(RED) {
    function CompLocationNode(config) {
        RED.nodes.createNode(this, config);

        this.locationName = config.locationName;
        this.locationNameType = config.locationNameType;

        this.latitude = config.latitude;
        this.latitudeType = config.latitudeType;

        this.longitude = config.longitude;
        this.longitudeType = config.longitudeType;

        var node = this;

        node.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) }
            if (node.locationName && node.latitude && node.longitude) {
                var core = new Core();
                var smeHelper = new core.SmeHelper();

                var locationNameValue = smeHelper.getNodeConfigValue(node, msg, node.locationNameType, node.locationName);
                var latitudeValue = smeHelper.getNodeConfigValue(node, msg, node.latitudeType, node.latitude);
                var longitudeValue = smeHelper.getNodeConfigValue(node, msg, node.longitudeType, node.longitude);


                if (locationNameValue && latitudeValue && longitudeValue) {
                    var smeMsg = {
                        dataComponentType: "location",
                        locationName: locationNameValue,
                        latitude: parseFloat(latitudeValue) || 0,
                        longitude: parseFloat(longitudeValue) || 0
                    };
                    smeHelper.addSendingMsg(msg, smeMsg);
                }
            }

            send(msg);

            done && done();
        });
    }
    RED.nodes.registerType("sme-comp-location", CompLocationNode);
}