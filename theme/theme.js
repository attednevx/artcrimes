document.addEventListener("DOMContentLoaded", function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
    } else {
        document.body.classList.remove('dark');
    }
    const toggleDark = document.getElementById('toggleDark');
    if (toggleDark) {
        toggleDark.textContent = document.body.classList.contains('dark') ? "☀️" : "🌙";
        toggleDark.onclick = function() {
            document.body.classList.toggle('dark');
            localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
            toggleDark.textContent = document.body.classList.contains('dark') ? "☀️" : "🌙";
            if (typeof drawBgCanvas === "function") drawBgCanvas();
            if (typeof renderAll === "function") renderAll();
        };
    }
});