# Node-RED semilimes connector
[![Platform](https://img.shields.io/badge/platform-Node--RED-red)](https://nodered.org)   [![License](https://img.shields.io/badge/license-Apache--License-lightgrey)](http://www.apache.org/licenses/LICENSE-2.0) [![Downloads](https://img.shields.io/badge/download-github-purple)](https://github.com/semilimes/nodered-publicapi-connector) [![Install](https://img.shields.io/badge/Install-NPM-blue)](https://www.npmjs.com/package/@semilimes/node-red-semilimes)

This Node-RED package lets you extend your semilimes experience with automation and IoT capabilities, such as the implementation of auto replies, booking flows, control dashboards or message-based interfaces, all exposed through your semilimes app.

[Github project](https://github.com/semilimes/nodered-publicapi-connector)

[Official semilimes API Documentation](https://www.semilimes.com/developers/)

## Install
[![NPM](https://nodei.co/npm/@semilimes/node-red-semilimes.png?downloads=true)](https://nodei.co/npm/@semilimes/node-red-semilimes/)

You can install the nodes by either
- using node-red's "Manage palette" in the side bar and searching for `node-red-semilimes`
  
  or
- running the following command in the root directory of your Node-RED installation
    ```
    npm install @semilimes/node-red-semilimes --save
    ```


## Setup your developer environment

1. Install the semilimes app through the [Official semilimes Website](https://www.semilimes.com/apps/) or by using the following direct store links 
   - **iOS** : [![Platform](https://img.shields.io/badge/Apple%20IOS-semilimes%20Messenger-blue.svg)](https://apps.apple.com/us/app/semilimes-mesh/id1536363738?l=en)  

   - **Android** : [![Platform](https://img.shields.io/badge/Google--Play-semilimes%20Messenger-darkgreen.svg)](https://play.google.com/store/apps/details?id=net.semilimes.messenger&hl=en&gl=US)  

2. Access the [semilimes Services](https://my.semilimes.net) website and login using the on-screen instructions
   
3. Create a subaccount
   
   ![CreateSubAccount](resources/images/createSubAccount.png)
   
4. Enter billing information for the created subaccount

    ![EnterBillingInfo](resources/images/enterBillingInfo.png)

5. Request an API Key for your new subaccount

    ![GenerateApiKey](resources/images/generateApiKey.png)

## Connect to semilimes

1. Add a new `Text` node and configure it with your preferred message

2. Add an `Action Selector` node and select the `Account - Get Contacts` to get a list of contacts to send a message to.

3. Add a `sender` node then config its `Connector` property to create a `connector` configuration.
![Property editor of listener node](resources/images/sender_node_properties.jpg)

1. Configure the `connector` node with your API key and connect it to semilimes.
![Config connector node](resources/images/connector_node_properties.jpg)

1. Run the flow and get your contacts list. Save the preferred AccountId

2. In another flow, add a `Text` node with a message

3. Add an `Action Selector` node and select `P2P - Send Message` and set the AccountId you saved in the RecipientId field

4. Add a `sender` node and run.

The flow should look like this [example](https://github.com/semilimes/nodered-publicapi-connector/blob/main/examples/Connect%20To%20semilimes%20flow.json)

![connect to semilimes flow example](resources/images/connecttosemilimesflow.png)

You have sent your first message!


# Examples

You can find all the provided examples by importing them from this Node-RED package, or you can explore and import them manually at this GitHub link:

[All Example flows](https://github.com/semilimes/nodered-publicapi-connector/tree/main/examples)


## Dependencies
The nodes are tested on linux environments with `Node.js v19.2.0` and `Node-RED v3.0.2`

# License
Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/
