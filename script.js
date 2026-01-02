// Lightbox functionality
document.addEventListener('DOMContentLoaded', function() {
  
    // Create lightbox elements
    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox';
    lightbox.innerHTML = `
      <span class="lightbox-close">&times;</span>
      <img class="lightbox-content" src="" alt="">
    `;
    document.body.appendChild(lightbox);
  
    // Get all gallery images
    const galleryImages = document.querySelectorAll('.gallery-grid img');
    const lightboxImg = document.querySelector('.lightbox-content');
    const closeBtn = document.querySelector('.lightbox-close');
  
    // Add click event to each image
    galleryImages.forEach(img => {
      img.addEventListener('click', function() {
        lightbox.style.display = 'flex';
        lightboxImg.src = this.src;
        lightboxImg.alt = this.alt;
        document.body.style.overflow = 'hidden'; // Prevent scrolling
      });
    });
  
    // Close lightbox when clicking X
    closeBtn.addEventListener('click', closeLightbox);
  
    // Close lightbox when clicking outside image
    lightbox.addEventListener('click', function(e) {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
  
    // Close lightbox with ESC key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeLightbox();
      }
    });
  
    function closeLightbox() {
      lightbox.style.display = 'none';
      document.body.style.overflow = 'auto'; // Restore scrolling
    }
  
  });