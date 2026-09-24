const search = document.getElementById("search");
const jobsBox = document.getElementById("jobs");
const filters = document.querySelectorAll(".filters button");

let currentType = "";

async function loadJobs() {
  try {
    const params = new URLSearchParams();

    if (currentType) {
      params.set("type", currentType);
    }

    if (search && search.value.trim()) {
      params.set("q", search.value.trim());
    }

    const res = await fetch("/api/jobs?" + params.toString());
    const jobs = await res.json();

    if (!jobsBox) return;

    if (!jobs.length) {
      jobsBox.innerHTML = "<p>अभी कोई जानकारी उपलब्ध नहीं है।</p>";
      return;
    }

    jobsBox.innerHTML = jobs.map(job => `
      <article class="job-card">
        <h3>${escapeHtml(job.title || "सरकारी भर्ती")}</h3>

        <p><b>विभाग:</b> ${escapeHtml(job.department || job.sourceName || "सरकारी विभाग")}</p>

        <p><b>प्रकार:</b> ${typeName(job.type)}</p>

        <p><b>अंतिम तिथि:</b> ${escapeHtml(job.lastDate || "आधिकारिक सूचना देखें")}</p>

        <a href="/job.html?id=${encodeURIComponent(job.id)}">
          पूरी जानकारी →
        </a>
      </article>
    `).join("");

  } catch (error) {
    if (jobsBox) {
      jobsBox.innerHTML = "<p>जानकारी लोड नहीं हो सकी। थोड़ी देर बाद फिर प्रयास करें।</p>";
    }
  }
}

function typeName(type) {
  const names = {
    latest: "नई भर्ती",
    admit_card: "Admit Card",
    answer_key: "Answer Key",
    result: "Result"
  };

  return names[type] || "सरकारी परीक्षा";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

filters.forEach(button => {
  button.addEventListener("click", () => {
    currentType = button.dataset.type || "";
    loadJobs();
  });
});

if (search) {
  search.addEventListener("input", loadJobs);
}

loadJobs();
