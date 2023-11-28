import { execSync } from 'node:child_process';
import { randomBytes, scryptSync, createHash } from 'node:crypto'
import fs from 'node:fs';
import path from 'node:path'
import archiver from 'archiver'


export type ZipParams = {
    level: number,
    input: string,
    output: string,
    exclude?: string[]
}

export const zip = async (params: ZipParams) => {
    const output = fs.createWriteStream(params.output);

    const archive = archiver('zip', {
        zlib: { level: params.level, }, // Sets the compression level.

    });

    // listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    output.on('close', function () {
        console.log(archive.pointer() + ' total bytes');
        console.log('archiver has been finalized and the output file descriptor has closed.');
    });

    // This event is fired when the data source is drained no matter what was the data source.
    // It is not part of this library but rather from the NodeJS Stream API.
    // @see: https://nodejs.org/api/stream.html#stream_event_end
    output.on('end', function () {
        console.log('Data has been drained');
    });


    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function (err) {
        console.warn(err)

        // throw error
        // throw err;

    });

    // good practice to catch this error explicitly
    archive.on('error', function (err) {
        console.error(err)

        throw err;
    });

    // pipe archive data to the file
    archive.pipe(output);

    archive.glob(
        '**/*',
        {
            cwd: path.resolve(process.cwd(), params.input),
            ignore: params.exclude,
            follow: true
        }
    )

    await archive.finalize()
}


/**
 * Get the hash from a file
 * 
 * @param file 
 * @returns 
 */
export const fileHash = (file: string) => {

    const fileBuffer = fs.readFileSync(file);

    const hashSum = createHash('sha256').update(fileBuffer);

    const hex = hashSum.digest('hex');

    return hex
}

function generateKey(size = 32, format: BufferEncoding = 'hex') {
    const buffer = randomBytes(size);
    return buffer.toString(format);
}

function generateSecretHash(key: string) {
    const salt = generateKey(8);
    const buffer = scryptSync(key, salt, 64) as Buffer;
    return `${buffer.toString('hex')}.${salt}`;
}

/**
 * 
 * is this a production environment
 * 
 * @param stage 
 * @returns 
 */
export const isProduction = (stage: string) => {
    return ['prod', 'production'].includes(stage)
}

export const keys = {
    APP_KEYS: [generateKey(32), generateKey(32)].join(','),
    ADMIN_JWT_SECRET: generateSecretHash(generateKey(8)),
    JWT_SECRET: generateSecretHash(generateKey(8)),
    API_TOKEN_SALT: generateKey(8),
    TRANSFER_TOKEN_SALT: generateKey(8),
    FLAG_PROMOTE_EE: "0"
}
