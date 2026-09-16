import fs from 'node:fs';
import path from 'node:path';
import { generateStandaloneReviewHtml } from '../src/utils/generateStandaloneReviewHtml.ts';

const html = generateStandaloneReviewHtml();

const rootPath = path.resolve(process.cwd(), 'card_review_lab.html');
const publicPath = path.resolve(process.cwd(), 'public/card_review_lab.html');

fs.writeFileSync(rootPath, html, 'utf-8');
console.log(`[OK] Generated: ${rootPath}`);

fs.writeFileSync(publicPath, html, 'utf-8');
console.log(`[OK] Generated: ${publicPath}`);
