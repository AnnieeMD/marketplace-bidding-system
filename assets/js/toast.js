/* Toast Notification System */

class ToastNotification {
    constructor() {
        this.container = this.createContainer();
    }

    createContainer() {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            container.id = 'toastContainer';
            document.body.appendChild(container);
        }
        return container;
    }

    show(title, message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle', 
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        toast.innerHTML = `
            <div class="toast-header">
                <div class="toast-title">
                    <i class="${icons[type]}"></i>
                    ${title}
                </div>
                <button class="toast-close" onclick="toastSystem.close(this)">&times;</button>
            </div>
            <div class="toast-body">${message}</div>
        `;
        
        this.container.appendChild(toast);
        
        // Show toast with animation
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Auto-remove toast
        setTimeout(() => {
            if (toast.parentNode) {
                this.close(toast.querySelector('.toast-close'));
            }
        }, duration);
        
        return toast;
    }

    close(closeButton) {
        const toast = closeButton.closest('.toast');
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    success(title, message, duration) {
        return this.show(title, message, 'success', duration);
    }

    error(title, message, duration) {
        return this.show(title, message, 'error', duration);
    }

    warning(title, message, duration) {
        return this.show(title, message, 'warning', duration);
    }

    info(title, message, duration) {
        return this.show(title, message, 'info', duration);
    }
}

// Global toast system instance
const toastSystem = new ToastNotification();

// Global function for backward compatibility
function showToast(title, message, type = 'info', duration = 5000) {
    return toastSystem.show(title, message, type, duration);
}

function closeToast(closeButton) {
    return toastSystem.close(closeButton);
}
