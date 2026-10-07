import { describe, expect, it, beforeEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

async function renderApp() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => root.render(<App />));
  return { container, root };
}

describe('App', () => {
  beforeEach(() => localStorage.clear());

  it('renders and converts the default sample', async () => {
    const { container, root } = await renderApp();
    expect(container.textContent).toContain('Test in WordPress');
    expect(container.querySelector('#ai-ask')).toBeTruthy();
    await act(async () => (container.querySelector('#view-files') as HTMLButtonElement).click());
    expect(container.textContent).toContain('front-page.php');
    await act(async () => root.unmount());
  });

  it('switches to the Ship stage', async () => {
    const { container, root } = await renderApp();
    await act(async () => (container.querySelector('#tab-ship') as HTMLButtonElement).click());
    expect(container.textContent).toContain('Download ZIP');
    expect(container.textContent).toContain('Launch Playground');
    await act(async () => root.unmount());
  });

  it('autosaves and restores the workspace', async () => {
    const first = await renderApp();
    const nameInput = first.container.querySelector('input[placeholder="Theme Name"]') as HTMLInputElement;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      setter.call(nameInput, 'Restored Theme');
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => new Promise((r) => setTimeout(r, 900)));
    await act(async () => first.root.unmount());

    const second = await renderApp();
    expect((second.container.querySelector('input[placeholder="Theme Name"]') as HTMLInputElement).value).toBe('Restored Theme');
    await act(async () => second.root.unmount());
  });

  it('shows the audit with a real PHP syntax check', async () => {
    const { container, root } = await renderApp();
    const auditTab = Array.from(container.querySelectorAll('button')).find((b) => /audit/i.test(b.textContent || ''));
    expect(auditTab).toBeTruthy();
    await act(async () => auditTab!.click());
    expect(container.textContent).toMatch(/PHP Syntax Valid \(\d+ files\)/);
    await act(async () => root.unmount());
  });
});
