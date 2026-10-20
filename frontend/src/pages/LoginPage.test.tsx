// @vitest-environment jsdom
import { act, StrictMode, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';
import { ModalDialog } from '../components/ModalDialog';

const auth = vi.hoisted(() => ({ status: 'anonymous', error: null, signIn: vi.fn(), resetPassword: vi.fn() }));
vi.mock('../auth/useAuth', () => ({ useAuth: () => auth }));

let root: Root;
let container: HTMLDivElement;
const button = (text: string) => {
  const found = Array.from(container.querySelectorAll('button')).find(el => (el.getAttribute('aria-label') || el.textContent || '').includes(text));
  if (!found) throw new Error(`Button not found: ${text}`);
  return found;
};
const click = async (el: HTMLElement) => { await act(async () => el.click()); };
const open = async () => {
  const opener = button('Esqueci minha senha');
  opener.focus();
  await click(opener);
  return opener;
};
const dialog = () => container.querySelector('dialog')!;
const cancel = async () => {
  const event = new Event('cancel', { cancelable: true });
  await act(async () => { dialog().dispatchEvent(event); });
  return event;
};

beforeEach(async () => {
  vi.clearAllMocks();
  auth.resetPassword.mockResolvedValue(undefined);
  // jsdom lacks the native dialog top layer. These shims exercise React wiring
  // only; keyboard/inertness/nesting need real-browser validation in DEV.
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value: function (this: HTMLDialogElement) { this.open = true; } },
    close: { configurable: true, value: function (this: HTMLDialogElement) { this.open = false; } },
  });
});

afterEach(async () => {
  if (root) await act(async () => root.unmount());
  container?.remove();
  vi.restoreAllMocks();
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  vi.unstubAllGlobals();
});

async function renderLogin() {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(<LoginPage />));
}

describe('recovery modal regression (BUG-2026-001)', () => {
  it('opens modally with named dialog and explicit initial focus; Cancel restores opener', async () => {
    await renderLogin();
    const opener = await open();
    expect(dialog().open).toBe(true);
    expect(dialog().getAttribute('aria-labelledby')).toBe('recovery-title');
    expect(document.activeElement).toBe(dialog().querySelector('input'));
    await click(button('Cancelar'));
    expect(container.querySelector('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('routes native Escape/cancel through controlled close and restores focus', async () => {
    await renderLogin();
    const opener = await open();
    expect((await cancel()).defaultPrevented).toBe(true);
    expect(container.querySelector('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('keeps initial focus through StrictMode effect replay', async () => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    await act(async () => root.render(<StrictMode><LoginPage /></StrictMode>));
    const opener = await open();
    expect(document.activeElement).toBe(dialog().querySelector('input'));
    await cancel();
    expect(document.activeElement).toBe(opener);
  });

  it('restores focus using the close button and can reopen with email focused', async () => {
    await renderLogin();
    const opener = await open();
    await click(button('Fechar'));
    expect(document.activeElement).toBe(opener);
    await open();
    expect(document.activeElement).toBe(dialog().querySelector('input'));
    expect(auth.resetPassword).not.toHaveBeenCalled();
  });

  it('keeps SMS unavailable without sending a reset request', async () => {
    await renderLogin();
    await open();
    await click(button('SMS'));
    expect(button('Indisponível').disabled).toBe(true);
    expect(dialog().querySelector('input')).toBeNull();
    expect(auth.resetPassword).not.toHaveBeenCalled();
    await click(button('E-mail'));
    expect(dialog().querySelector('input')).not.toBeNull();
  });

  it('isolates cancel from an inner dialog and restores its own opener', async () => {
    const closeOuter = vi.fn();
    function NestedDialogs() {
      const [inner, setInner] = useState(false);
      return <ModalDialog labelledBy="outer-title" onRequestClose={closeOuter}>
        <h2 id="outer-title">Outer</h2>
        <button onClick={() => setInner(true)}>Open inner</button>
        {inner && <ModalDialog labelledBy="inner-title" onRequestClose={() => setInner(false)}>
          <h2 id="inner-title">Inner</h2><button>Inner action</button>
        </ModalDialog>}
      </ModalDialog>;
    }
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    await act(async () => root.render(<NestedDialogs />));
    const opener = button('Open inner');
    opener.focus();
    await click(opener);
    const dialogs = container.querySelectorAll('dialog');
    expect(dialogs.length).toBe(2);
    await act(async () => { dialogs[1].dispatchEvent(new Event('cancel', { bubbles: true, cancelable: true })); });
    expect(closeOuter).not.toHaveBeenCalled();
    expect(container.querySelectorAll('dialog').length).toBe(1);
    expect(dialog().open).toBe(true);
    expect(document.activeElement).toBe(opener);
  });

  for (const outcome of ['resolve', 'reject'] as const) {
    it(`blocks closing and duplicate submit while pending; ${outcome} restores focus and generic message`, async () => {
      let settle!: () => void;
      auth.resetPassword.mockImplementationOnce(() => new Promise<void>((resolve, reject) => { settle = () => outcome === 'resolve' ? resolve() : reject(new Error('private error')); }));
      await renderLogin();
      const email = container.querySelector<HTMLInputElement>('#email')!;
      // Use the native setter so React receives a real input change.
      await act(async () => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(email, 'synthetic@example.invalid');
        email.dispatchEvent(new Event('input', { bubbles: true }));
      });
      const opener = await open();
      const form = dialog().querySelector('form')!;
      await act(async () => {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      });
      expect(auth.resetPassword).toHaveBeenCalledExactlyOnceWith('synthetic@example.invalid');
      expect(dialog().getAttribute('aria-busy')).toBe('true');
      expect(button('Fechar').disabled).toBe(true);
      expect(button('Cancelar').disabled).toBe(true);
      await cancel();
      expect(dialog().open).toBe(true);
      await act(async () => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
      expect(auth.resetPassword).toHaveBeenCalledTimes(1);
      await act(async () => settle());
      expect(container.querySelector('dialog')).toBeNull();
      expect(document.activeElement).toBe(opener);
      expect(container.textContent).toContain('Se o e-mail estiver cadastrado');
      expect(container.textContent).not.toContain('private error');
    });
  }
});
