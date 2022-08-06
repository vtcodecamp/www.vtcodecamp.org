const { resizeAndSaveProfilePictures } = require('./update-photos')

main();

async function main() {
    let speakers = [
        {profilePicture: 'https://sessionize.com/image/55cd-400o400o2-55db796c-e2ac-4d0a-9de7-5d7af464c7fc.jpg', slug: 'Kyle-Mitofsky'},
        {profilePicture: 'https://sessionize.com/image/5a07-400o400o2-d5-c5c4-4e4c-8f82-b088d5d797b7.2a67da9c-2879-499e-a0ec-d5501223b710.jpg', slug: 'Zeke-Farwell' },
        {profilePicture: "https://sessionize.com/image/bad-url.jpg", slug: "Bad-Url"},
        {profilePicture: null, slug: "Missing-Url"},
    ]

    const speakersObj = speakers.slice(0).reduce((acc, cur) => {
        acc[cur.slug] = cur
        return acc;
    }, {})

    await resizeAndSaveProfilePictures(speakersObj)
}
