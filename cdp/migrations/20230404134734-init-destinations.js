'use strict'

var dbm
var type
var seed

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function (options, seedLink) {
    dbm = options.dbmigrate
    type = dbm.dataType
    seed = seedLink
}

exports.up = function (db) {
    return db.createTable('destinations', {
        primary_key: { type: 'int', primaryKey: true, autoIncrement: true },
        id: { type: 'uuid', notNull: true, unique: true },
        name: 'string',
        description: 'string',
        type: 'string',
        config: 'json',
        created_at: { type: 'datetime', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
        updated_at: 'datetime',
        is_deleted: { type: 'boolean', notNull: true, defaultValue: false },
    })
}

exports.down = function (db) {
    return db.dropTable('destinations')
}

exports._meta = {
    version: 1,
}
