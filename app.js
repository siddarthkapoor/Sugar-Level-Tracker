// Define a class to manage sugar level entries
class SugarLevelTracker {
  constructor() {
    // Initialize entries from localStorage or empty array if none exists
    this.entries = JSON.parse(localStorage.getItem('sugarLevelEntries') || '[]');
    this.editingIndex = null;
    this.filteredEntries = [...this.entries]; // For search/filter functionality
    this.chart = null; // Will hold the Chart.js instance

    // DOM elements - Form
    this.form = document.getElementById('entry-form');
    this.entriesTable = document.getElementById('entries-table');
    this.entriesList = document.getElementById('entries-list');
    this.dateInput = document.getElementById('date');
    this.timeInput = document.getElementById('time');
    this.sugarLevelInput = document.getElementById('sugar-level');
    this.breakfastInput = document.getElementById('breakfast');
    this.lunchInput = document.getElementById('lunch');
    this.dinnerInput = document.getElementById('dinner');
    this.snacksInput = document.getElementById('snacks');
    this.notesInput = document.getElementById('notes');
    this.submitBtn = document.getElementById('submit-btn');
    this.cancelBtn = document.getElementById('cancel-btn');
    this.emptyStateMessage = document.getElementById('empty-state');
    this.filterEmptyStateMessage = document.getElementById('filter-empty-state');
    this.sugarLevelIndicator = document.querySelector('.sugar-level-indicator i');
    
    // DOM elements - Filters
    this.searchInput = document.getElementById('search-input');
    this.filterDateFrom = document.getElementById('filter-date-from');
    this.filterDateTo = document.getElementById('filter-date-to');
    this.filterNormal = document.getElementById('filter-normal');
    this.filterElevated = document.getElementById('filter-elevated');
    this.filterHigh = document.getElementById('filter-high');
    this.resetFiltersBtn = document.getElementById('reset-filters-btn');
    this.chartContainer = document.getElementById('chart-container');
    this.sugarChart = document.getElementById('sugar-chart');
    this.exportBtn = document.getElementById('export-btn');

    // Set today's date as the default value for date input
    this.dateInput.valueAsDate = new Date();
    
    // Set current time as default for time input
    if (this.timeInput) {
      const now = new Date();
      this.timeInput.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }

    // Initialize event listeners
    this.initEventListeners();
    
    // Display entries
    this.displayEntries();
  }

  initEventListeners() {
    // Form submission
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }

