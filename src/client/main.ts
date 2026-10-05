import { mount } from 'svelte';
import App from './App.svelte';
import './app.css';
import './themes/traitors.css';
import './themes/strictly.css';
import './themes/jungle.css';
import './themes/bakeoff.css';
import './themes/ice.css';

const target = document.getElementById('app');
if (target) mount(App, { target });
