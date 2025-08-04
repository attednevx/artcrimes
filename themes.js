export const themes = [
  { date: "2025-08-04", theme: "Summer" },
  { date: "2025-08-05", theme: "Rain" },
  { date: "2025-08-06", theme: "Forest" },
  { date: "2025-08-07", theme: "City" },
  // Dodaj dalje...
];

// Funkcija za dohvat današnje teme
export function getTodaysTheme() {
  const today = new Date().toISOString().slice(0, 10);
  const found = themes.find(t => t.date === today);
  return found ? found.theme : "No topic for today!";
}