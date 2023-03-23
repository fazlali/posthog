import { beforeEach, expect, it, describe, vi } from 'vitest'

import { createChunkedIncomingRecordingMessage, createIncomingRecordingMessage } from '../../test/fixtures'
import { SessionManager } from './session-manager'
import fs from 'node:fs'
import { compressToString } from '../utils/compression'

describe('session-manager', () => {
    let sessionManager: SessionManager
    const mockFinish = vi.fn()
    beforeEach(async () => {
        sessionManager = new SessionManager(1, 'session_id_1', mockFinish)
        mockFinish.mockClear()
    })

    it('adds a message', async () => {
        const payload = JSON.stringify([{ simple: 'data' }])
        const event = createIncomingRecordingMessage({
            data: compressToString(payload),
        })
        await sessionManager.add(event)

        expect(sessionManager.buffer).toEqual({
            count: 1,
            createdAt: expect.any(Date),
            file: expect.any(String),
            id: expect.any(String),
            size: 72, // The size of the event payload - this may change when test data changes
        })
        const fileContents = JSON.parse(fs.readFileSync(sessionManager.buffer.file, 'utf-8'))
        expect(fileContents.data).toEqual(payload)
    })

    it('flushes messages', async () => {
        const event = createIncomingRecordingMessage()
        await sessionManager.add(event)
        expect(sessionManager.buffer.count).toEqual(1)
        const file = sessionManager.buffer.file
        expect(fs.existsSync(file)).toEqual(true)

        const flushPromise = sessionManager.flush()

        expect(sessionManager.buffer.count).toEqual(0)
        expect(sessionManager.flushBuffer.count).toEqual(1)

        await flushPromise

        expect(sessionManager.flushBuffer).toEqual(undefined)
        expect(mockFinish).toBeCalledTimes(1)
        expect(fs.existsSync(file)).toEqual(false)
    })

    it('flushes messages and remains if others added in the mean time', async () => {
        const event = createIncomingRecordingMessage()
        const event2 = createIncomingRecordingMessage()
        await sessionManager.add(event)
        expect(sessionManager.buffer.count).toEqual(1)

        const flushPromise = sessionManager.flush()
        sessionManager.add(event2)

        expect(sessionManager.buffer.count).toEqual(1)
        expect(sessionManager.flushBuffer.count).toEqual(1)

        await flushPromise

        expect(sessionManager.flushBuffer).toEqual(undefined)
        expect(mockFinish).toBeCalledTimes(0)
    })

    it('chunks incoming messages', async () => {
        const events = createChunkedIncomingRecordingMessage(3, {
            data: compressToString(JSON.stringify([{ simple: 'data' }])),
        })

        expect(events[0].data).toEqual('H4sIAAAAAAAAE4tmqGZQYihm')
        expect(events[1].data).toEqual('yGTIZShgyGFIBfKsgDiFIZGh')
        expect(events[2].data).toEqual('BIiVGGoZYhkAOTL8NSYAAAA=')

        await sessionManager.add(events[0])
        expect(sessionManager.buffer.count).toEqual(0)
        expect(sessionManager.chunks.size).toEqual(1)

        await sessionManager.add(events[2])
        expect(sessionManager.buffer.count).toEqual(0)
        expect(sessionManager.chunks.size).toEqual(1)

        await sessionManager.add(events[1])
        expect(sessionManager.buffer.count).toEqual(1)
        expect(sessionManager.chunks.size).toEqual(0)

        const fileContents = JSON.parse(fs.readFileSync(sessionManager.buffer.file, 'utf-8'))
        expect(fileContents.data).toEqual('[{"simple":"data"}]')
    })
})
