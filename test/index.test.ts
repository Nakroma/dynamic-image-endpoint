import express from 'express';
import sharp from 'sharp';
import path from 'path';
import http from 'http';
import fs from 'fs';
import fetch from 'node-fetch';
import handler from '../src/index';

let app = {} as express.Application;
let server = {} as http.Server;

const BASE_PATH = './test';
const TEST_FILE = 'test.png';
const TEST_FILE_GENERATED = 'test_w100.png';
const TEST_FILE_W = 200;
const TEST_FILE_H = 100;
const EXPRESS_PORT = 3000;

// Hooks
beforeAll((done) => {
    // Create test image
    void sharp({
        create: {
            width: TEST_FILE_W,
            height: TEST_FILE_H,
            channels: 4,
            background: { r: 255, g: 0, b: 0, alpha: 0.5 },
        }
    })
        .png()
        .toFile(path.join(BASE_PATH, TEST_FILE))
        .then(() => {
            // Prepare express app
            app = express();
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            app.get('*', handler(BASE_PATH));
            server = app.listen(EXPRESS_PORT, done);
        });
})
afterAll(() => {
    // Cleanup
    server.close();
    fs.rmSync(path.join(BASE_PATH, TEST_FILE), { force: true });
    fs.rmSync(path.join(BASE_PATH, TEST_FILE_GENERATED), { force: true });
})
beforeEach(() => {
    // Delete generated file
    fs.rmSync(path.join(BASE_PATH, TEST_FILE_GENERATED), { force: true });
})

test('Serves original file', async () => {
    const res = await fetch(`http://localhost:${EXPRESS_PORT}/${TEST_FILE}`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');

    const servedBuffer = await res.arrayBuffer();
    const originalBuffer = (await fs.promises.readFile(path.join(BASE_PATH, TEST_FILE))).buffer;
    expect(servedBuffer.byteLength).toBe(originalBuffer.byteLength);
})

test('Serves resized file', async () => {
    const res = await fetch(`http://localhost:${EXPRESS_PORT}/${TEST_FILE}?width=${TEST_FILE_W / 2}`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');

    const servedBuffer = await res.arrayBuffer();
    const generatedFile = (await fs.promises.readFile(path.join(BASE_PATH, TEST_FILE_GENERATED)));
    expect(servedBuffer.byteLength).toBe(generatedFile.buffer.byteLength);

    const generatedMetadata = await sharp(generatedFile).metadata();
    expect(generatedMetadata.width).toBe(TEST_FILE_W / 2);
    expect(generatedMetadata.height).toBe(TEST_FILE_H / 2);
})

test('Serves resized file again instead of remaking it', async () => {
    const resFirst = await fetch(`http://localhost:${EXPRESS_PORT}/${TEST_FILE}?width=${TEST_FILE_W / 2}`);
    expect(resFirst.status).toBe(200);
    expect(resFirst.headers.get('content-type')).toBe('image/png');

    const prev = await fs.promises.stat(path.join(BASE_PATH, TEST_FILE_GENERATED));

    await new Promise(resolve => setTimeout(resolve, 10));
    const resSecond = await fetch(`http://localhost:${EXPRESS_PORT}/${TEST_FILE}?width=${TEST_FILE_W / 2}`);
    expect(resSecond.status).toBe(200);
    expect(resSecond.headers.get('content-type')).toBe('image/png');
    expect((await resFirst.arrayBuffer()).byteLength)
        .toBe((await resSecond.arrayBuffer()).byteLength);

    const curr = await fs.promises.stat(path.join(BASE_PATH, TEST_FILE_GENERATED));
    expect(curr.mtimeMs).toBe(prev.mtimeMs);
})

test('404 if file is not found', async () => {
    const res = await fetch(`http://localhost:${EXPRESS_PORT}/doesnotexist.png`);
    expect(res.status).toBe(404);
})

test('404 if file is not found with width', async () => {
    const res = await fetch(`http://localhost:${EXPRESS_PORT}/doesnotexist.png?width=100`);
    expect(res.status).toBe(404);
})
