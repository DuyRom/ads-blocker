// youtube.response.js
(function () {
    // Cấu hình tùy chỉnh
    const config = {
      lyricLang: "en",           // Ngôn ngữ lời bài hát
      captionLang: "en",         // Ngôn ngữ phụ đề
      blockUpload: true,         // Chặn nút upload
      blockImmersive: true,      // Chặn nút immersive
      debug: true               // Chế độ debug
    };
  
    // Ghi log nếu debug bật
    function log(message) {
      if (config.debug) console.log("[YouTubeAdBlock] " + message);
    }
  
    // Hàm xử lý JSON để loại bỏ quảng cáo
    function removeAdsFromResponse(jsonData, url) {
      try {
        if (url.includes("/youtubei/v1/player")) {
          if (jsonData.adPlacements) {
            delete jsonData.adPlacements;
            log("Removed adPlacements from player response");
          }
          if (jsonData.playerAds) {
            delete jsonData.playerAds;
            log("Removed playerAds from player response");
          }
        } else if (url.includes("/youtubei/v1/next")) {
          if (jsonData.contents?.twoColumnWatchNextResults?.results?.results?.contents) {
            const contents = jsonData.contents.twoColumnWatchNextResults.results.results.contents;
            jsonData.contents.twoColumnWatchNextResults.results.results.contents = contents.filter(
              item => !item.promotedSparklesWebRenderer
            );
            log("Removed promoted ads from next response");
          }
        } else if (url.includes("/youtubei/v1/browse") || url.includes("/youtubei/v1/search")) {
          if (jsonData.contents?.twoColumnBrowseResultsRenderer?.tabs) {
            const tabs = jsonData.contents.twoColumnBrowseResultsRenderer.tabs;
            tabs.forEach(tab => {
              if (tab.tabRenderer?.content?.sectionListRenderer?.contents) {
                tab.tabRenderer.content.sectionListRenderer.contents = tab.tabRenderer.content.sectionListRenderer.contents.filter(
                  section => !section.itemSectionRenderer?.contents.some(item => item.promotedSparklesWebRenderer)
                );
              }
            });
            log("Removed promoted ads from browse/search response");
          }
        }
        return jsonData;
      } catch (e) {
        log("Error processing JSON: " + e.message);
        return jsonData;
      }
    }
  
    // Ghi đè fetch để xử lý API requests
    const originalFetch = window.fetch;
    window.fetch = async function (url, options) {
      const response = await originalFetch(url, options);
      if (url.includes("youtubei.googleapis.com/youtubei/v1")) {
        const clonedResponse = response.clone();
        const jsonData = await clonedResponse.json();
        const modifiedData = removeAdsFromResponse(jsonData, url);
        return new Response(JSON.stringify(modifiedData), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      }
      return response;
    };
  
    // Ghi đè XMLHttpRequest
    const originalXhrOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
      this._url = url;
      return originalXhrOpen.apply(this, arguments);
    };
  
    const originalXhrSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function () {
      this.addEventListener("load", function () {
        if (this._url.includes("youtubei.googleapis.com/youtubei/v1")) {
          try {
            const jsonData = JSON.parse(this.responseText);
            const modifiedData = removeAdsFromResponse(jsonData, this._url);
            Object.defineProperty(this, "responseText", {
              get: () => JSON.stringify(modifiedData)
            });
            log("Modified XHR response");
          } catch (e) {
            log("Error in XHR override: " + e.message);
          }
        }
      });
      return originalXhrSend.apply(this, arguments);
    };
  
    // Tùy chỉnh giao diện
    document.addEventListener("DOMContentLoaded", () => {
      if (config.blockUpload) {
        const uploadButton = document.querySelector('a[href="/upload"]');
        if (uploadButton) {
          uploadButton.style.display = "none";
          log("Blocked upload button");
        }
      }
      if (config.blockImmersive) {
        const immersiveButton = document.querySelector(".ytp-immersive-button");
        if (immersiveButton) {
          immersiveButton.style.display = "none";
          log("Blocked immersive button");
        }
      }
    });
  
    log("YouTubeAdBlock script loaded");
  })();