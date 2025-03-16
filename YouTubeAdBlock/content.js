// content.js
document.addEventListener("DOMContentLoaded", () => {
    const video = document.querySelector("video");
    if (video) {
      // Hỗ trợ PIP khi nhấp đúp
      video.addEventListener("dblclick", () => {
        if (document.pictureInPictureEnabled && !video.disablePictureInPicture) {
          video.requestPictureInPicture().catch((error) => {
            console.error("PIP failed:", error);
          });
        }
      });
  
      // Phát nền: Giữ video chạy khi chuyển tab
      video.addEventListener("pause", () => {
        if (document.hidden && !video.ended) {
          video.play();
        }
      });
    }
  
    // Ẩn nút upload (tùy chọn từ script Surge)
    const uploadButton = document.querySelector('a[href="/upload"]');
    if (uploadButton) {
      uploadButton.style.display = "none";
      console.log("Blocked upload button");
    }
  });