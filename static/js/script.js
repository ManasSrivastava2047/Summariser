// Main JavaScript for Summariser Application

document.addEventListener("DOMContentLoaded", () => {
  // Initialize tooltips
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  var tooltipList = tooltipTriggerList.map((tooltipTriggerEl) => new window.bootstrap.Tooltip(tooltipTriggerEl))

  // Character counter for text input
  const textInput = document.getElementById("text_input")
  if (textInput) {
    const charCounter = document.createElement("div")
    charCounter.className = "form-text text-end"
    charCounter.id = "charCounter"
    textInput.parentNode.appendChild(charCounter)

    textInput.addEventListener("input", function () {
      const count = this.value.length
      charCounter.textContent = `${count} characters`

      if (count < 50) {
        charCounter.className = "form-text text-end text-warning"
      } else {
        charCounter.className = "form-text text-end text-success"
      }
    })
  }

  // File size validation
  const fileInput = document.getElementById("file_upload")
  if (fileInput) {
    fileInput.addEventListener("change", function () {
      const file = this.files[0]
      if (file) {
        const maxSize = 10 * 1024 * 1024 // 10MB
        if (file.size > maxSize) {
          alert("File size must be less than 10MB")
          this.value = ""
          document.getElementById("filePreview").classList.add("d-none")
          return
        }

        // Show file info
        const fileInfo = document.createElement("small")
        fileInfo.className = "text-muted d-block mt-1"
        fileInfo.textContent = `Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`

        const fileName = document.getElementById("fileName")
        if (fileName) {
          // Remove existing file info
          const existingInfo = fileName.parentNode.querySelector(".text-muted")
          if (existingInfo) {
            existingInfo.remove()
          }
          fileName.parentNode.appendChild(fileInfo)
        }
      }
    })
  }

  // Form validation
  const form = document.getElementById("summarizerForm")
  if (form) {
    form.addEventListener("submit", (e) => {
      const textInput = document.getElementById("text_input")
      const fileInput = document.getElementById("file_upload")

      const hasText = textInput && textInput.value.trim().length > 0
      const hasFile = fileInput && fileInput.files.length > 0

      if (!hasText && !hasFile) {
        e.preventDefault()
        showAlert("Please provide text input or upload a file.", "warning")
        return
      }

      if (hasText && textInput.value.trim().length < 10) {
        e.preventDefault()
        showAlert("Text input must be at least 10 characters long.", "warning")
        return
      }
    })
  }

  // Tab switching logic
  const textTab = document.getElementById("text-tab")
  const fileTab = document.getElementById("file-tab")

  if (textTab && fileTab) {
    textTab.addEventListener("click", () => {
      // Clear file input when switching to text tab
      const fileInput = document.getElementById("file_upload")
      if (fileInput) {
        fileInput.value = ""
        document.getElementById("filePreview").classList.add("d-none")
      }
    })

    fileTab.addEventListener("click", () => {
      // Clear text input when switching to file tab
      const textInput = document.getElementById("text_input")
      if (textInput) {
        textInput.value = ""
        const charCounter = document.getElementById("charCounter")
        if (charCounter) {
          charCounter.textContent = "0 characters"
          charCounter.className = "form-text text-end text-warning"
        }
      }
    })
  }
})

// Utility Functions
function showAlert(message, type = "info") {
  const alertDiv = document.createElement("div")
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`
  alertDiv.innerHTML = `
        <i class="fas fa-info-circle me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `

  const container = document.querySelector(".container")
  if (container) {
    container.insertBefore(alertDiv, container.firstChild)

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.remove()
      }
    }, 5000)
  }
}

function clearFile() {
  const fileInput = document.getElementById("file_upload")
  const filePreview = document.getElementById("filePreview")

  if (fileInput) fileInput.value = ""
  if (filePreview) filePreview.classList.add("d-none")
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault()
    const target = document.querySelector(this.getAttribute("href"))
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  })
})

// Loading state management
function setLoadingState(isLoading) {
  const submitBtn = document.getElementById("submitBtn")
  const spinner = document.getElementById("loadingSpinner")

  if (submitBtn && spinner) {
    if (isLoading) {
      submitBtn.disabled = true
      spinner.classList.remove("d-none")
      submitBtn.innerHTML =
        '<i class="fas fa-magic me-2"></i>Processing...<span class="spinner-border spinner-border-sm ms-2"></span>'
    } else {
      submitBtn.disabled = false
      spinner.classList.add("d-none")
      submitBtn.innerHTML = '<i class="fas fa-magic me-2"></i>Generate Summary'
    }
  }
}

// Copy to clipboard functionality
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement("textarea")
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    const success = document.execCommand("copy")
    document.body.removeChild(textArea)
    return success
  }
}

// Download functionality
function downloadText(text, filename = "summary.txt") {
  const blob = new Blob([text], { type: "text/plain" })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

// Audio control functions
function initializeAudioControls() {
  const audio = document.getElementById("summaryAudio")
  if (audio) {
    audio.addEventListener("loadstart", () => {
      console.log("Audio loading started")
    })

    audio.addEventListener("canplay", () => {
      console.log("Audio can start playing")
    })

    audio.addEventListener("error", (e) => {
      console.error("Audio error:", e)
      showAlert("Error loading audio. Please try again.", "warning")
    })
  }
}

// Initialize audio controls when page loads
document.addEventListener("DOMContentLoaded", initializeAudioControls)
