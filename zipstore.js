/**
 * Stores an array of files into a <code>.zip</code>-formatted <code>Blob</code> (type: <code>application/zip</code>)<br>
 * <br>
 * Example with 2 text files:
 * <pre><code>
 *     const te=new TextEncoder();
 *     const blob = zipstore([
 *         {
 *             name: "hello.txt",
 *             date: new Date(),
 *             data: te.encode("Hello World!")
 *         },{
 *             name: "lorem.txt",
 *             date: new Date(),
 *             data: te.encode("Lorem ipsum dolor sit amet...")
 *         }
 *     ]);
 * </code></pre>
 * @param {Object[]} files The array of files to be packed into a zip file
 * @param {string} files[].name Name of a file
 * @param {Date} files[].date Timestamp of a file
 * @param {Uint8Array} files[].data Content of a file
 * @returns {Blob}
 */
function zipstore(files) {
    const textencoder = new TextEncoder();
    const backpoly = 0xEDB88320;
    const stream = [];
    const directory = [];
    let offset = 0;
    let dirsize = 0;
    for (const {name, date, data} of files) {
        const namecode = textencoder.encode(name);
        const timecode = (date.getHours() << 11) + (date.getMinutes() << 5) + (date.getSeconds() >> 1);
        const datecode = ((date.getFullYear() - 1980) << 9) + ((date.getMonth() + 1) << 5) + date.getDate();
        let crc = -1;
        for (let byte of data) {
            crc ^= byte;
            for (let i = 0; i < 8; i++)
                crc = (crc >>> 1) ^ (backpoly & (-(crc & 1)));
        }
        crc ^= -1;

        const header = new DataView(new ArrayBuffer(30)); // 30-byte local header, without filename
        header.setUint32(0, 0x04034b50, true);            // local file header signature     4 bytes  (0x04034b50)
        header.setUint16(4, 10, true);                    // version needed to extract       2 bytes
        header.setUint16(6, 0, true);                     // general purpose bit flag        2 bytes
        header.setUint16(8, 0, true);                     // compression method              2 bytes
        header.setUint16(10, timecode, true);             // last mod file time              2 bytes
        header.setUint16(12, datecode, true);             // last mod file date              2 bytes
        header.setUint32(14, crc, true);                  // crc-32                          4 bytes
        header.setUint32(18, data.length, true);          // compressed size                 4 bytes
        header.setUint32(22, data.length, true);          // uncompressed size               4 bytes
        header.setUint16(26, namecode.length, true);      // file name length                2 bytes
        header.setUint16(28, 0, true);                    // extra field length              2 bytes

        const entry = new DataView(new ArrayBuffer(46));  // 46-byte central directory entry, without filename
        entry.setUint32(0, 0x02014b50, true);             // central file header signature   4 bytes  (0x02014b50)
        entry.setUint16(4, 0x3F, true);                   // version made by                 2 bytes
        entry.setUint16(6, 10, true);                     // version needed to extract       2 bytes
        entry.setUint16(8, 0, true);                      // general purpose bit flag        2 bytes
        entry.setUint16(10, 0, true);                     // compression method              2 bytes
        entry.setUint16(12, timecode, true);              // last mod file time              2 bytes
        entry.setUint16(14, datecode, true);              // last mod file date              2 bytes
        entry.setUint32(16, crc, true);                   // crc-32                          4 bytes
        entry.setUint32(20, data.length, true);           // compressed size                 4 bytes
        entry.setUint32(24, data.length, true);           // uncompressed size               4 bytes
        entry.setUint16(28, namecode.length, true);       // file name length                2 bytes
        entry.setUint16(30, 0, true);                     // extra field length              2 bytes
        entry.setUint16(32, 0, true);                     // file comment length             2 bytes
        entry.setUint16(34, 0, true);                     // disk number start               2 bytes
        entry.setUint16(36, 0, true);                     // internal file attributes        2 bytes
        entry.setUint32(38, 0x20, true);                  // external file attributes        4 bytes
        entry.setUint32(42, offset, true);                // relative offset of local header 4 bytes

        stream.push(header, namecode, data);
        directory.push(entry, namecode);
        offset += header.byteLength + namecode.length + data.length;
        dirsize += entry.byteLength + namecode.length;
    }
    const eocd = new DataView(new ArrayBuffer(22));     // 22-byte EOCD header
    eocd.setUint32(0, 0x06054b50, true);                // end of central dir signature    4 bytes  (0x06054b50)
    eocd.setUint16(4, 0, true);                         // number of this disk             2 bytes
    eocd.setUint16(6, 0, true);                         // diskofdir                       2 bytes
    eocd.setUint16(8, files.length, true);              // entriesondisk                   2 bytes
    eocd.setUint16(10, files.length, true);             // entriestotal                    2 bytes
    eocd.setUint32(12, dirsize, true);                  // dirsize                         4 bytes
    eocd.setUint32(16, offset, true);                   // dirpos                          4 bytes
    eocd.setUint16(20, 0, true);                        // commentsize                     2 bytes
    stream.push(...directory, eocd);
    return new Blob(stream, {type: "application/zip"});
}
