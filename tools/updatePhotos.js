const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const got = require("got");


const PROJECT_ROOT_PATH = path.join(__dirname, "..");
const SPEAKER_IMAGE_PATH = `${PROJECT_ROOT_PATH}/src/assets/speakers/`

module.exports = { resizeAndSaveProfilePictures }

async function resizeAndSaveProfilePictures(speakers) {

    try {
        // make sure we have profile dir
        await fs.mkdir(SPEAKER_IMAGE_PATH, {recursive: true});

        const transforms = Object.values(speakers).map(speaker => {
            return resizeAndSaveProfilePicture(speaker.profilePicture, `${speaker.slug}.jpg`)
        })

        await Promise.allSettled(transforms)

    } catch (error) {
        console.log(error);
    }
    // todo - execution not returned
    console.log("Finished processing photos")
}

/**
 * Download profile speaker profile picture from Sessionize
 * Resize to 192px square and save as optimized jpeg file
 * Uses the Sharp node module for image manipulation
 * http://sharp.pixelplumbing.com/en/stable/
 * @param string sessionizePictureUrl
 * @param string filename
 */
async function resizeAndSaveProfilePicture(sessionizePictureUrl, filename) {
    if (!sessionizePictureUrl) {
        console.error(`No url for ${filename}`)
        return;
    }

    const sharpStream = sharp({ failOn: 'none' });

    const savePath = SPEAKER_IMAGE_PATH + filename;

    const prom = sharpStream
        .clone()
        .resize(192, 192, { fit: 'inside', withoutEnlargement: true })
        .jpeg()
        .toFile(savePath)

    got
        .stream(sessionizePictureUrl)
        .on('error', (_err) => console.error(`Error fetching ${sessionizePictureUrl}`))
        .pipe(sharpStream);

    try {
        const _result = await prom
        console.log(`Saved ${filename}`);
    } catch (error) {
        console.error(error)
    }
}
