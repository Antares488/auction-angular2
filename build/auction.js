"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var path = require("path");
var ws_1 = require("ws");
var model_1 = require("./model");
var app = express();
app.use('/', express.static(path.join(__dirname, '..', 'client')));
app.use('/node_modules', express.static(path.join(__dirname, '..', 'node_modules')));
app.get('/products', function (req, res) {
    res.json(model_1.getProducts(req.query));
});
app.get('/products/:id', function (req, res) {
    res.json(model_1.getProductById(parseInt(req.params.id)));
});
app.get('/products/:id/reviews', function (req, res) {
    res.json(model_1.getReviewsByProductId(parseInt(req.params.id)));
});
var httpServer = app.listen(8000, 'localhost', function () {
    var _a = httpServer.address(), address = _a.address, port = _a.port;
    console.log('Listening on %s %s', address, port);
});
var wsServer = new ws_1.Server({ server: httpServer });
wsServer.on('connection', function (ws) {
    ws.on('message', function (message) {
        var subscriptionRequest = JSON.parse(message);
        subscribeToProductBids(ws, subscriptionRequest.productId);
    });
});
setInterval(function () {
    generateNewBids();
    broadcastNewBidsToSubscribers();
}, 2000);
var subscriptions = new Map();
function subscribeToProductBids(client, productId) {
    var products = subscriptions.get(client) || [];
    subscriptions.set(client, __spreadArrays(products, [productId]));
}
var currentBids = new Map();
function generateNewBids() {
    model_1.getProducts().forEach(function (p) {
        var currentBid = currentBids.get(p.id) || p.price;
        var newBid = random(currentBid, currentBid + 5); // Max bid increase is $5
        currentBids.set(p.id, newBid);
    });
}
function broadcastNewBidsToSubscribers() {
    subscriptions.forEach(function (products, ws) {
        if (ws.readyState === 1) { // 1 - READY_STATE_OPEN
            var newBids = products.map(function (pid) { return ({
                productId: pid,
                bid: currentBids.get(pid)
            }); });
            ws.send(JSON.stringify(newBids));
        }
        else {
            subscriptions.delete(ws);
        }
    });
}
function random(low, high) {
    return Math.random() * (high - low) + low;
}
