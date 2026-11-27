import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import "./crt.css";
import { Shell } from "./shell";

const BANNER = `\x1b[1;32m
  ███╗   ██╗ ██████╗  ██╗ █████╗ ███╗   ███╗██████╗ ██╗      █████╗
  ████╗  ██║██╔════╝  ██║██╔══██╗████╗ ████║██╔══██╗██║     ██╔══██╗
  ██╔██╗ ██║██║  ███╗ ██║███████║██╔████╔██║██████╔╝██║     ███████║
  ██║╚██╗██║██║   ██║ ██║██╔══██║██║╚██╔╝██║██╔══██╗██║     ██╔══██║
  ██║ ╚████║╚██████╔╝ ██║██║  ██║██║ ╚═╝ ██║██████╔╝███████╗██║  ██║
  ╚═╝  ╚═══╝ ╚═════╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝\x1b[0m
  Nicholas V. Giamblanco · compilers for hardware accelerators

`;

async function main() {
  const term = new Terminal({
    fontFamily: '"Ubuntu Mono", monospace',
    fontSize: 17,
    cursorBlink: true,
    allowTransparency: true,
    theme: { background: "#00000000", foreground: "#c8f7d8", cursor: "#66ff66", green: "#66ff66", brightGreen: "#66ff66", blue: "#1e90ff", brightBlue: "#4aa8ff" },
  });
  const fit = new FitAddon();
  term.loadAddon(fit);
  term.open(document.getElementById("term")!);
  await document.fonts.ready;
  fit.fit();
  addEventListener("resize", () => fit.fit());

  // Narrow screens get a smaller banner so the block letters don't wrap.
  const banner = term.cols >= 70 ? BANNER : "\x1b[1;32mngiambla\x1b[0m · Nicholas V. Giamblanco\r\n\r\n";
  const home = await (await fetch("/home.json")).json();
  new Shell(term, home).start(banner);
  term.focus();
}

main();
