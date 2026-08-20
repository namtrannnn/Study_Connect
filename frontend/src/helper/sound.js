export const playMessageSound = () => {
    try {
        const audio = new Audio('/sounds/message_sound.mp3');
        audio.play().catch((err) => {
            // Tự động phát âm thanh có thể bị trình duyệt chặn nếu người dùng chưa tương tác DOM
            console.log('Audio autoplay blocked or failed:', err);
        });
    } catch (error) {
        console.log('playMessageSound error:', error);
    }
};
