const fileInput = document.getElementById('imageInput');
const previewImage = document.getElementById('previewImage');
const placeholder = document.getElementById('placeholder');
const predictButton = document.getElementById('predictButton');
const resultContent = document.getElementById('resultContent');
const statusTag = document.getElementById('statusTag');

let selectedFile = null;

fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  selectedFile = file || null;

  if (!selectedFile) {
    previewImage.hidden = true;
    placeholder.hidden = false;
    predictButton.disabled = true;
    return;
  }

  const url = URL.createObjectURL(selectedFile);
  previewImage.src = url;
  previewImage.hidden = false;
  placeholder.hidden = true;
  predictButton.disabled = false;
});

predictButton.addEventListener('click', async () => {
  if (!selectedFile) {
    return;
  }

  const formData = new FormData();
  formData.append('file', selectedFile);

  predictButton.disabled = true;
  predictButton.textContent = 'Analyzing...';
  statusTag.textContent = 'Processing';
  statusTag.className = 'status-tag warning';

  resultContent.className = 'result-content';
  resultContent.innerHTML = `
    <div class="result-placeholder">
      <div class="result-icon">⌛</div>
      <p>Running MRI classification...</p>
    </div>
  `;

  try {
    const response = await fetch('/api/predict', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Prediction failed');
    }

    const probabilities = Object.entries(data.probabilities || {});
    const probabilityRows = probabilities
      .map(([label, value]) => {
        const percent = Math.round((value || 0) * 100);
        return `
          <div class="probability-row">
            <span>${label}</span>
            <div class="bar-track">
              <div class="bar-fill" style="width: ${percent}%"></div>
            </div>
            <strong>${percent}%</strong>
          </div>
        `;
      })
      .join('');

    resultContent.innerHTML = `
      <div class="result-header">
        <div class="result-class">${data.label}</div>
        <div class="confidence-score">${(data.confidence * 100).toFixed(1)}%</div>
      </div>
      <p class="summary-note">${data.summary}</p>
      <div class="probability-list">
        ${probabilityRows}
      </div>
    `;

    statusTag.textContent = 'Result ready';
    statusTag.className = 'status-tag success';
  } catch (error) {
    resultContent.innerHTML = `
      <div class="result-placeholder">
        <div class="result-icon">⚠</div>
        <p>${error.message}</p>
      </div>
    `;

    statusTag.textContent = 'Error';
    statusTag.className = 'status-tag neutral';
  } finally {
    predictButton.disabled = false;
    predictButton.textContent = 'Analyze image';
  }
});
