document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('greetingTagline');
    if (!el) return;

    const greetings = [
        { text: "Xin Chào Gayer !",    color: "#ff3b5c" },   // Việt   – Đỏ hồng
        { text: "Hello Gayer !",        color: "#ff8c00" },   // Anh    – Cam
        { text: "你好，给友 !",           color: "#f0c030" },   // Trung  – Vàng
        { text: "नमस्ते, गे दोस्त !",  color: "#4ade80" },   // Hindi  – Xanh lá
        { text: "¡Hola, gay !",         color: "#38bdf8" },   // TBN    – Xanh da trời
        { text: "Salut, gay !",         color: "#a78bfa" },   // Pháp   – Tím
        { text: "Привет, гей !",        color: "#f472b6" },   // Nga    – Hồng
    ];

    let idx = 0;

    // Ensure CSS transition is applied
    el.style.transition = "opacity 0.5s ease, transform 0.5s ease, color 0.5s ease, text-shadow 0.5s ease";

    function applyGreeting(g) {
        el.style.color       = g.color;
        el.style.textShadow  = `0 0 16px ${g.color}88, 0 0 6px ${g.color}55`;
    }

    // Apply first greeting immediately (no transition on load)
    applyGreeting(greetings[0]);

    setInterval(() => {
        // Step 1 – fade out + slide up
        el.style.opacity   = "0";
        el.style.transform = "translateY(-6px)";

        setTimeout(() => {
            // Step 2 – swap text & colour while invisible
            idx = (idx + 1) % greetings.length;
            applyGreeting(greetings[idx]);
            el.textContent   = greetings[idx].text;
            el.style.transform = "translateY(6px)";   // reset below

            // Step 3 – fade in + slide up to neutral
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    el.style.opacity   = "1";
                    el.style.transform = "translateY(0)";
                });
            });
        }, 520); // slightly longer than the 0.5s CSS transition

    }, 4000); // rotate every 4 s
});