    // Cancel button click
    if (this.cancelBtn) {
      this.cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.resetForm();
      });
    }

    // Sugar level input change - update indicator
    if (this.sugarLevelInput) {
      this.sugarLevelInput.addEventListener('input', () => {
        this.updateSugarLevelIndicator();
      });
    }
    
    // Search and filter event listeners
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => this.applyFilters());
    }
    
    if (this.filterDateFrom) {
      this.filterDateFrom.addEventListener('change', () => this.applyFilters());
    }
    
    if (this.filterDateTo) {
      this.filterDateTo.addEventListener('change', () => this.applyFilters());
    }
    
    // Filter checkboxes
    if (this.filterNormal) {
      this.filterNormal.addEventListener('change', () => this.applyFilters());
    }
    
    if (this.filterElevated) {
      this.filterElevated.addEventListener('change', () => this.applyFilters());
    }
    
    if (this.filterHigh) {
      this.filterHigh.addEventListener('change', () => this.applyFilters());
    }
    
    // Reset filters button
    if (this.resetFiltersBtn) {
      this.resetFiltersBtn.addEventListener('click', () => this.resetFilters());
    }
    
    // Export button
    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', () => this.exportData());
    }
  }

  // Categorize sugar level and update visual indicator
  updateSugarLevelIndicator() {
    if (!this.sugarLevelInput || !this.sugarLevelIndicator) return;

    const sugarLevel = parseFloat(this.sugarLevelInput.value);
    
    if (isNaN(sugarLevel) || sugarLevel <= 0) {
      this.sugarLevelIndicator.className = 'bi bi-circle-fill';
      this.sugarLevelIndicator.style.color = 'gray';
      return;
    }

    if (sugarLevel < 140) {
      // Normal
      this.sugarLevelIndicator.className = 'bi bi-check-circle-fill';
      this.sugarLevelIndicator.style.color = 'var(--bs-success)';
    } else if (sugarLevel <= 180) {
      // Elevated
      this.sugarLevelIndicator.className = 'bi bi-exclamation-circle-fill';
      this.sugarLevelIndicator.style.color = 'var(--bs-warning)';
    } else {
      // High
      this.sugarLevelIndicator.className = 'bi bi-exclamation-triangle-fill';
      this.sugarLevelIndicator.style.color = 'var(--bs-danger)';
    }
  }

  handleFormSubmit() {
    try {
      // Validate form
      if (!this.validateForm()) {
        return;
      }

      // Get sugar level and its category
      const sugarLevel = parseFloat(this.sugarLevelInput.value);
      let category = 'normal';
      if (sugarLevel > 180) {
        category = 'high';
      } else if (sugarLevel >= 140) {
        category = 'elevated';
      }

      // Get form data
      const entry = {
        date: this.dateInput ? this.dateInput.value : new Date().toISOString().slice(0, 10),
        time: this.timeInput ? this.timeInput.value : new Date().toTimeString().slice(0, 5),
        sugarLevel: sugarLevel,
        category: category,
        breakfast: this.breakfastInput ? this.breakfastInput.value.trim() : '',
        lunch: this.lunchInput ? this.lunchInput.value.trim() : '',
        dinner: this.dinnerInput ? this.dinnerInput.value.trim() : '',
        snacks: this.snacksInput ? this.snacksInput.value.trim() : '',
        notes: this.notesInput ? this.notesInput.value.trim() : ''
      };

      // If editing an existing entry
      if (this.editingIndex !== null) {
        this.entries[this.editingIndex] = entry;
        this.editingIndex = null;
        if (this.submitBtn) this.submitBtn.textContent = 'Add Entry';
        if (this.cancelBtn) this.cancelBtn.classList.add('d-none');
      } else {
        // Add a new entry
        this.entries.push(entry);
      }

      // Save to localStorage
      localStorage.setItem('sugarLevelEntries', JSON.stringify(this.entries));
      
      // Update the filtered entries
      this.filteredEntries = [...this.entries];
      
      // Display updated entries without trying to update the chart immediately
      try {
        this.displayEntries();
      } catch (displayError) {
        console.log('Error displaying entries:', displayError);
      }
      
      // Reset form
      this.resetForm();

      // Show success toast
      this.showToast('Entry saved successfully!', 'success');
    } catch (error) {
      console.log('Error submitting form:', error);
      this.showToast('An error occurred while saving your entry. Please try again.', 'danger');
    }
  }

  validateForm() {
    // Check if sugar level is a valid number
    const sugarLevel = parseFloat(this.sugarLevelInput.value);
    if (isNaN(sugarLevel) || sugarLevel <= 0 || sugarLevel > 1000) {
      this.showToast('Please enter a valid sugar level between 1 and 1000 mg/dL.', 'danger');
      return false;
    }

    // Ensure at least one meal has a description
    if (!this.breakfastInput.value.trim() && 
        !this.lunchInput.value.trim() && 
        !this.dinnerInput.value.trim() && 
        !this.snacksInput.value.trim()) {
      this.showToast('Please provide at least one meal description.', 'danger');
      return false;
    }

    return true;
  }

  // Apply search and filter criteria
  applyFilters() {
    try {
      // Initialize filtered entries with all entries
      this.filteredEntries = [...this.entries];
      
      // Apply search text filter
      if (this.searchInput && this.searchInput.value.trim()) {
        const searchText = this.searchInput.value.trim().toLowerCase();
        this.filteredEntries = this.filteredEntries.filter(entry => {
          const mealsText = [
            entry.breakfast || '',
            entry.lunch || '',
            entry.dinner || '',
            entry.snacks || '',
            entry.notes || ''
          ].join(' ').toLowerCase();
          
          return mealsText.includes(searchText);
        });
      }
    } catch (error) {
      console.log('Error applying filters:', error);
      // If there's an error, just use all entries
      this.filteredEntries = [...this.entries];
    }
    
    try {
      // Apply date range filter
      if (this.filterDateFrom && this.filterDateFrom.value) {
        const fromDate = new Date(this.filterDateFrom.value);
        this.filteredEntries = this.filteredEntries.filter(entry => {
          return new Date(entry.date) >= fromDate;
        });
      }
      
      if (this.filterDateTo && this.filterDateTo.value) {
        const toDate = new Date(this.filterDateTo.value);
        // Set time to end of day
        toDate.setHours(23, 59, 59, 999);
        this.filteredEntries = this.filteredEntries.filter(entry => {
          return new Date(entry.date) <= toDate;
        });
      }
      
      // Apply category filters
      const categoryFilters = [];
      if (this.filterNormal && this.filterNormal.checked) categoryFilters.push('normal');
      if (this.filterElevated && this.filterElevated.checked) categoryFilters.push('elevated');
      if (this.filterHigh && this.filterHigh.checked) categoryFilters.push('high');
      
      if (categoryFilters.length > 0 && categoryFilters.length < 3) {
        this.filteredEntries = this.filteredEntries.filter(entry => {
          // For older entries without category, determine it now
          let category = entry.category;
          if (!category) {
            if (entry.sugarLevel > 180) {
              category = 'high';
            } else if (entry.sugarLevel >= 140) {
              category = 'elevated';
            } else {
              category = 'normal';
            }
          }
          
          return categoryFilters.includes(category);
        });
      }
    } catch (error) {
      console.log('Error applying category filters:', error);
      // If there's an error, just use all entries
      this.filteredEntries = [...this.entries];
    }
    
    // Display filtered entries and update chart
    try {
      this.displayEntries();
      // Only update chart if there are entries
      if (this.filteredEntries.length > 0) {
        this.updateChart();
      }
    } catch (error) {
      console.log('Error displaying entries:', error);
    }
  }
  
  // Reset all filters to default state
  resetFilters() {
    if (this.searchInput) this.searchInput.value = '';
    if (this.filterDateFrom) this.filterDateFrom.value = '';
    if (this.filterDateTo) this.filterDateTo.value = '';
    if (this.filterNormal) this.filterNormal.checked = true;
    if (this.filterElevated) this.filterElevated.checked = true;
    if (this.filterHigh) this.filterHigh.checked = true;
    
    this.filteredEntries = [...this.entries];
    this.displayEntries();
    this.updateChart();
    
    this.showToast('Filters have been reset', 'info');
  }
  
  // Export data as CSV file
  exportData() {
    if (this.entries.length === 0) {
      this.showToast('No data to export', 'warning');
      return;
    }
    
    // Create CSV content
    let csvContent = 'Date,Time,Sugar Level (mg/dL),Category,Breakfast,Lunch,Dinner,Snacks,Notes\n';
    
    this.entries.forEach(entry => {
      // Determine category if not set
      let category = entry.category || '';
      if (!category) {
        if (entry.sugarLevel > 180) {
          category = 'High';
        } else if (entry.sugarLevel >= 140) {
          category = 'Elevated';
        } else {
          category = 'Normal';
        }
      } else {
        // Capitalize first letter
        category = category.charAt(0).toUpperCase() + category.slice(1);
      }
      
      // Escape and quote text fields
      const escapeCsv = (text) => {
        if (!text) return '';
        // Replace double quotes with two double quotes and wrap in quotes
        return `"${text.replace(/"/g, '""')}"`;
      };
      
      csvContent += [
        entry.date,
        entry.time || '',
        entry.sugarLevel,
        category,
        escapeCsv(entry.breakfast),
        escapeCsv(entry.lunch),
        escapeCsv(entry.dinner),
        escapeCsv(entry.snacks),
        escapeCsv(entry.notes)
      ].join(',') + '\n';
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sugar-levels-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.showToast('Data exported successfully!', 'success');
  }
  
  // Update chart visualization
  updateChart() {
    // Skip chart creation if Chart is not defined or chart element doesn't exist
    if (!this.sugarChart || typeof Chart === 'undefined') {
      if (this.chartContainer) this.chartContainer.classList.add('d-none');
      return;
    }
    
    if (this.filteredEntries.length === 0) {
      if (this.chartContainer) this.chartContainer.classList.add('d-none');
      return;
    }
    
    if (this.chartContainer) this.chartContainer.classList.remove('d-none');
    
    // Sort entries by date (oldest first for the chart)
    const sortedEntries = [...this.filteredEntries].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
      const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
      return dateA - dateB;
    });
    
    // Prepare data for chart
    const labels = sortedEntries.map(entry => {
      const date = new Date(entry.date);
      return `${date.getMonth() + 1}/${date.getDate()}${entry.time ? ' ' + entry.time : ''}`;
    });
    
    const data = sortedEntries.map(entry => entry.sugarLevel);
    
    try {
      // Create datasets with different colors based on sugar level category
      const datasets = [{
        label: 'Sugar Level (mg/dL)',
        data: data,
        fill: false,
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.4,
        pointBackgroundColor: sortedEntries.map(entry => {
          if (entry.sugarLevel > 180) {
            return 'rgba(220, 53, 69, 1)'; // danger
          } else if (entry.sugarLevel >= 140) {
            return 'rgba(255, 193, 7, 1)'; // warning
          } else {
            return 'rgba(40, 167, 69, 1)'; // success
          }
        })
      }];
      
      // Create or update chart
      if (this.chart) {
        this.chart.data.labels = labels;
        this.chart.data.datasets = datasets;
        this.chart.update();
      } else if (typeof Chart === 'function') {
        this.chart = new Chart(this.sugarChart, {
          type: 'line',
          data: {
            labels: labels,
            datasets: datasets
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                display: true,
                position: 'top',
              },
              tooltip: {
                callbacks: {
                  afterLabel: (context) => {
                    const index = context.dataIndex;
                    const entry = sortedEntries[index];
                    
                    let meals = [];
                    if (entry.breakfast) meals.push(`Breakfast: ${entry.breakfast}`);
                    if (entry.lunch) meals.push(`Lunch: ${entry.lunch}`);
                    if (entry.dinner) meals.push(`Dinner: ${entry.dinner}`);
                    if (entry.snacks) meals.push(`Snacks: ${entry.snacks}`);
                    
                    return meals;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: false,
                title: {
                  display: true,
                  text: 'Sugar Level (mg/dL)'
                }
              }
            }
          }
        });
      }
    } catch (error) {
      console.log('Error creating chart:', error);
      // Disable chart container if there's an error
      if (this.chartContainer) this.chartContainer.classList.add('d-none');
    }
  }

  displayEntries() {
    // Apply filters if any have been set
    let displayedEntries = this.filteredEntries;
    
    // Sort entries by date (newest first)
    const sortedEntries = [...displayedEntries].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
      const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
      return dateB - dateA;
    });

    // Clear the current entries list
    if (this.entriesList) {
      this.entriesList.innerHTML = '';
    }

    // Show/hide empty state messages based on filter results
    if (this.entries.length === 0) {
      // No entries at all
      if (this.emptyStateMessage) this.emptyStateMessage.classList.remove('d-none');
      if (this.filterEmptyStateMessage) this.filterEmptyStateMessage.classList.add('d-none');
      if (this.entriesTable) this.entriesTable.classList.add('d-none');
      if (this.chartContainer) this.chartContainer.classList.add('d-none');
    } else if (sortedEntries.length === 0) {
      // Entries exist but none match the current filter
      if (this.emptyStateMessage) this.emptyStateMessage.classList.add('d-none');
      if (this.filterEmptyStateMessage) this.filterEmptyStateMessage.classList.remove('d-none');
      if (this.entriesTable) this.entriesTable.classList.add('d-none');
      if (this.chartContainer) this.chartContainer.classList.add('d-none');
    } else {
      // Entries to display
      if (this.emptyStateMessage) this.emptyStateMessage.classList.add('d-none');
      if (this.filterEmptyStateMessage) this.filterEmptyStateMessage.classList.add('d-none');
      if (this.entriesTable) this.entriesTable.classList.remove('d-none');
      
      // Update chart with filtered data
      this.updateChart();
    }

    // Create rows for each entry
    if (this.entriesList && sortedEntries.length > 0) {
      sortedEntries.forEach((entry, index) => {
        const row = document.createElement('tr');
        
        // Find the original index of this entry in the main entries array
        const originalIndex = this.entries.findIndex(e => 
          e.date === entry.date && 
          e.time === entry.time && 
          e.sugarLevel === entry.sugarLevel
        );
        
        // Format date for display (YYYY-MM-DD to MM/DD/YYYY)
        const dateParts = entry.date.split('-');
        const formattedDate = `${dateParts[1]}/${dateParts[2]}/${dateParts[0]}`;
        
        // Determine sugar level badge class
        let badgeClass = 'bg-success';
        let badgeIcon = 'bi-check-circle-fill';
        
        if (entry.category === 'elevated') {
          badgeClass = 'bg-warning';
          badgeIcon = 'bi-exclamation-circle-fill';
        } else if (entry.category === 'high') {
          badgeClass = 'bg-danger';
          badgeIcon = 'bi-exclamation-triangle-fill';
        }
        
        // If entry doesn't have category (older entries), determine it now
        if (!entry.category) {
          if (entry.sugarLevel > 180) {
            badgeClass = 'bg-danger';
            badgeIcon = 'bi-exclamation-triangle-fill';
          } else if (entry.sugarLevel >= 140) {
            badgeClass = 'bg-warning';
            badgeIcon = 'bi-exclamation-circle-fill';
          }
        }
        
        row.innerHTML = `
          <td>${formattedDate}<br><small class="text-muted">${entry.time || ''}</small></td>
          <td>
            <span class="badge ${badgeClass} me-2">
              <i class="bi ${badgeIcon} me-1"></i>
              ${entry.sugarLevel} mg/dL
            </span>
          </td>
          <td>
            <ul class="list-unstyled mb-0">
              ${entry.breakfast ? `<li><strong>Breakfast:</strong> ${entry.breakfast}</li>` : ''}
              ${entry.lunch ? `<li><strong>Lunch:</strong> ${entry.lunch}</li>` : ''}
              ${entry.dinner ? `<li><strong>Dinner:</strong> ${entry.dinner}</li>` : ''}
              ${entry.snacks ? `<li><strong>Snacks:</strong> ${entry.snacks}</li>` : ''}
              ${entry.notes ? `<li class="mt-2 text-info"><strong>Notes:</strong> ${entry.notes}</li>` : ''}
            </ul>
          </td>
          <td>
            <div class="btn-group btn-group-sm" role="group">
              <button type="button" class="btn btn-outline-secondary edit-btn" data-index="${originalIndex}">
                <i class="bi bi-pencil"></i>
              </button>
              <button type="button" class="btn btn-outline-danger delete-btn" data-index="${originalIndex}">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        `;
        
        this.entriesList.appendChild(row);
      });

      // Add event listeners to edit and delete buttons
      document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => this.editEntry(btn.getAttribute('data-index')));
      });

      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => this.deleteEntry(btn.getAttribute('data-index')));
      });
    }
  }

  editEntry(index) {
    const entry = this.entries[index];
    
    // Populate form with entry data
    if (this.dateInput) this.dateInput.value = entry.date;
    if (this.timeInput) this.timeInput.value = entry.time || '12:00'; // Default to noon if time not available for older entries
    if (this.sugarLevelInput) {
      this.sugarLevelInput.value = entry.sugarLevel;
      this.updateSugarLevelIndicator(); // Update the indicator based on sugar level value
    }
    if (this.breakfastInput) this.breakfastInput.value = entry.breakfast || '';
    if (this.lunchInput) this.lunchInput.value = entry.lunch || '';
    if (this.dinnerInput) this.dinnerInput.value = entry.dinner || '';
    if (this.snacksInput) this.snacksInput.value = entry.snacks || '';
    if (this.notesInput) this.notesInput.value = entry.notes || '';
    
    // Change button text and show cancel button
    if (this.submitBtn) this.submitBtn.textContent = 'Update Entry';
    if (this.cancelBtn) this.cancelBtn.classList.remove('d-none');
    
    // Scroll to form
    if (this.form) this.form.scrollIntoView({ behavior: 'smooth' });
    
    // Set editing index
    this.editingIndex = parseInt(index);
  }

  deleteEntry(index) {
    if (confirm('Are you sure you want to delete this entry?')) {
      // Remove entry from array
      this.entries.splice(index, 1);
      
      // Save to localStorage
      this.saveEntries();
      
      // If currently editing this entry, reset form
      if (this.editingIndex === parseInt(index)) {
        this.resetForm();
      }
      
      // Display updated entries
      this.displayEntries();
      
      // Show success toast
      this.showToast('Entry deleted successfully!', 'info');
    }
  }

  resetForm() {
    // Reset form values
    if (this.dateInput) {
      this.dateInput.valueAsDate = new Date();
    }
    
    // Reset time to current time
    if (this.timeInput) {
      const now = new Date();
      this.timeInput.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }
    
    if (this.sugarLevelInput) {
      this.sugarLevelInput.value = '';
      if (this.sugarLevelIndicator) {
        this.sugarLevelIndicator.className = 'bi bi-circle-fill';
        this.sugarLevelIndicator.style.color = 'gray';
      }
    }
    
    if (this.breakfastInput) this.breakfastInput.value = '';
    if (this.lunchInput) this.lunchInput.value = '';
    if (this.dinnerInput) this.dinnerInput.value = '';
    if (this.snacksInput) this.snacksInput.value = '';
    if (this.notesInput) this.notesInput.value = '';
    
    // Reset editing state
    this.editingIndex = null;
    if (this.submitBtn) this.submitBtn.textContent = 'Add Entry';
    if (this.cancelBtn) this.cancelBtn.classList.add('d-none');
  }

  saveEntries() {
    localStorage.setItem('sugarLevelEntries', JSON.stringify(this.entries));
    // Update the filtered entries and refresh display
    this.filteredEntries = [...this.entries];
    this.applyFilters();
  }

  showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;
    
    toastContainer.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast, { autohide: true, delay: 3000 });
    bsToast.show();
    
    // Remove toast from DOM after it's hidden
    toast.addEventListener('hidden.bs.toast', () => {
      toastContainer.removeChild(toast);
    });
  }
}

// Initialize the tracker when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SugarLevelTracker();
});
