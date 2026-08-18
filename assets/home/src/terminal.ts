import type { ScrollController } from "./scroll";

type CommandResult = {
  lines?: string[];
  target?: string;
  external?: string;
  clear?: boolean;
};

const commands: Record<string, () => CommandResult> = {
  help: () => ({ lines: ["AVAILABLE: help / about / projects / blog / github / contact / clear"] }),
  about: () => ({ lines: ["Le1zy_Catt builds AI systems, distributed infrastructure, and open-source experiments."] }),
  projects: () => ({ lines: ["LOCATING SYSTEMS..."], target: "#selected-systems" }),
  blog: () => ({ lines: ["QUERYING SIGNAL ARCHIVE..."], target: "#signal-archive" }),
  github: () => ({ lines: ["OPENING PUBLIC SOURCE..."], external: "https://github.com/Le1zyCatt" }),
  contact: () => ({ lines: ["PUBLIC CHANNEL: 2490162471@qq.com"] }),
  clear: () => ({ clear: true })
};

function escapeHTML(value: string) {
  const span = document.createElement("span");
  span.textContent = value;
  return span.innerHTML;
}

export function setupTerminal(scroll: ScrollController) {
  const terminal = document.querySelector<HTMLElement>("[data-terminal]");
  const backdrop = document.querySelector<HTMLElement>("[data-terminal-backdrop]");
  const output = document.querySelector<HTMLElement>("[data-terminal-output]");
  const form = document.querySelector<HTMLFormElement>("[data-terminal-form]");
  const input = document.querySelector<HTMLInputElement>("[data-terminal-input]");
  const openers = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-terminal-open]"));
  const closer = document.querySelector<HTMLButtonElement>("[data-terminal-close]");
  let lastFocused: HTMLElement | null = null;
  let closeTimer = 0;

  if (!terminal || !backdrop || !output || !form || !input) return () => undefined;

  const open = () => {
    window.clearTimeout(closeTimer);
    lastFocused = document.activeElement as HTMLElement;
    terminal.hidden = false;
    backdrop.hidden = false;
    document.body.classList.add("is-terminal-open");
    requestAnimationFrame(() => {
      terminal.classList.add("is-visible");
      backdrop.classList.add("is-visible");
      window.setTimeout(() => input.focus(), 180);
    });
  };

  const close = (restoreFocus = true) => {
    terminal.classList.remove("is-visible");
    backdrop.classList.remove("is-visible");
    document.body.classList.remove("is-terminal-open");
    closeTimer = window.setTimeout(() => {
      terminal.hidden = true;
      backdrop.hidden = true;
      if (restoreFocus) lastFocused?.focus();
    }, 430);
  };

  const write = (command: string, lines: string[] = [], error = false) => {
    output.insertAdjacentHTML("beforeend", `<p class="terminal__command">le1zy@system:~$ ${escapeHTML(command)}</p>`);
    lines.forEach((line) => {
      output.insertAdjacentHTML("beforeend", `<p class="${error ? "terminal__error" : ""}"><span>${error ? "ERR" : "SYS"}</span> ${escapeHTML(line)}</p>`);
    });
    output.scrollTop = output.scrollHeight;
  };

  const execute = (rawValue: string) => {
    const command = rawValue.trim().toLowerCase();
    if (!command) return;
    const handler = commands[command];
    if (!handler) {
      write(command, [`COMMAND NOT FOUND: ${command}. TYPE help.`], true);
      return;
    }
    const result = handler();
    if (result.clear) {
      output.innerHTML = "";
      return;
    }
    write(command, result.lines);
    if (result.external) {
      window.setTimeout(() => window.open(result.external, "_blank", "noopener,noreferrer"), 260);
    }
    if (result.target) {
      window.setTimeout(() => {
        close(false);
        scroll.scrollTo(result.target as string, { offset: -30 });
      }, 520);
    }
  };

  openers.forEach((button) => button.addEventListener("click", open));
  closer?.addEventListener("click", () => close());
  backdrop.addEventListener("click", () => close());
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    execute(input.value);
    input.value = "";
  });
  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    execute(input.value);
    input.value = "";
  });
  document.querySelectorAll<HTMLButtonElement>("[data-command]").forEach((button) => {
    button.addEventListener("click", () => execute(button.dataset.command || ""));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !terminal.hidden) close();
    if (event.key === "Tab" && !terminal.hidden) {
      const focusable = Array.from(terminal.querySelectorAll<HTMLElement>("button, input"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  return () => window.clearTimeout(closeTimer);
}
