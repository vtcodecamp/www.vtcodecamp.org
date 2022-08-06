const path = require('path');
const fsSync = require('fs');
const fs = fsSync.promises;
const fetch = require('node-fetch'); // must be pinned to 2.x to use require syntax
const https = require('https');
const sharp = require('sharp');

const SESSIONIZE_URL = 'https://sessionize.com/api/v2/rffu883w/view/all'
const PROJECT_ROOT_PATH = path.join(__dirname, "..");
const SPEAKER_IMAGE_PATH = `${PROJECT_ROOT_PATH}/src/assets/speakers/`
const DATA_PATH = `${PROJECT_ROOT_PATH}/src/_data/`;


module.exports = updateData();

async function updateData()
{
    const response = await fetch(SESSIONIZE_URL);
    const sessionize = await response.json();

    // make sure we have profile dir
    await fs.mkdir(SPEAKER_IMAGE_PATH, {recursive: true});

    const speakers = buildSpeakers(sessionize.speakers);
    const [levels, formats] = parseCategories(sessionize.categories);
    const sessions = buildSessions(sessionize.sessions, levels, formats);
    const rooms = flattenArrayToObj(sessionize.rooms);

    // update speaker/session slugs
    for (let speakerId in speakers) {
        speakers[speakerId].sessions = speakers[speakerId].sessions.map(sessionId => {
            return {id: sessionId, slug: sessions[sessionId].slug}
        })
    }

    for (let sessionId in sessions) {
        sessions[sessionId].speakers = sessions[sessionId].speakers.map(speakerId => {
            return {id: speakerId, slug: speakers[speakerId].slug}
        })
    }

    writeDataFile('sessions.json', sessions);
    writeDataFile('speakers.json', speakers);
    writeDataFile('rooms.json', rooms);
}


function parseCategories(categories) {
    var levels = {};
    var formats = {};

    for (let category of categories) {
        if (category.title == 'Level') {
            for (var level of category.items) {
                levels[level.id] = level;
            }
        } else if (category.title == 'Session format') {
            for (var format of category.items) {
                formats[format.id] = format;
            }
        }
    }

    return [levels, formats]
}

function buildSpeakers(speakersData) {
    for (let speaker of speakersData) {

        // build full links
        for (let link of speaker.links) {
            link.name = link.title;
            switch (link.linkType) {
                case 'Twitter':
                    link.name = '@' + link.url.replace(/https*:\/\/(www\.)*twitter.com\//gi, '')
                                              .replace(/\/?(\?.*)?$/, '');
                    break;
                case 'Blog':
                case 'Company_Website':
                    link.name = link.url.replace(/https*:\/\/(www\.)*/gi, '')
                                        .replace(/\/?(\?.*)?$/, '')
                                        .replace(/\/.*/, '');
                    break;
            }
        }

        // create slug
        speaker.slug = slugify(speaker.firstName + " " + speaker.lastName)

        // copy and optimize profile picture
        if (speaker.profilePicture) {
            let profilePictureFilename = speaker.slug + '.jpg';
            speaker.localProfilePicture = `/assets/speakers/${profilePictureFilename}`;
            resizeAndSaveProfilePicture(speaker.profilePicture, profilePictureFilename);
        }
    }

    return flattenArrayToObj(speakersData)
}

/**
 * Download profile speaker profile picture from Sessionize
 * Resize to 192px square and save as optimized jpeg file
 * Uses the Sharp node module for image manipulation
 * http://sharp.pixelplumbing.com/en/stable/
 * @param string sessionizePictureUrl
 * @param string filename
 */
function resizeAndSaveProfilePicture(sessionizePictureUrl, filename) {

    const savePath =  SPEAKER_IMAGE_PATH + filename;

    https.get(sessionizePictureUrl, function (imageStream) {
        // TODO - handle failures gracefully
        let resizeTransform = sharp()
            .resize(192, 192, { fit: 'inside', withoutEnlargement: true })
            .jpeg();
        let writeStream = fsSync.createWriteStream(savePath);
        imageStream.pipe(resizeTransform).pipe(writeStream);
    })
}


function buildSessions(sessionsData, levels, formats) {
    for (let session of sessionsData) {

        // apply level and category labels
        for (let categoryId of session.categoryItems) {
            if (categoryId in levels) {
                session.level = levels[categoryId].name;
            } else if (categoryId in formats) {
                session.format = formats[categoryId].name;
            }
        }

        // create slug
        session.slug = slugify(session.title);
    }

    return flattenArrayToObj(sessionsData);
}



async function writeDataFile(filename, object) {

    let filePath = `${DATA_PATH}${filename}`;
    let content = JSON.stringify(object, null, 4);

    try {
        await fs.writeFile(filePath, content)
        console.log(`Sessionize data written to ${filePath}`);
    } catch (error) {
        return console.log(err);
    }
}

function flattenArrayToObj(array) {
    let object = {};

    for (let item of array) {
        object[item.id] = item;
    }

    return object;
}

function slugify(s) {
    // strip special chars
    let newStr = s.replace(/[^a-z0-9 ]/gi,'').toLowerCase();
    // take first 6 words and separate with "-""
    newStr = newStr.split(" ").filter(x=>x).slice(0,9).join("-");
    return newStr;
}
