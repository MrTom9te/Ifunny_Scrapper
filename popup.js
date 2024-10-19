let allowedUrls = ["ifunny.co"];
let isScrolling = false;
let scrollSpeed = 1;

document.getElementById("toggleBtn").addEventListener("click", function () {
  browser.storage.local.get("isEnabled", function (data) {
    const newState = !data.isEnabled;
    browser.storage.local.set({ isEnabled: newState });
    updateUI(newState);
  });
});

document.getElementById("addUrl").addEventListener("click", function () {
  const newUrl = document.getElementById("newUrl").value.trim();
  if (newUrl && !allowedUrls.includes(newUrl)) {
    allowedUrls.push(newUrl);
    updateUrlList();
    saveAllowedUrls();
  }
  document.getElementById("newUrl").value = "";
});

function updateUI(isEnabled) {
  document.getElementById("status").textContent = isEnabled
    ? "Active"
    : "Inactive";
  document.getElementById("toggleBtn").textContent = isEnabled
    ? "Disable"
    : "Enable";
}

function updateUrlList() {
  const urlList = document.getElementById("urlList");
  urlList.innerHTML = "";
  allowedUrls.forEach((url) => {
    const li = document.createElement("li");
    li.textContent = url;
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = function () {
      allowedUrls = allowedUrls.filter((u) => u !== url);
      updateUrlList();
      saveAllowedUrls();
    };
    li.appendChild(deleteBtn);
    urlList.appendChild(li);
  });
}

function saveAllowedUrls() {
  browser.storage.local.set({ allowedUrls: allowedUrls });
  browser.runtime.sendMessage({
    action: "updateAllowedUrls",
    urls: allowedUrls,
  });
}

browser.storage.local.get(["isEnabled", "allowedUrls"], function (data) {
  updateUI(data.isEnabled !== false); // Default to true if not set
  allowedUrls = data.allowedUrls || [];
  updateUrlList();
});

document
  .getElementById("scrollToggle")
  .addEventListener("change", function (e) {
    isScrolling = e.target.checked;
    updateScrolling();
  });

document.getElementById("scrollSpeed").addEventListener("change", function (e) {
  scrollSpeed = parseInt(e.target.value);
  updateScrolling();
});

function updateScrolling() {
  browser.runtime.sendMessage({
    action: "toggleScrolling",
    isScrolling: isScrolling,
    scrollSpeed: scrollSpeed,
  });
}

// Carregar configurações salvas
browser.storage.local.get(
  ["isEnabled", "allowedUrls", "isScrolling", "scrollSpeed"],
  function (data) {
    updateUI(data.isEnabled !== false);
    allowedUrls = data.allowedUrls || [];
    updateUrlList();

    isScrolling = data.isScrolling || false;
    scrollSpeed = data.scrollSpeed || 1;
    document.getElementById("scrollToggle").checked = isScrolling;
    document.getElementById("scrollSpeed").value = scrollSpeed;
  },
);
