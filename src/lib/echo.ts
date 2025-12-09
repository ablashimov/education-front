import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axios from 'axios';

declare global {
    interface Window {
        Pusher: any;
        Echo: any;
    }
}

window.Pusher = Pusher;

const backendUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://education.local';

const echo = new Echo({
    broadcaster: 'pusher',
    key: 'app-key',
    wsHost: window.location.hostname,
    wsPort: 6001,
    wssPort: 6001,
    forceTLS: false,
    encrypted: false,
    disableStats: true,
    enabledTransports: ['ws', 'wss'],
    cluster: 'mt1',
    authEndpoint: `${backendUrl}/api/broadcasting/auth`,
    auth: {
        headers: {
            'Accept': 'application/json',
        },
    },
    authorizer: (channel: any) => {
        return {
            authorize: (socketId: string, callback: Function) => {
                axios.post(`${backendUrl}/api/broadcasting/auth`, {
                    socket_id: socketId,
                    channel_name: channel.name
                }, {
                    withCredentials: true,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    }
                })
                    .then(response => {
                        callback(null, response.data);
                    })
                    .catch(error => {
                        console.log(error);
                        callback(error);
                    });
            }
        };
    },
});

export default echo;
