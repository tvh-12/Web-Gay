document.addEventListener('DOMContentLoaded', () => {
    const greetingTagline = document.getElementById('greetingTagline');
    if (!greetingTagline) return;

    const greetings = [
        { text: "Xin Chào Gayer !", color: "rgb(255, 0, 0)" },       // Tiếng Việt - Đỏ
        { text: "Hello Gayer !", color: "rgb(255, 127, 0)" },        // Tiếng Anh - Cam
        { text: "你好，给友 !", color: "rgb(255, 255, 0)" },           // Tiếng Trung - Vàng
        { text: "नमस्ते, गे दोस्त !", color: "rgb(0, 255, 0)" },         // Tiếng Hindi - Xanh lá
        { text: "¡Hola, gay !", color: "rgb(0, 0, 255)" },           // Tiếng Tây Ban Nha - Xanh dương
        { text: "Salut, gay !", color: "rgb(148, 0, 211)" },         // Tiếng Pháp - Tím
        { text: "Привет, гей !", color: "rgb(255, 0, 255)" }         // Tiếng Nga - Hồng cánh sen
    ];

    let currentIndex = 0;

    setInterval(() => {
        // Fade out
        greetingTagline.style.opacity = 0;
        
        setTimeout(() => {
            // Chuyển sang câu chào tiếp theo
            currentIndex = (currentIndex + 1) % greetings.length;
            const nextGreeting = greetings[currentIndex];
            
            greetingTagline.textContent = nextGreeting.text;
            // Thay đổi màu sắc
            greetingTagline.style.color = nextGreeting.color;
            // Thêm hiệu ứng glow nhẹ
            const glowColor = nextGreeting.color.replace('rgb', 'rgba').replace(')', ', 0.5)');
            greetingTagline.style.textShadow = `0 0 15px ${glowColor}`;
            
            // Fade in
            greetingTagline.style.opacity = 1;
        }, 500); // Đợi 0.5s cho hiệu ứng fade out hoàn tất
    }, 4000); // Lặp lại mỗi 4 giây
});
