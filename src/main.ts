import './styles/main.css';
import { initRouter } from './core/router';

// Apply saved theme
const savedTheme = localStorage.getItem('cvora_theme');
if (savedTheme === 'dark') document.documentElement.classList.add('dark');

document.addEventListener('DOMContentLoaded', () => {
  initRouter();
});
