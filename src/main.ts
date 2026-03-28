import './styles/main.css';
import { initRouter } from './core/router';

// Apply saved theme — default is dark
const savedTheme = localStorage.getItem('cvora_theme') || 'dark';
if (savedTheme === 'light') {
  document.documentElement.classList.add('light');
} // dark is default via CSS

document.addEventListener('DOMContentLoaded', () => {
  initRouter();
});
