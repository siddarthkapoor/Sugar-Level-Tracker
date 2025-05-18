nch: ${entry.lunch}`);
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
