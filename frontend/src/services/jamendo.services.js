import axios from 'axios';

const JAMENDO_CLIENT_ID = '56b41278'; // Public Jamendo Client ID

// Fallback music tracks (Royalty free previews)
const FALLBACK_TRACKS = [
    {
        id: 'fb-1',
        name: 'Chill Lofi Study Beats',
        artist_name: 'Lofi Chill',
        audio: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
        audiodownload: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
        duration: 120,
    },
    {
        id: 'fb-2',
        name: 'Upbeat Summer Vibe',
        artist_name: 'Sunny Day',
        audio: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=upbeat-pop-10297.mp3',
        audiodownload: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=upbeat-pop-10297.mp3',
        duration: 90,
    },
    {
        id: 'fb-3',
        name: 'Acoustic Morning Coffee',
        artist_name: 'Guitar Chill',
        audio: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_8b22a08ca9.mp3?filename=acoustic-guitar-10398.mp3',
        audiodownload: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_8b22a08ca9.mp3?filename=acoustic-guitar-10398.mp3',
        duration: 110,
    },
];

export const searchJamendoTracks = async (query = '', limit = 15) => {
    try {
        const response = await axios.get('https://api.jamendo.com/v3.0/tracks/', {
            params: {
                client_id: JAMENDO_CLIENT_ID,
                format: 'json',
                limit,
                search: query || 'pop lofi chill',
                include: 'musicinfo',
            },
            timeout: 5000,
        });

        if (response.data && response.data.results && response.data.results.length > 0) {
            return response.data.results.map((track) => ({
                id: track.id,
                name: track.name,
                artist_name: track.artist_name,
                audio: track.audio ? track.audio.replace('http://', 'https://') : '',
                audiodownload: track.audiodownload ? track.audiodownload.replace('http://', 'https://') : track.audio,
                duration: track.duration,
                image: track.image || track.album_image,
            }));
        }

        return FALLBACK_TRACKS;
    } catch (error) {
        console.warn('Jamendo API error or offline fallback:', error);
        return FALLBACK_TRACKS;
    }
};
