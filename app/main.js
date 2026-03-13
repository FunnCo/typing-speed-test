import { getDom } from './dom.js';
import { TypingTestApp } from './typingTest.js';

const dom = getDom();
const app = new TypingTestApp(dom);

app.bindEvents();
app.reset();
