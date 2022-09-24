import type { Request, Response } from 'express';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

export default function handler(basePath: string) {
    // Wrapper function to return express handler
    return async (req: Request, res: Response) => {
        // Base vars
        const width = (Array.isArray(req.query.width) ? req.query.width[0] : req.query.width) as string | undefined;
        const filePath = req.path.split('/');
        const file = filePath.pop();
        if (!file) return res.status(400).send('Invalid request path.');

        // Generate filename
        const fileSplit = file.split('.');
        if (width) fileSplit[0] += `_w${width}`;
        const fileName = fileSplit.join('.');

        // File paths for original and (possibly) new file
        const originalFilePath = path.resolve(basePath, ...filePath, file);
        const outputFilePath = path.resolve(basePath, ...filePath, fileName);

        try {
            // Check if file exists and send if it does
            await fs.promises.access(outputFilePath, fs.constants.F_OK);
            return res.sendFile(outputFilePath);
        } catch (err) {
            // File does not exist
            if (!width) return res.status(404).send('File not found.');

            try {
                // Try to create it, otherwise 404 if there's no original file
                const buffer = await sharp(originalFilePath)
                    .resize({ width: Number(width) })
                    .toBuffer();

                // Send buffer
                res.writeHead(200, {
                    'Content-Type': `image/${fileSplit.slice(-1)[0]}`,
                    'Content-Length': buffer.length,
                });
                res.end(buffer);

                // Write buffer to file
                return fs.promises.writeFile(outputFilePath, buffer);
            } catch (err) {
                return res.status(404).send('File not found.');
            }
        }
    }
}
