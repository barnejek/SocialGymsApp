const fs = require('fs');
const { PNG } = require('pngjs');

function processImage(filePath) {
  fs.createReadStream(filePath)
    .pipe(new PNG({ filterType: 4 }))
    .on('parsed', function() {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          let idx = (this.width * y + x) << 2;

          let r = this.data[idx];
          let g = this.data[idx + 1];
          let b = this.data[idx + 2];

          // The background is #151628 (21, 22, 40). 
          // The logo is Orange/White.
          // We can remove any dark pixel that looks like the background.
          // Let's remove anything where r < 40, g < 40, b < 60
          // For anti-aliased edges, we should ideally compute an alpha based on distance from the background color.
          const bgR = 21, bgG = 22, bgB = 40;
          const dist = Math.sqrt(Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2));

          if (dist < 40) {
            // Make completely transparent if very close to background
            if (dist < 15) {
                this.data[idx + 3] = 0;
            } else {
                // Smooth alpha for anti-aliasing edges
                // dist goes from 15 to 40. Alpha goes from 0 to 255.
                let alpha = Math.floor(((dist - 15) / 25) * 255);
                this.data[idx + 3] = alpha;
            }
          }
        }
      }

      this.pack().pipe(fs.createWriteStream(filePath.replace('.png', '_transparent.png')));
      console.log(`Processed ${filePath}`);
    });
}

processImage('assets/images/sg_app_big.png');
processImage('assets/images/sg_app_small.png');
