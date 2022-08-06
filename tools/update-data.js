const path = require('path');
const fs = require('fs').promises;
const got = require("got"); // must be pinned to 11.8.5 to use CJS Require  syntax
const { resizeAndSaveProfilePictures } = require('./update-photos')

const SESSIONIZE_URL = 'https://sessionize.com/api/v2/rffu883w/view/all'
const PROJECT_ROOT_PATH = path.join(__dirname, "..");
const SPEAKER_IMAGE_PATH = `${PROJECT_ROOT_PATH}/src/assets/speakers/`
const DATA_PATH = `${PROJECT_ROOT_PATH}/src/_data/`;


module.exports = updateData();

async function updateData()
{
    const sessionize = await got(SESSIONIZE_URL).json();

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


    await writeDataFile('sessions.json', sessions);
    await writeDataFile('speakers.json', speakers);
    await writeDataFile('rooms.json', rooms);

    await resizeAndSaveProfilePictures(speakers);
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
