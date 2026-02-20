// ==================== HYPER SNATCH UI COMPONENTS ====================
// Reusable UI components for the Link Resurrection Engine

"use strict";

// ==================== MODAL COMPONENTS ====================
const ModalComponents = {
  // Create modal overlay
  createModal(options = {}) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${options.title || 'Modal'}</h3>
          <button class="modal-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
        <div class="modal-body">
          ${options.content || ''}
        </div>
        ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
      </div>
    </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: modalFadeIn 0.3s ease-out;
      }
      
      .modal-content {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 20px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: modalSlideIn 0.3s ease-out;
      }
      
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding-bottom: 15px;
        border-bottom: 1px solid var(--line);
      }
      
      .modal-header h3 {
        margin: 0;
        color: var(--fg);
      }
      
      .modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: var(--muted);
        padding: 0;
        line-height: 1;
      }
      
      .modal-close:hover {
        color: var(--fg);
      }
      
      .modal-footer {
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid var(--line);
        text-align: right;
      }
      
      @keyframes modalFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes modalSlideIn {
        from { 
          transform: translateY(-50px);
          opacity: 0;
        }
        to { 
          transform: translateY(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);

    // Add event listeners
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    return modal;
  },

  // Show confirmation dialog
  showConfirm(message, onConfirm, onCancel) {
    const modal = this.createModal({
      title: 'Confirm Action',
      content: `
        <p>${message}</p>
        <div class="modal-actions">
          <button class="btn btn-danger" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Confirm</button>
        </div>
      `
    });

    document.body.appendChild(modal);

    // Add button event listeners
    const buttons = modal.querySelectorAll('.modal-actions button');
    buttons[1].addEventListener('click', () => {
      if (onCancel) onCancel();
      modal.remove();
    });

    buttons[0].addEventListener('click', () => {
      if (onConfirm) onConfirm();
      modal.remove();
    });

    return modal;
  },

  // Show alert dialog
  showAlert(message, type = 'info') {
    const modal = this.createModal({
      title: type.charAt(0).toUpperCase() + type.slice(1),
      content: `<p>${message}</p>`
    });

    document.body.appendChild(modal);

    // Auto-remove after 3 seconds
    setTimeout(() => modal.remove(), 3000);

    return modal;
  }
};

// ==================== PROGRESS COMPONENTS ====================
const ProgressComponents = {
  // Create progress bar
  createProgressBar(options = {}) {
    const container = document.createElement('div');
    container.className = 'progress-container';
    
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    
    const progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';
    progressFill.style.width = `${options.percentage || 0}%`;
    
    progressBar.appendChild(progressFill);
    container.appendChild(progressBar);

    if (options.showLabel) {
      const label = document.createElement('div');
      label.className = 'progress-label';
      label.textContent = options.label || '0%';
      container.appendChild(label);
    }

    if (options.showStatus) {
      const status = document.createElement('div');
      status.className = 'progress-status';
      status.textContent = options.status || 'Processing...';
      container.appendChild(status);
    }

    return {
      container,
      update: (percentage, status, label) => {
        if (progressFill) progressFill.style.width = `${percentage}%`;
        if (label) container.querySelector('.progress-label').textContent = label;
        if (status) container.querySelector('.progress-status').textContent = status;
      },
      complete: () => {
        progressFill.style.width = '100%';
        if (container.querySelector('.progress-label')) {
          container.querySelector('.progress-label').textContent = '100%';
        }
        if (container.querySelector('.progress-status')) {
          container.querySelector('.progress-status').textContent = 'Complete';
        }
      }
    };
  },

  // Create loading spinner
  createSpinner(options = {}) {
    const container = document.createElement('div');
    container.className = 'spinner-container';
    
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    
    container.appendChild(spinner);

    if (options.message) {
      const message = document.createElement('div');
      message.className = 'spinner-message';
      message.textContent = options.message;
      container.appendChild(message);
    }

    return {
      container,
      show: () => container.style.display = 'flex',
      hide: () => container.style.display = 'none',
      setMessage: (msg) => {
        const msgEl = container.querySelector('.spinner-message');
        if (msgEl) msgEl.textContent = msg;
      }
    };
  }
};

