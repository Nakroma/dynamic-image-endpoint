import express from 'express';
import sharp from 'sharp';
import path from 'path';
import http from 'http';
import fs from 'fs';
import handler from '../src/index';

let app = {} as express.Application;
let server = {} as http.Server;

const BASE_PATH = './test';
const TEST_FILE = 'test.png';

// Hooks
beforeAll((done) => {
    // Create test image
    void sharp({
        create: {
            width: 200,
            height: 100,
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
            server = app.listen(3000, done);
        });
})
afterAll(() => {
    // Cleanup
    server.close();
    fs.rmSync(path.join(BASE_PATH, TEST_FILE));
})

test('test test', () => {
    expect(true).toBe(true);
})
