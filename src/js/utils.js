/**
 * Calculate Manhattan distance between two points
 * @param {number} x1 - First point x coordinate
 * @param {number} y1 - First point y coordinate
 * @param {number} x2 - Second point x coordinate
 * @param {number} y2 - Second point y coordinate
 * @returns {number} Manhattan distance
 */
export function getManhattanDistance(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/**
 * Calculate Euclidean distance between two points
 * @param {number} x1 - First point x coordinate
 * @param {number} y1 - First point y coordinate
 * @param {number} x2 - Second point x coordinate
 * @param {number} y2 - Second point y coordinate
 * @returns {number} Euclidean distance
 */
export function getEuclideanDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

/**
 * Get a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
export function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Capitalize the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Create an HTML element with given properties
 * @param {string} tag - HTML tag name
 * @param {Object} props - Properties to set on the element
 * @param {string|HTMLElement} [content] - Content to append to the element
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, props = {}, content = '') {
    const element = document.createElement(tag);
    
    // Set properties
    Object.entries(props).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue;
            });
        } else {
            element[key] = value;
        }
    });
    
    // Add content
    if (content) {
        if (typeof content === 'string') {
            element.textContent = content;
        } else {
            element.appendChild(content);
        }
    }
    
    return element;
}

/**
 * Add animation to an element and remove it after completion
 * @param {HTMLElement} element - Element to animate
 * @param {string} animation - Animation string (e.g., 'slideInDown 0.5s ease-out')
 * @returns {Promise} Promise that resolves when animation completes
 */
export function animateElement(element, animation) {
    return new Promise(resolve => {
        element.style.animation = animation;
        element.addEventListener('animationend', () => {
            element.style.animation = '';
            resolve();
        }, { once: true });
    });
}

/**
 * Remove an element after a delay
 * @param {HTMLElement} element - Element to remove
 * @param {number} delay - Delay in milliseconds
 * @returns {Promise} Promise that resolves when element is removed
 */
export function removeElementAfterDelay(element, delay) {
    return new Promise(resolve => {
        setTimeout(() => {
            element.remove();
            resolve();
        }, delay);
    });
} 