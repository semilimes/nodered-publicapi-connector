"use strict";

const Core = require('./sme-main-core.js');

module.exports = function(RED) {
    function CompMessageNode(config) {
        RED.nodes.createNode(this, config);

        this.message = config.message;

        //Text
        this.text = config.text;
        this.textType = config.textType;

        //Html
        this.html = config.html;
        this.htmlType = config.htmlType;

        //File
        this.fileIds = config.fileIds;
        this.fileIdsType = config.fileIdsType;

        //Contact
        this.contactIds = config.contactIds;
        this.contactIdsType = config.contactIdsType;

        //Location
        this.locationName = config.locationName;
        this.locationNameType = config.locationNameType;

        this.latitude = config.latitude;
        this.latitudeType = config.latitudeType;

        this.longitude = config.longitude;
        this.longitudeType = config.longitudeType;

        //Appointment
        this.title = config.title;
        this.titleType = config.titleType;

        this.description = config.description;
        this.descriptionType = config.descriptionType;

        this.start = config.start;
        this.startType = config.startType;

        this.end = config.end;
        this.endType = config.endType;

        this.allDay = config.allDay;
        this.allDayType = config.allDayType;

        //location latitude and longitude reused from location object

        //Line Chart

        this.xLabelText = config.xLabelText;
        this.xLabelTextType = config.xLabelTextType;

        this.xShowValues = config.xShowValues;
        this.xShowValuesType = config.xShowValuesType;

        this.yLabelText = config.yLabelText;
        this.yLabelTextType = config.yLabelTextType;

        this.yShowValues = config.yShowValues;
        this.yShowValuesType = config.yShowValuesType;

        this.gridDisplay = config.gridDisplay;
        this.gridDisplayType = config.gridDisplayType;

        this.backgroundColor = config.backgroundColor;
        this.backgroundColorType = config.backgroundColorType;
        
        this.lines = config.lines;
        this.linesType = config.linesType;

        //WebView
        this.url = config.url;
        this.urlType = config.urlType;

        this.displayMode = config.displayMode;

        this.linkDisplayName = config.linkDisplayName;
        this.linkDisplayNameType = config.linkDisplayNameType;

        this.enableFullScreenView = config.enableFullScreenView;

        this.viewSize = config.viewSize || "1:2";

        //Channel
        this.channelId = config.channelId;
        this.channelIdType = config.channelIdType;

        //Tunnel
        this.tunnelId = config.tunnelId;
        this.tunnelIdType = config.tunnelIdType;

        //Form
        this.formLocation = config.formLocation;
        this.formLocationType = config.formLocationType;

        var node = this;

        node.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) }
            
            var core = new Core();
            var smeHelper = new core.SmeHelper();
            var smeMsg = undefined;
            switch (node.message) {
                case 'text':
                    var textValue = smeHelper.getNodeConfigValue(node, msg, node.textType, node.text);
                    if (textValue) {
                        smeMsg = {
                            dataComponent: {
                                dataComponentType: "text",
                                text: textValue
                            }
                        };
                    }
                    break;
                case 'html':
                    var htmlValue = smeHelper.getNodeConfigValue(node, msg, node.htmlType, node.html);
                    if (htmlValue) {
                        smeMsg = {
                            dataComponent: {
                                dataComponentType: "html",
                                html: htmlValue
                            }
                        };
                    }
                    break;
                case 'file':
                    var fileIdsValue = smeHelper.getNodeConfigValue(node, msg, node.fileIdsType, node.fileIds);
                    
                    if (fileIdsValue) {
                        smeMsg = {
                            dataComponent: {
                                dataComponentType: "file",
                                fileIds: []
                            }
                        };
                        const fileIdArray = fileIdsValue.split(',');
                        fileIdArray.forEach(fileId => {
                            smeMsg.dataComponent.fileIds.push(fileId.trim());
                        });
                    }
                    break;
                case 'contact':
                    var contactIdsValue = smeHelper.getNodeConfigValue(node, msg, node.contactIdsType, node.contactIds);
                    
                    if (contactIdsValue) {
                        smeMsg = {
                            dataComponent: {
                                dataComponentType: "contact",
                                contactIds: []
                            }
                        };
                        const contactIdArray = contactIdsValue.split(',');
                        contactIdArray.forEach(contactId => {
                            smeMsg.dataComponent.contactIds.push(contactId.trim());
                        });
                    }                   
                    break;
                case 'appointment':
                    var titleValue = smeHelper.getNodeConfigValue(node, msg, node.titleType, node.title);
                    var descriptionValue = smeHelper.getNodeConfigValue(node, msg, node.descriptionType, node.description);
                    var startValue = smeHelper.getNodeConfigValue(node, msg, node.startType, node.start);
                    var endValue = smeHelper.getNodeConfigValue(node, msg, node.endType, node.end);
                    var allDayValue = smeHelper.getNodeConfigValue(node, msg, node.allDayType, node.allDay);
                    var latitudeValue = smeHelper.getNodeConfigValue(node, msg, node.latitudeType, node.latitude);
                    var longitudeValue = smeHelper.getNodeConfigValue(node, msg, node.longitudeType, node.longitude);

                    if (titleValue &&
                        typeof titleValue === "string" && 
                        typeof startValue === "number" && 
                        typeof endValue === "number" )
                        {
                            smeMsg = {
                                dataComponent: {
                                    dataComponentType: "appointment",
                                    title: titleValue,
                                    description: descriptionValue || "",
                                    start: startValue,
                                    end: endValue,
                                    allDay: allDayValue === true || false,
                                }
                            };
                            if (latitudeValue && 
                                longitudeValue &&
                                parseFloat(latitudeValue) > 0 && 
                                parseFloat(longitudeValue) > 0) 
                                {
                                    smeMsg.dataComponent.location = {
                                        latitude: parseFloat(latitudeValue) || 0.0,
                                        longitude: parseFloat(longitudeValue) || 0.0
                                }
                            }
                        }
                    break;
                case 'linechart':
                    var titleValue = smeHelper.getNodeConfigValue(node, msg, node.titleType, node.title);
                    var xLabelTextValue = smeHelper.getNodeConfigValue(node, msg, node.xLabelTextType, node.xLabelText);
                    var yLabelTextValue = smeHelper.getNodeConfigValue(node, msg, node.yLabelTextType, node.yLabelText);
                    var gridDisplayValue = smeHelper.getNodeConfigValue(node, msg, node.gridDisplayType, node.gridDisplay);
                    var backgroundColorValue = smeHelper.getNodeConfigValue(node, msg, node.backgroundColorType, node.backgroundColor);
                    var linesValue = smeHelper.getNodeConfigValue(node, msg, node.linesType, node.lines);
                    
                    //Setting default options object
                    var options = {
                        x: {
                            label: {
                                text: "X Axis"
                            },
                            showTitles: node.xShowValues || false
                        },
                        y: {
                            label: {
                                text: "Y Axis"
                            },
                            showTitles: node.yShowValues || false
                        },
                        grid: {
                            display: true
                        },
                        background: {
                            color: "#FFFFFF"
                        }
                    };

                    if (xLabelTextValue) {
                        options.x.label.text = xLabelTextValue;
                    }
                    if (yLabelTextValue) {
                        options.y.label.text = yLabelTextValue;
                    }
                    if (typeof gridDisplayValue === 'boolean') {
                        options.grid.display = gridDisplayValue;
                    }
                    if (backgroundColorValue) {
                        options.background.color = backgroundColorValue;
                    }
                    
                    smeMsg = {
                        dataComponent: {
                            dataComponentType: "linechart",
                            title: titleValue || "Line Chart",
                            options: options,
                            lines: linesValue
                        }
                    }

                    break;
                case 'location':
                    var locationNameValue = smeHelper.getNodeConfigValue(node, msg, node.locationNameType, node.locationName);
                    var latitudeValue = smeHelper.getNodeConfigValue(node, msg, node.latitudeType, node.latitude);
                    var longitudeValue = smeHelper.getNodeConfigValue(node, msg, node.longitudeType, node.longitude);
                    
                    if (locationNameValue && latitudeValue && longitudeValue) {
                        smeMsg = {
                            dataComponent: {
                                dataComponentType: "location",
                                locationName: locationNameValue,
                                latitude: parseFloat(latitudeValue) || 0,
                                longitude: parseFloat(longitudeValue) || 0
                            }
                        };
                    }                    
                    break;
                case 'webview':
                    var urlValue = smeHelper.getNodeConfigValue(node, msg, node.urlType, node.url);
                    var linkDisplayNameValue = smeHelper.getNodeConfigValue(node, msg, node.linkDisplayNameType, node.linkDisplayName);
                    if (urlValue) {
                        smeMsg = {
                            dataComponent: {
                                dataComponentType: "webview",
                                url: urlValue,
                                displayMode: node.displayMode,
                                linkDisplayName: linkDisplayNameValue || "",
                                enableFullScreenView: node.enableFullScreenView == "1",
                                viewSize: node.viewSize
                            }
                        };
                    }                    
                    break;
                case 'channel':
                    var channelIdValue = smeHelper.getNodeConfigValue(node, msg, node.channelIdType, node.channelId);
                    if (channelIdValue) {
                        smeMsg = {
                            dataComponent: {
                                dataComponentType: "channel",
                                channelId: channelIdValue
                            }
                        };
                    }                    
                    break;
                case 'tunnel':
                    var tunnelIdValue = smeHelper.getNodeConfigValue(node, msg, node.tunnelIdType, node.tunnelId);
                    if (tunnelIdValue) {
                        smeMsg = {
                            dataComponent: {
                                dataComponentType: "tunnel",
                                tunnelId: tunnelIdValue
                            }
                        };
                    }                    
                    break;
                case 'form':
                    var formLocationValue = smeHelper.getNodeConfigValue(node, msg, node.formLocationType, node.formLocation);
                    if (formLocationValue) {
                        smeMsg = {
                            dataComponent: formLocationValue
                        }
                    }
                    break;
                default:
                    break;

            }

            if (smeMsg) {
                smeHelper.addSendingMsg(msg, smeMsg);
            } else {
                node.warn("No msg has been added for sending!");
            }
            
            send(msg);

            done && done();
        });
    }
    RED.nodes.registerType("smeMessage", CompMessageNode);
}