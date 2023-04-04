/*

REST API for adding, updating, removing, and listing Destination. A Destination
represents a remote location that events should be sent to. The REST API tries
to be as simple as possible, and only supports JSON. It also tries to be of the
same response style as the API from the Django part of the application which
uses Django REST Framework. `Destination`s are stored in a separate logical
PostgreSQL database to the main application database to provide a clear
separation of concerns and limit the impact of e.g. heavy usage of the database
from the main application.

We also provide a read only DestinationType resource, which is used to list
the available DestinationTypes. This is used to retrieve the available
DestinationTypes for use as `Destination.type` as well as the schema for the 
`Destination.config` field. These types are defined in code for now, but it's 
possible that we will want to move them to the database in the future to allow
dynamic addition of new `DestinationType`s.

The implementation is based on Koajs, which is a popular Node.js web
application framework. Below we define the Koa application and the routes for
the REST API, using handlers defined in the `handlers.ts` files.

We do not at this point separate out the implementation
into Services, Repositories, and Controllers, but instead keep it all in one 
file, although that could be an improvement in the future if we find ourselves
using the destinations API in other parts of the CDP application.

*/ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _assert = /*#__PURE__*/ _interop_require_default(require("assert"));
const _koa = /*#__PURE__*/ _interop_require_default(require("koa"));
const _koarouter = /*#__PURE__*/ _interop_require_default(require("koa-router"));
const _pg = /*#__PURE__*/ _interop_require_default(require("pg"));
const _handlers = require("./destination-types/handlers");
const _handlers1 = require("./destinations/handlers");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const getApp = ()=>{
    const app = new _koa.default();
    const router = new _koarouter.default();
    (0, _assert.default)(process.env.DATABASE_URL, 'DATABASE_URL environment variable must be set');
    const database = new _pg.default.Client(process.env.DATABASE_URL);
    database.connect();
    router.get('/api/projects/:projectId/destination-types', _handlers.listDestinationTypesHandler);
    router.post('/api/projects/:projectId/destinations', (0, _handlers1.createDestinationHandler)(database));
    router.put('/api/projects/:projectId/destinations/:destinationId', (0, _handlers1.updateDestinationHandler)(database));
    router.delete('/api/projects/:projectId/destinations/:destinationId', (0, _handlers1.deleteDestinationHandler)(database));
    app.use(router.routes());
    app.use(router.allowedMethods());
    return app;
};
const app = getApp();
app.listen(3000);
