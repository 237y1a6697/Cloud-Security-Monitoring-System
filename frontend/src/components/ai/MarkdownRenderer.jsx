import { useMemo } from 'react';

export default function MarkdownRenderer({ content }) {
    const renderedHTML = useMemo(() => {
        if (!content) return '';

        // 1. Escape HTML for XSS prevention
        let txt = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // 2. Extract code blocks (pre blocks)
        const preBlocks = [];
        txt = txt.replace(/```([\s\S]*?)```/g, (match, codePart) => {
            const index = preBlocks.length;
            let cleanCode = codePart.trim();
            const lines = cleanCode.split('\n');
            if (lines.length > 0 && lines[0].length < 15 && !lines[0].includes(' ') && lines[0] === lines[0].toLowerCase()) {
                cleanCode = lines.slice(1).join('\n');
            }
            preBlocks.push(`<pre><code>${cleanCode}</code></pre>`);
            return `__PRE_BLOCK_${index}__`;
        });

        // 3. Inline code
        txt = txt.replace(/`([^`]+)`/g, '<code>$1</code>');

        // 4. Tables
        txt = txt.replace(/(?:^|\r?\n)(\|[^\r\n]+\|\r?\n\|[-\s:|+]+\|\r?\n(?:\|[^\r\n]+\|\r?\n?)+)/g, (match, tablePart) => {
            const lines = tablePart.trim().split('\n');
            const headers = lines[0].split('|').map(x => x.trim()).filter((x, i, a) => i > 0 && i < a.length - 1);
            const rows = lines.slice(2).map(r => r.split('|').map(x => x.trim()).filter((x, i, a) => i > 0 && i < a.length - 1));

            let html = '<table><thead><tr>';
            headers.forEach(h => {
                html += `<th>${h}</th>`;
            });
            html += '</tr></thead><tbody>';
            rows.forEach(r => {
                html += '<tr>';
                r.forEach(cell => {
                    html += `<td>${cell}</td>`;
                });
                html += '</tr>';
            });
            html += '</tbody></table>';
            return '\n' + html + '\n';
        });

        // 5. Bold markdown
        txt = txt.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

        // 6. Unordered lists
        txt = txt.replace(/(?:^|\n)-\s+([^\n]+)/g, '\n<li>$1</li>');
        txt = txt.replace(/(<li>[\s\S]+?<\/li>)/g, (m) => `<ul>${m}</ul>`);
        txt = txt.replace(/<\/ul>\s*<ul>/g, '');

        // 7. Ordered lists
        txt = txt.replace(/(?:^|\n)\d+\.\s+([^\n]+)/g, '\n<li class="ord-li">$1</li>');
        txt = txt.replace(/(<li class="ord-li">[\s\S]+?<\/li>)/g, (m) => `<ol>${m}</ol>`);
        txt = txt.replace(/<\/ol>\s*<ol>/g, '');
        txt = txt.replace(/class="ord-li"/g, '');

        // 8. Construct blocks / paragraphs
        const blocks = txt.split('\n\n');
        let finalHTML = blocks.map(b => {
            const trimmed = b.trim();
            if (!trimmed) return '';
            if (trimmed.startsWith('<table') || trimmed.startsWith('<pre') || trimmed.startsWith('<ul>') || trimmed.startsWith('<ol>')) {
                return trimmed;
            }
            const withBreaks = trimmed.replace(/\n/g, '<br />');
            return `<p>${withBreaks}</p>`;
        }).join('');

        // Restore pre blocks
        preBlocks.forEach((block, index) => {
            finalHTML = finalHTML.replace(`__PRE_BLOCK_${index}__`, block);
            finalHTML = finalHTML.replace(`<p>__PRE_BLOCK_${index}__</p>`, block);
        });

        return finalHTML;
    }, [content]);

    return <div dangerouslySetInnerHTML={{ __html: renderedHTML }} />;
}
