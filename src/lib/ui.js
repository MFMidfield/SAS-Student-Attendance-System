export const escapeHTML = (str) => {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, (tag) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[tag] || tag));
};

export const showToast = (message, type = 'success') => {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    // Limit to 3 toasts: remove the oldest one if limit reached
    const activeToasts = container.getElementsByClassName('toast');
    if (activeToasts.length >= 3) {
        activeToasts[0].remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} toast-animate-in`;
    
    const icon = type === 'success' 
        ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#73CB8F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
        : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D96C6C" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

    toast.innerHTML = `
        <div class="flex-shrink-0">${icon}</div>
        <div class="text-[#1E1E1E] font-black uppercase tracking-wider text-sm">${message}</div>
    `;

    container.appendChild(toast);

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('toast-animate-in');
        toast.classList.add('toast-animate-out');
        setTimeout(() => {
            toast.remove();
            if (container.childNodes.length === 0) {
                container.remove();
            }
        }, 400);
    }, 3000);
};