// ==================== TABLE COMPONENTS ====================
const TableComponents = {
  // Create sortable table
  createSortableTable(options = {}) {
    const container = document.createElement('div');
    container.className = 'table-container';
    
    const table = document.createElement('table');
    table.className = 'sortable-table';
    
    // Create header
    if (options.headers) {
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      
      options.headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        th.addEventListener('click', () => {
          this.sortTable(table, header);
        });
        headerRow.appendChild(th);
      });
      
      thead.appendChild(headerRow);
      table.appendChild(thead);
    }

    // Create body
    const tbody = document.createElement('tbody');
    if (options.data) {
      options.data.forEach(row => {
        const tr = document.createElement('tr');
        
        Object.values(row).forEach(cell => {
          const td = document.createElement('td');
          td.textContent = cell;
          tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
      });
    }
    
    table.appendChild(tbody);
    container.appendChild(table);

    return container;
  },

  // Sort table by column
  sortTable(table, column) {
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const columnIndex = Array.from(table.querySelectorAll('th')).findIndex(th => th.textContent === column);
    
    rows.sort((a, b) => {
      const aValue = a.children[columnIndex].textContent;
      const bValue = b.children[columnIndex].textContent;
      
      if (aValue < bValue) return -1;
      if (aValue > bValue) return 1;
      return 0;
    });

    // Clear and re-append sorted rows
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
  },

  // Add pagination
  addPagination(container, data, itemsPerPage = 10, currentPage = 1) {
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, data.length);
    const pageData = data.slice(startIndex, endIndex);

    // Update table
    const tbody = container.querySelector('tbody');
    tbody.innerHTML = '';
    pageData.forEach(row => {
      const tr = document.createElement('tr');
      Object.values(row).forEach(cell => {
        const td = document.createElement('td');
        td.textContent = cell;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    // Create pagination controls
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination-container';
    
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
      this.addPagination(container, data, itemsPerPage, currentPage - 1);
    });

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
      this.addPagination(container, data, itemsPerPage, currentPage + 1);
    });

    const pageInfo = document.createElement('span');
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    paginationContainer.appendChild(prevButton);
    paginationContainer.appendChild(pageInfo);
    paginationContainer.appendChild(nextButton);

    // Add pagination to container
    const existingPagination = container.querySelector('.pagination-container');
    if (existingPagination) {
      existingPagination.replaceWith(paginationContainer);
    } else {
      container.appendChild(paginationContainer);
    }
  }
};

// ==================== FORM COMPONENTS ====================
const FormComponents = {
  // Create input with validation
  createInput(options = {}) {
    const container = document.createElement('div');
    container.className = 'form-group';
    
    const label = document.createElement('label');
    label.textContent = options.label || '';
    label.setAttribute('for', options.id || '');
    container.appendChild(label);

    const input = document.createElement('input');
    input.type = options.type || 'text';
    input.id = options.id || '';
    input.placeholder = options.placeholder || '';
    input.required = options.required || false;
    
    if (options.value) input.value = options.value;
    if (options.maxLength) input.maxLength = options.maxLength;
    if (options.pattern) input.pattern = options.pattern;
    
    // Add validation feedback
    const feedback = document.createElement('div');
    feedback.className = 'input-feedback';
    
    input.addEventListener('input', (e) => {
      const value = e.target.value;
      let isValid = true;
      let message = '';
      
      if (options.validator) {
        const result = options.validator(value);
        isValid = result.valid;
        message = result.message || '';
      }
      
      if (options.onInput) {
        options.onInput(value, isValid, message);
      }
      
      feedback.textContent = message;
      feedback.className = `input-feedback ${isValid ? 'valid' : 'invalid'}`;
    });

    container.appendChild(input);
    container.appendChild(feedback);

    if (options.help) {
      const help = document.createElement('div');
      help.className = 'input-help';
      help.textContent = options.help;
      container.appendChild(help);
    }

    return {
      container,
      input,
      getValue: () => input.value,
      setValue: (value) => input.value = value,
      validate: () => options.validator ? options.validator(input.value) : { valid: true },
      clear: () => {
        input.value = '';
        feedback.textContent = '';
      }
    };
  },

  // Create select dropdown
  createSelect(options = {}) {
    const container = document.createElement('div');
    container.className = 'form-group';
    
    const label = document.createElement('label');
    label.textContent = options.label || '';
    label.setAttribute('for', options.id || '');
    container.appendChild(label);

    const select = document.createElement('select');
    select.id = options.id || '';
    
    if (options.options) {
      options.options.forEach(option => {
        const option = document.createElement('option');
        option.value = option.value;
        option.textContent = option.text;
        if (option.selected) option.selected = true;
        select.appendChild(option);
      });
    }
    
    if (options.value) select.value = options.value;
    if (options.onChange) {
      select.addEventListener('change', options.onChange);
    }
    
    container.appendChild(select);

    return {
      container,
      select,
      getValue: () => select.value,
      setValue: (value) => select.value = value,
      addOption: (value, text) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        select.appendChild(option);
      }
    };
  }
};

// ==================== GLOBAL EXPORT ====================
window.HyperSnatchUIComponents = {
  Modal: ModalComponents,
  Progress: ProgressComponents,
  Table: TableComponents,
  Form: FormComponents
};

console.log('HyperSnatch UI Components loaded');
