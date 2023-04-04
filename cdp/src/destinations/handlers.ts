/**
 * @file Handlers for destination resources
 * @module destinations/handlers
 * @see module:destinations
 *
 * This file is responsible for handling the destination API. It provides
 * handlers for creating, updating, and deleting destinations, as well as
 * listing destinations.
 *
 * Note that we do not delete destinations, but instead mark them as deleted. This
 * is to ensure that we can keep a history of destinations that have been used
 * in the past.
 *
 */

import { randomUUID } from 'crypto'
import Koa from 'koa'
import pg from 'pg'
import { destinationTypes } from '../destination-types/handlers'
import Ajv, { JSONSchemaType } from 'ajv'

type DestinationCreateRequest = {
    id: string
    name: string // Name displayed to the user
    description: string // Description displayed to the user
    type: string // Type of destination, e.g. webhook, email, Stripe etc.
    config: Record<string, unknown> // Configuration for the destination, e.g. webhook URL, email address, Stripe API key etc.
}

const ajv = new Ajv()

const createDestinationRequestSchema: JSONSchemaType<DestinationCreateRequest> = {
    type: 'object',
    properties: {
        name: {
            type: 'string',
            description: 'Name displayed to the user',
        },
        description: {
            type: 'string',
            description: 'Description displayed to the user',
        },
        type: {
            type: 'string',
            description: 'Type of destination, e.g. webhook, email, Stripe etc.',
        },
        config: {
            type: 'object',
            description: 'Configuration for the destination, e.g. webhook URL, email address, Stripe API key etc.',
        },
    },
    required: ['name', 'description', 'type', 'config'],
}

export const createDestinationHandler =
    (database: pg.Client) =>
    async (ctx: Koa.Context): Promise<void> => {
        const requestBody = ctx.request.body
        // Validate the request body using Ajv
        const valid = ajv.validate(requestBody)
        if (!valid) {
            ctx.status = 400
            return
        }
        const destination: DestinationCreateRequest = requestBody
        // Validate the config against the destination type schema
        const config = destination.config
        const destinationType = destinationTypes[destination.type]
        // If the destination type doesn't exist, return a 400
        if (!destinationType) {
            ctx.status = 400
            return
        }
        // If the config doesn't match the schema, return a 400. We use AJV to
        // perform validation.
        const validate = ajv.compile(destinationType.schema)
        const valid = validate(config)
        if (!valid) {
            ctx.status = 400
            return
        }
        const id = randomUUID()
        const result = await database.query(
            'INSERT INTO destinations (id, name, description, type, config) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [id, destination.name, destination.description, destination.type, destination.config]
        )
        ctx.status = 201
        ctx.body = result.rows[0]
    }

export const getDestinationHandler =
    (database: pg.Client) =>
    async (ctx: Koa.Context): Promise<void> => {
        const id = ctx.params.destinationId
        // Validate id is a uuid
        if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
            ctx.status = 400
            return
        }
        const result = await database.query('SELECT * FROM destinations WHERE id = $1 AND is_deleted = false', [id])
        if (result.rowCount === 0) {
            ctx.status = 404
            return
        }
        ctx.status = 200
        ctx.body = result.rows[0]
    }

export const updateDestinationHandler =
    (database: pg.Client) =>
    async (ctx: Koa.Context): Promise<void> => {
        // NOTE: you cannot update a deleted destination. In the case that you
        // try to update a deleted destination, we will return a 404. This is
        // detected by the update row count being 0.
        const destination: DestinationCreateRequest = ctx.request.toJSON()
        const id = ctx.params.destinationId
        // Validate id is a uuid
        if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
            ctx.status = 400
            return
        }
        const result = await database.query(
            'UPDATE destinations SET name = $1, description = $2, type = $3, config = $4 WHERE id = $5 AND is_deleted = false RETURNING *',
            [destination.name, destination.description, destination.type, destination.config, id]
        )
        if (result.rowCount === 0) {
            ctx.status = 404
            return
        }
        ctx.status = 200
    }

export const deleteDestinationHandler =
    (database: pg.Client) =>
    async (ctx: Koa.Context): Promise<void> => {
        // NOTE: we do not delete the destination, but instead mark it as deleted
        const id = ctx.params.destinationId
        // Validate id is a uuid
        if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
            ctx.status = 400
            return
        }
        await database.query('UPDATE destinations SET is_deleted = true WHERE id = $1', [id])
        ctx.status = 204
    }
