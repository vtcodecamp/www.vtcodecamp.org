const path = require('path');
const fs = require('fs').promises;
const got = require("got"); // must be pinned to 11.8.5 to use CJS Require  syntax
const { resizeAndSaveProfilePictures } = require('./update-photos')

const PROJECT_ROOT_PATH = path.join(__dirname, "..");
const DATA_PATH = `${PROJECT_ROOT_PATH}/src/_data/`;
const SESSIONIZE_URL = 'https://sessionize.com/api/v2/rffu883w/view/all'


module.exports = updateData();

async function updateData()
{
    const sessionize = await got(SESSIONIZE_URL).json();

    // early terminate if not forced and has data loss
    if (!process.env.FORCE && await checkDataLoss(sessionize)) {
        return;
    }

    const [levels, formats] = buildCategories(sessionize.categories);
    const speakers = buildSpeakers(sessionize.speakers);
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

    // write files
    await Promise.all([
        // stored as object for easier lookup
        writeDataFile('sessions.json', sessions),
        writeDataFile('speakers.json', speakers),
        writeDataFile('rooms.json', rooms),
    ])

    // save photos
    await resizeAndSaveProfilePictures(speakers);
}

async function checkDataLoss(sessionize) {
    const [sessions, speakers] = await Promise.all([
        readDataFile('sessions.json'),
        readDataFile('speakers.json'),
    ])

    const missingSpeakers = Object.keys(sessions).length - sessionize.sessions.length
    const missingSessions = Object.keys(speakers).length - sessionize.speakers.length

    const messages = []
    if (missingSpeakers > 0) { messages.push(`${missingSpeakers} speaker(s)`) }
    if (missingSessions > 0) { messages.push(`${missingSessions} sessions(s)`)}

    if (messages.length) {
        console.warn(
`WARNING: You are about to lose ${messages.join(" and ")}
If you wish to proceed, please manually run
\`npm run update-data:force\`
and commit the changes
`)
        return true
    }

    return false

}


function buildCategories(categories) {
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
        }
    }

    return flattenArrayToObj(speakersData)
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
        await fs.writeFile(filePath, content, 'utf8')
        console.log(`Sessionize data written to ${filePath}`);
    } catch (error) {
        return console.log(err);
    }
}

async function readDataFile(filename) {
    let filePath = `${DATA_PATH}${filename}`;

    try {
        const file = await fs.readFile(filePath, 'utf8')
        return JSON.parse(file)
    } catch (error) {
        return {}
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
