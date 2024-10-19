let allowedUrls = [];
let downloadedUrls = new Set();
let isScrolling = false;
let scrollSpeed = 1; // pixels por intervalo

browser.storage.local.get(
  ["allowedUrls", "isScrolling", "scrollSpeed"],
  function (data) {
    allowedUrls = data.allowedUrls || [];
    isScrolling = data.isScrolling || false;
    scrollSpeed = data.scrollSpeed || 1;
  },
);

browser.webRequest.onCompleted.addListener(
  function (details) {
    if (
      isAllowedUrl(details.url) &&
      isMediaFile(details.url) &&
      !downloadedUrls.has(details.url)
    ) {
      downloadFile(details.url);
      downloadedUrls.add(details.url);
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"],
);

function isAllowedUrl(url) {
  return allowedUrls.some((allowedUrl) => url.includes(allowedUrl));
}

function isMediaFile(url) {
  const mediaExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".mp4",
    ".webm",
    ".ogg",
  ];
  return mediaExtensions.some((ext) => url.toLowerCase().endsWith(ext));
}

function downloadFile(url) {
  browser.downloads.download({
    url: url,
    filename: getFilenameFromUrl(url),
    saveAs: false,
  });
}

function getFilenameFromUrl(url) {
  return url.split("/").pop().split("#")[0].split("?")[0];
}

// Listener para atualizar a lista de URLs permitidas
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateAllowedUrls") {
    allowedUrls = message.urls;
    browser.storage.local.set({ allowedUrls: allowedUrls });
  }
});

// Limpar o conjunto de URLs baixadas periodicamente (a cada hora)
setInterval(() => {
  downloadedUrls.clear();
}, 3600000);

// Opcional: Limpar o conjunto quando a extensão é reiniciada
browser.runtime.onStartup.addListener(() => {
  downloadedUrls.clear();
});

function injectScrollScript(tabId) {
  browser.tabs.executeScript(tabId, {
    code: `
      let scrollInterval;
      function startScrolling(speed) {
        scrollInterval = setInterval(() => {
          window.scrollBy(0, speed);
        }, 50);
      }
      function stopScrolling() {
        clearInterval(scrollInterval);
      }
      browser.runtime.onMessage.addListener((message) => {
        if (message.action === 'startScrolling') {
          startScrolling(message.speed);
        } else if (message.action === 'stopScrolling') {
          stopScrolling();
        }
      });
    `,
  });
}

// Listener para mensagens do popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateAllowedUrls") {
    allowedUrls = message.urls;
    browser.storage.local.set({ allowedUrls: allowedUrls });
  } else if (message.action === "toggleScrolling") {
    isScrolling = message.isScrolling;
    scrollSpeed = message.scrollSpeed;
    browser.storage.local.set({
      isScrolling: isScrolling,
      scrollSpeed: scrollSpeed,
    });

    browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) {
        injectScrollScript(tabs[0].id);
        browser.tabs.sendMessage(tabs[0].id, {
          action: isScrolling ? "startScrolling" : "stopScrolling",
          speed: scrollSpeed,
        });
      }
    });
  }
});

// Injetar o script de rolagem quando uma nova página é carregada
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    injectScrollScript(tabId);
  }
});
