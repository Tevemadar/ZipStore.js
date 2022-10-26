# ZipStore.js

Minimalistic JS implementation of packing "files" (`Uint8Array` instances coupled with filename and timestamp) into a `.zip` archive in a browser. No compression is implemented, "store" method (0) is used.

Small example with 2 text files:

    const te=new TextEncoder();
    const blob = zipstore([
        {
            name: "hello.txt",
            date: new Date(),
            data: te.encode("Hello World!")
        },{
            name: "lorem.txt",
            date: new Date(),
            data: te.encode("Lorem ipsum dolor sit amet...")
        }
    ]);

Live example page with text and image files: [https://tevemadar.github.io/ZipStore.js](https://tevemadar.github.io/ZipStore.js)