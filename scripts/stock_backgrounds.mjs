
import fs from 'fs';
import path from 'path';
import https from 'https';

const categories = {
    premium: ['dark blue geometric', 'indigo refined texture', 'slate modern abstract', 'corporate dark tech', 'subtle navy mesh'],
    minimal: ['white uneven concrete', 'light gray paper texture', 'soft white shadows', 'minimalist architecture detail', 'clean white marble'],
    nature: ['blurred forest foliage', 'soft morning sunlight leaves', 'green gradient organic', 'calm lake reflection', 'wood grain texture'],
    pop: ['vibrant abstract shapes', 'yellow pink gradient', 'colorful memphis pattern', 'bright orange curves', 'playful confetti abstract'],
    cyber: ['neon blue grid', 'cyberpunk city bokeh', 'digital circuit board blue', 'matrix rain abstract', 'futuristic hexagon pattern'],
    luxury: ['black and gold marble', 'dark silk texture', 'gold dust on black', 'luxury leather texture', 'premium geometric gold lines'],
    japanese: ['washi paper texture', 'seigaiha pattern subtle', 'bamboo texture', 'cherry blossom soft blur', 'japanese indigo fabric'],
    sky: ['blue sky white clouds', 'beautiful sunrise gradient', 'soft blue sky texture', 'starry night sky', 'golden hour sky'],
    abstract: ['soft pastel gradient', 'vivid liquid colors', 'glassmorphism background', 'bokeh lights abstract', 'white geometric 3d', 'dark smoke abstract', 'colorful oil painting blur', 'white ceramic texture', 'frosted glass texture', 'soft warm gradient']
};

const outputDir = path.join(process.cwd(), 'public', 'assets', 'stock');

const downloadImage = (url, filepath) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });
    });
};

const main = async () => {
    let count = 0;
    for (const [cat, prompts] of Object.entries(categories)) {
        for (let i = 0; i < prompts.length; i++) {
            const prompt = prompts[i] + ', high quality, 8k, wallpaper, no text';
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1920&height=1080&nologo=true`;
            const filename = `${cat}_${i + 1}.jpg`;
            const filepath = path.join(outputDir, filename);

            console.log(`Downloading ${filename}...`);
            try {
                await downloadImage(url, filepath);
                count++;
                await new Promise(r => setTimeout(r, 200)); // Gentle delay
            } catch (e) {
                console.error(`Error downloading ${filename}:`, e.message);
            }
        }
    }
    console.log(`\nDone! Downloaded ${count} images to ${outputDir}`);
};

main();
