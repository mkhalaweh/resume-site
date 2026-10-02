"use client";

import { useRef, useState, useCallback, useEffect } from "react";

type WindowState = "closed" | "windowed" | "maximized" | "minimized";
type FSNode =
  | { type: "dir"; children: Record<string, FSNode> }
  | { type: "file"; content: string; url?: string }
  | { type: "pdf" };

type SkillGroup = { category: string; items: string[] };
type ExperienceItem = { role: string; org: string; location: string; period: string; bullets: string[] };
type Cert = { code: string; name: string; issuer: string };
type Education = { degree: string; school: string };

export type ArticleForTerminal = {
  slug: string;
  title: string;
  excerpt: string;
  createdAt: Date | string;
  tags: string;
};

export type ResumeForTerminal = {
  name: string;
  title: string;
  location: string;
  about: string;
  email?: string | null;
  phone?: string | null;
  skills: SkillGroup[];
  experience: ExperienceItem[];
  certs: Cert[];
  education: Education[];
  linkedin?: string | null;
  github?: string | null;
};

function buildFS(r: ResumeForTerminal, articles: ArticleForTerminal[]): FSNode {
  const expByOrg: Record<string, ExperienceItem[]> = {};
  for (const exp of r.experience) {
    const key = exp.org.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (!expByOrg[key]) expByOrg[key] = [];
    expByOrg[key].push(exp);
  }
  const experienceChildren: Record<string, FSNode> = {};
  for (const [orgKey, exps] of Object.entries(expByOrg)) {
    const orgChildren: Record<string, FSNode> = {};
    for (const exp of exps) {
      const fileKey = exp.role.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + ".md";
      orgChildren[fileKey] = {
        type: "file",
        content: `# ${exp.role}\n**${exp.org}** · ${exp.period}\n\n${exp.bullets.map(b => `- ${b}`).join("\n")}`,
      };
    }
    experienceChildren[orgKey] = { type: "dir", children: orgChildren };
  }
  const certChildren: Record<string, FSNode> = {};
  for (const c of r.certs) {
    certChildren[`${c.code}.cert`] = { type: "file", content: `${c.issuer} Certified: ${c.name}` };
  }
  const eduChildren: Record<string, FSNode> = {};
  for (const e of r.education) {
    const key = e.school.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 14) + ".md";
    eduChildren[key] = { type: "file", content: `# ${e.school}\n*${e.degree}*` };
  }
  const skillsLines = r.skills.map(sg => `${sg.category.padEnd(22)}${sg.items.join(", ")}`).join("\n");
  const contactLines = [
    `location  ${r.location}`,
    r.email    ? `email     ${r.email}`    : null,
    r.phone    ? `phone     ${r.phone}`    : null,
    r.linkedin ? `linkedin  ${r.linkedin}` : null,
    r.github   ? `github    ${r.github}`   : null,
  ].filter(Boolean).join("\n");
  const articleChildren: Record<string, FSNode> = {};
  for (const a of articles) {
    const tags: string[] = JSON.parse(a.tags || "[]");
    const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(a.createdAt));
    articleChildren[`${a.slug}.md`] = {
      type: "file",
      url: `/articles/${a.slug}`,
      content: `# ${a.title}\n*${date}${tags.length ? " · " + tags.join(", ") : ""}*\n\n${a.excerpt || "No excerpt."}`,
    };
  }

  return {
    type: "dir",
    children: {
      "about.txt": { type: "file", content: `${r.name}\n${r.title}\n\n${r.about}` },
      "contact.txt": { type: "file", content: contactLines },
      "skills.txt": { type: "file", content: skillsLines },
      "resume.pdf": { type: "pdf" },
      education: { type: "dir", children: eduChildren },
      certifications: { type: "dir", children: certChildren },
      experience: { type: "dir", children: experienceChildren },
      articles: { type: "dir", children: articleChildren },
      ".clearance": { type: "file", content: "STATUS: employed, open to the right conversation\nCLEARED FOR: cloud security architecture, IAM, SIEM/SOC leadership" },
    },
  };
}

const COMMANDS = ["ls", "cd", "cat", "pwd", "tree", "whoami", "clear", "help", "open"];

export default function Terminal({ resume, articles }: { resume: ResumeForTerminal; articles: ArticleForTerminal[] }) {
  const fs = useRef<FSNode>(buildFS(resume, articles));
  useEffect(() => { fs.current = buildFS(resume, articles); }, [resume, articles]);

  const [winState, setWinState] = useState<WindowState>("closed");
  const [cwd, setCwd] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [inputVal, setInputVal] = useState("");
  const screenRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [screenEntries, setScreenEntries] = useState<Array<{ html: string; cls?: string }>>([]);
  const cwdRef = useRef<string[]>([]);
  const historyRef = useRef<string[]>([]);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [size, setSize] = useState({ width: 640, height: 440 });
  const [isMobile, setIsMobile] = useState(false);
  const [animPhase, setAnimPhase] = useState<"in" | "open" | "out">("open");
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const isResizing = useRef(false);
  const resizeDir = useRef("");
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0, px: 0, py: 0 });

  const getPos = () => pos ?? { x: window.innerWidth - size.width - 28, y: window.innerHeight - size.height - 28 };

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (isDragging.current) {
        setPos({
          x: Math.max(0, Math.min(window.innerWidth - 200, e.clientX - dragOffset.current.x)),
          y: Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffset.current.y)),
        });
      } else if (isResizing.current) {
        const { x, y, w, h, px, py } = resizeStart.current;
        const dx = e.clientX - x;
        const dy = e.clientY - y;
        const dir = resizeDir.current;
        let newW = w, newH = h, newPx = px, newPy = py;
        if (dir.includes("e")) newW = Math.max(320, w + dx);
        if (dir.includes("s")) newH = Math.max(200, h + dy);
        if (dir.includes("w")) { newW = Math.max(320, w - dx); newPx = px + (w - newW); }
        if (dir.includes("n")) { newH = Math.max(200, h - dy); newPy = py + (h - newH); }
        setSize({ width: newW, height: newH });
        if (dir.includes("w") || dir.includes("n")) setPos({ x: newPx, y: newPy });
      }
    };
    const onUp = () => { isDragging.current = false; isResizing.current = false; };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, []);

  const handleDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === "BUTTON") return;
    e.preventDefault();
    isDragging.current = true;
    const currentPos = getPos();
    dragOffset.current = { x: e.clientX - currentPos.x, y: e.clientY - currentPos.y };
    if (!pos) setPos(currentPos);
  };

  const handleResizeStart = (e: React.MouseEvent, dir: string) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;
    resizeDir.current = dir;
    const currentPos = getPos();
    if (!pos) setPos(currentPos);
    resizeStart.current = { x: e.clientX, y: e.clientY, w: size.width, h: size.height, px: currentPos.x, py: currentPos.y };
  };

  const ResizeHandle = ({ dir }: { dir: string }) => {
    const cursorMap: Record<string, string> = { n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize", ne: "nesw-resize", sw: "nesw-resize", nw: "nwse-resize", se: "nwse-resize" };
    const styleMap: Record<string, React.CSSProperties> = {
      n:  { top: 0, left: 6, right: 6, height: 5 },
      s:  { bottom: 0, left: 6, right: 6, height: 5 },
      e:  { right: 0, top: 6, bottom: 6, width: 5 },
      w:  { left: 0, top: 6, bottom: 6, width: 5 },
      ne: { top: 0, right: 0, width: 10, height: 10 },
      nw: { top: 0, left: 0, width: 10, height: 10 },
      se: { bottom: 0, right: 0, width: 10, height: 10 },
      sw: { bottom: 0, left: 0, width: 10, height: 10 },
    };
    return <div onMouseDown={e => handleResizeStart(e, dir)} style={{ position: "absolute", zIndex: 20, cursor: cursorMap[dir], ...styleMap[dir] }} />;
  };

  const scrollBottom = () => {
    if (screenRef.current) screenRef.current.scrollTop = screenRef.current.scrollHeight;
  };

  const addEntry = useCallback((html: string, cls?: string) => {
    setScreenEntries(prev => [...prev, { html, cls }]);
    setTimeout(scrollBottom, 10);
  }, []);

  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const inlineMd = (s: string) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
      .replace(/\*(.+?)\*/g, "<i>$1</i>");

  const renderMarkdown = (text: string) => {
    return text.split("\n").map(line => {
      if (/^# /.test(line)) return `<div style="color:var(--accent);font-weight:500;font-size:14.5px;margin:2px 0 4px">${esc(line.replace(/^# /, ""))}</div>`;
      if (/^\*(.+)\*$/.test(line.trim()) && !line.trim().startsWith("**")) return `<div style="color:#9AABB5;margin:0 0 10px">${inlineMd(line.trim())}</div>`;
      if (/^- /.test(line)) return `<div style="color:#9AABB5;margin:0 0 2px;padding-left:2px">&nbsp;&nbsp;•&nbsp;${inlineMd(line.replace(/^- /, ""))}</div>`;
      if (line.trim() === "") return `<div>&nbsp;</div>`;
      return `<div style="color:#9AABB5;margin:0 0 4px">${inlineMd(line)}</div>`;
    }).join("");
  };

  const getNode = (path: string[]): FSNode | null => {
    let node: FSNode = fs.current;
    for (const seg of path) {
      if (node.type !== "dir" || !node.children[seg]) return null;
      node = node.children[seg];
    }
    return node;
  };

  const resolvePath = (raw: string, base: string[]): string[] => {
    let b = raw.startsWith("/") ? [] : [...base];
    for (const p of raw.split("/").filter(x => x && x !== ".")) {
      if (p === "..") b.pop();
      else if (p === "~") b = [];
      else b.push(p);
    }
    return b;
  };

  const listDir = (node: Extract<FSNode, { type: "dir" }>, showHidden: boolean) => {
    const names = Object.keys(node.children).filter(n => showHidden || !n.startsWith("."));
    const dirs = names.filter(n => node.children[n].type === "dir").sort();
    const files = names.filter(n => node.children[n].type !== "dir").sort();
    const parts = [
      ...dirs.map(d => `<span style="color:var(--accent)">${d}/</span>`),
      ...files.map(f => `<span style="color:var(--term-text)">${f}</span>`),
    ];
    return parts.join("  ") || '<span style="color:#455058">(empty)</span>';
  };

  const treeStr = (node: Extract<FSNode, { type: "dir" }>, prefix: string, showHidden: boolean): string => {
    let out = "";
    const names = Object.keys(node.children).filter(n => showHidden || !n.startsWith(".")).sort();
    names.forEach((name, i) => {
      const child = node.children[name];
      const last = i === names.length - 1;
      const col = child.type === "dir" ? "var(--accent)" : "var(--term-text)";
      out += `${prefix}${last ? "└── " : "├── "}<span style="color:${col}">${name}${child.type === "dir" ? "/" : ""}</span>\n`;
      if (child.type === "dir") out += treeStr(child, prefix + (last ? "    " : "│   "), showHidden);
    });
    return out;
  };

  const downloadResume = () => {
    const a = document.createElement("a");
    a.href = "/resume.pdf";
    a.download = "Mohamad_Halaweh_Resume.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const promptHtml = (cwdArr: string[]) => {
    const path = cwdArr.length ? "~/" + cwdArr.join("/") : "~";
    return `<span style="color:var(--accent)">mkhalaweh10@resume:${path}</span><span style="color:var(--dim)">$</span>`;
  };

  const runCommand = useCallback((raw: string, currentCwd: string[]) => {
    const trimmed = raw.trim();
    addEntry(`${promptHtml(currentCwd)} ${esc(raw)}`, "line");
    if (!trimmed) return currentCwd;

    const newHistory = [...historyRef.current, trimmed];
    historyRef.current = newHistory;
    setHistIdx(newHistory.length);

    const [cmd, ...rest] = trimmed.split(/\s+/);
    const args = rest.filter(a => !a.startsWith("-"));
    const flags = rest.filter(a => a.startsWith("-")).join("");
    const fullLower = trimmed.toLowerCase();

    if (fullLower.startsWith("sudo hire")) {
      addEntry(`[sudo] password accepted on the first try.\nrequest logged — reach out directly: <a href="mailto:mkhalaweh10@gmail.com" style="color:var(--accent)">mkhalaweh10@gmail.com</a>`);
      return currentCwd;
    }
    if (cmd === "nmap") {
      addEntry(`Starting scan...\nPORT     STATE  SERVICE\n25/tcp   open   mailto (mkhalaweh10@gmail.com)\nall other ports filtered — try the front door instead.`);
      return currentCwd;
    }
    if (fullLower.startsWith("rm -rf")) {
      addEntry("rm: this filesystem is mounted read-only. nice try though.", "err");
      return currentCwd;
    }
    if (cmd === "vim" || cmd === "vi") {
      addEntry(":wq — some things even a security engineer can't escape.");
      return currentCwd;
    }
    if (cmd === "man") {
      addEntry("No manual entry for humility. Try `help` instead.");
      return currentCwd;
    }
    if (cmd === "ping") {
      addEntry(`${args[0] || "host"}: already there. employee since 2025 — 0% packet loss.`);
      return currentCwd;
    }
    if (cmd === "sl") {
      addEntry(
        `      ====        ________                ___________\n  _D _|  |_______/        \\__I_I_____===__|_________|` +
        `\n   |(_)---  |   H\\________/ |   |        =|___ ___|` +
        `\n   /     |  |   H  |  |     |   |         ||_| |_||` +
        `\n  |      |  |   H  |__--------------------| [___] |` +
        `\n  | ________|___H__/__|_____/[][]~\\_______|       |` +
        `\n  |/ |   |-----------I_____I [][] [] D   |=======|__` +
        `\n  \\_/      \\__/  \\__/    \\__/      \\_/      \\__/` +
        `\n   choo choo — you meant 'ls', right?`,
        "ascii"
      );
      return currentCwd;
    }
    if (cmd === "sudo") {
      addEntry("mkhalaweh10 is not in the sudoers file. this incident has been reported (to no one).", "err");
      return currentCwd;
    }
    if (cmd === "whoami" && (flags.includes("verbose") || fullLower.includes("--verbose"))) {
      addEntry(
        `uid=1000(mkhalaweh10) gid=1000(security-consulting)\nname         ${resume.name}\nrole         ${resume.title}\ngroups       cloud-security, iam, siem-soc, compliance, mentors\nclearance    see .clearance (ls -a)\nshell        /bin/consultant\nsignal       mkhalaweh10@gmail.com\nstatus       not actively looking, always listening`
      );
      return currentCwd;
    }

    let newCwd = currentCwd;
    switch (cmd) {
      case "ls": {
        const target = args[0] ? resolvePath(args[0], currentCwd) : currentCwd;
        const node = getNode(target);
        if (!node) { addEntry(`ls: cannot access '${args[0] || ""}': No such file or directory`, "err"); break; }
        if (node.type !== "dir") { addEntry(args[0] || "", "out"); break; }
        const showHidden = flags.includes("a") || flags.includes("l");
        addEntry(listDir(node, showHidden));
        break;
      }
      case "cd": {
        if (!args[0] || args[0] === "~") { newCwd = []; break; }
        const target = resolvePath(args[0], currentCwd);
        const node = getNode(target);
        if (!node) { addEntry(`cd: ${args[0]}: No such file or directory`, "err"); break; }
        if (node.type !== "dir") { addEntry(`cd: ${args[0]}: Not a directory`, "err"); break; }
        newCwd = target;
        break;
      }
      case "cat": {
        if (!args[0]) { addEntry("cat: missing operand", "err"); break; }
        const target = resolvePath(args[0], currentCwd);
        const node = getNode(target);
        if (!node) { addEntry(`cat: ${args[0]}: No such file or directory`, "err"); break; }
        if (node.type === "dir") { addEntry(`cat: ${args[0]}: Is a directory`, "err"); break; }
        if (node.type === "pdf") { addEntry("resume.pdf is binary — downloading..."); downloadResume(); break; }
        const fname = target[target.length - 1] || "";
        if (fname.endsWith(".md")) addEntry(renderMarkdown(node.content));
        else addEntry(esc(node.content).replace(/\n/g, "<br>"));
        break;
      }
      case "open": {
        if (args[0] === "resume.pdf") { addEntry("opening resume.pdf..."); downloadResume(); break; }
        const openTarget = resolvePath(args[0] || "", currentCwd);
        const openNode = getNode(openTarget);
        if (openNode && openNode.type === "file" && openNode.url) {
          addEntry(`opening ${args[0]}...`);
          window.open(openNode.url, "_blank", "noopener");
          break;
        }
        addEntry(`open: ${args[0] || ""}: No such file or directory`, "err");
        break;
      }
      case "pwd":
        addEntry("/" + currentCwd.join("/"));
        break;
      case "whoami":
        addEntry(`${esc(resume.name)} — <b>${esc(resume.title)}</b>`);
        break;
      case "tree": {
        const target = args[0] ? resolvePath(args[0], currentCwd) : currentCwd;
        const node = getNode(target);
        if (!node || node.type !== "dir") { addEntry("tree: not a directory", "err"); break; }
        addEntry(".\n" + treeStr(node, "", flags.includes("a")), "ascii");
        break;
      }
      case "clear":
        setScreenEntries([]);
        break;
      case "help":
        addEntry(
          `available commands:\n  ls [-a] [path]     list files and directories\n  cd [path]          change directory\n  cat [file]         print file contents (renders markdown)\n  open [file]        open a file — resume.pdf downloads, articles open in browser\n  pwd                print working directory\n  tree [-a]          show directory structure\n  whoami             identity check\n  clear              clear the screen\n\ntry: ls, cd articles, cat <slug>.md, open articles/<slug>.md`
        );
        break;
      default:
        addEntry(`bash: ${esc(cmd)}: command not found`, "err");
    }
    return newCwd;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume, addEntry]);

  const handleEnter = () => {
    const val = inputVal;
    const newCwd = runCommand(val, cwdRef.current);
    cwdRef.current = newCwd;
    setCwd(newCwd);
    setInputVal("");
  };

  const commonPrefix = (strs: string[]) => {
    if (!strs.length) return "";
    let prefix = strs[0];
    for (const s of strs) while (!s.startsWith(prefix)) prefix = prefix.slice(0, -1);
    return prefix;
  };

  const handleTab = () => {
    const val = inputVal;
    const endsWithSpace = /\s$/.test(val);
    const tokens = val.split(/\s+/).filter(Boolean);
    const isCmdSlot = tokens.length === 0 || (tokens.length === 1 && !endsWithSpace);
    if (isCmdSlot) {
      const partial = tokens[0] || "";
      const matches = COMMANDS.filter(c => c.startsWith(partial));
      if (matches.length === 1) setInputVal(matches[0] + " ");
      else if (matches.length > 1) {
        const cp = commonPrefix(matches);
        if (cp.length > partial.length) setInputVal(cp);
        else addEntry(matches.join("  "));
      }
      return;
    }
    const partialPath = endsWithSpace ? "" : tokens[tokens.length - 1];
    const lastSlash = partialPath.lastIndexOf("/");
    const dirPart = lastSlash >= 0 ? partialPath.slice(0, lastSlash) : "";
    const namePart = lastSlash >= 0 ? partialPath.slice(lastSlash + 1) : partialPath;
    const dirTarget = dirPart ? resolvePath(dirPart, cwdRef.current) : cwdRef.current;
    const dirNode = getNode(dirTarget);
    if (!dirNode || dirNode.type !== "dir") return;
    const names = Object.keys(dirNode.children).filter(n => n.startsWith(namePart) && (namePart.startsWith(".") || !n.startsWith(".")));
    if (!names.length) return;
    if (names.length === 1) {
      const child = dirNode.children[names[0]];
      const completed = (dirPart ? dirPart + "/" : "") + names[0] + (child.type === "dir" ? "/" : "");
      const before = tokens.slice(0, tokens.length - (endsWithSpace ? 0 : 1)).join(" ");
      setInputVal((before ? before + " " : "") + completed);
    } else {
      const cp = commonPrefix(names);
      if (cp.length > namePart.length) {
        const completed = (dirPart ? dirPart + "/" : "") + cp;
        const before = tokens.slice(0, tokens.length - (endsWithSpace ? 0 : 1)).join(" ");
        setInputVal((before ? before + " " : "") + completed);
      } else {
        const display = names.map(m => dirNode.children[m].type === "dir" ? m + "/" : m);
        addEntry(display.join("  "));
      }
    }
  };

  const openTerm = () => {
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    setWinState(mobile ? "maximized" : "windowed");
    setAnimPhase("in");
    setScreenEntries([]);
    cwdRef.current = [];
    setCwd([]);
    historyRef.current = [];
    setHistIdx(-1);
    requestAnimationFrame(() => requestAnimationFrame(() => setAnimPhase("open")));
    setTimeout(() => {
      addEntry('Welcome. Try <b>ls</b>, <b>cd articles</b>, <b>open resume.pdf</b>, or <b>help</b>. Tab completes.');
      inputRef.current?.focus();
    }, 80);
  };

  const closeTerm = () => {
    setAnimPhase("out");
    setTimeout(() => { setWinState("closed"); setAnimPhase("open"); }, 200);
  };

  const promptPath = cwd.length ? "~/" + cwd.join("/") : "~";

  const animStyle: React.CSSProperties = animPhase === "in"
    ? { opacity: 0, transform: "scale(0.96) translateY(10px)" }
    : animPhase === "out"
    ? { opacity: 0, transform: "scale(0.96) translateY(10px)", transition: "opacity 0.18s ease, transform 0.18s ease" }
    : { opacity: 1, transform: "scale(1) translateY(0)", transition: "opacity 0.22s ease, transform 0.22s ease" };

  const termStyle: React.CSSProperties = winState === "maximized"
    ? { position: "fixed", inset: 0, width: "100%", maxWidth: "none", height: isMobile ? "100dvh" : "100%", borderRadius: 0, display: "flex", flexDirection: "column", background: "#0D1319", border: "none", zIndex: 950, ...animStyle }
    : pos
    ? { position: "fixed", left: pos.x, top: pos.y, width: size.width, height: size.height, display: "flex", flexDirection: "column", background: "#0D1319", border: "1px solid var(--term-line)", borderRadius: 8, zIndex: 950, boxShadow: "0 12px 40px rgba(0,0,0,.35)", ...animStyle }
    : { position: "fixed", bottom: 28, right: 28, width: size.width, height: size.height, display: "flex", flexDirection: "column", background: "#0D1319", border: "1px solid var(--term-line)", borderRadius: 8, zIndex: 950, boxShadow: "0 12px 40px rgba(0,0,0,.35)", ...animStyle };

  return (
    <>
      {winState === "closed" && (
        <button
          onClick={openTerm}
          style={{ position: "fixed", bottom: 28, right: 28, zIndex: 900, background: "var(--term-bg)", color: "var(--accent)", border: "1px solid var(--term-line)", fontFamily: "'JetBrains Mono', monospace", fontSize: isMobile ? 15 : 13, padding: isMobile ? "16px 22px" : "12px 18px", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 16px rgba(0,0,0,.18)" }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--term-line)")}
        >
          <span className="term-pulse" style={{ fontSize: isMobile ? 17 : 15 }}>&gt;_</span>
          <span>Open terminal</span>
        </button>
      )}

      {winState === "minimized" && (
        <button
          onClick={() => setWinState("windowed")}
          style={{ position: "fixed", bottom: 28, right: 28, zIndex: 900, background: "var(--term-bg)", color: "var(--term-text)", border: "1px solid var(--term-line)", fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, padding: "10px 16px", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 16px rgba(0,0,0,.18)" }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--term-line)")}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
          <span>mkhalaweh10@resume — bash</span>
        </button>
      )}

      {(winState === "windowed" || winState === "maximized") && (
        <div style={{ ...termStyle, position: "fixed", overflow: "hidden" }} onClick={e => { if (!(e.target as HTMLElement).closest(".term-bar")) inputRef.current?.focus(); }}>
          {winState === "windowed" && !isMobile && <>
            <ResizeHandle dir="n" /><ResizeHandle dir="s" /><ResizeHandle dir="e" /><ResizeHandle dir="w" />
            <ResizeHandle dir="ne" /><ResizeHandle dir="nw" /><ResizeHandle dir="se" /><ResizeHandle dir="sw" />
          </>}
          <div className="term-bar" onMouseDown={isMobile ? undefined : handleDragStart} style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", borderBottom: "1px solid var(--term-line)", flexShrink: 0, cursor: isMobile ? "default" : "grab", userSelect: "none" }}>
            <button onClick={closeTerm} style={{ width: 13, height: 13, borderRadius: "50%", background: "#E8615A", border: "none", cursor: "pointer" }} title="Close" />
            {!isMobile && <button onClick={() => setWinState("minimized")} style={{ width: 13, height: 13, borderRadius: "50%", background: "#E8B93F", border: "none", cursor: "pointer" }} title="Minimize" />}
            {!isMobile && <button onClick={() => setWinState(s => s === "maximized" ? "windowed" : "maximized")} style={{ width: 13, height: 13, borderRadius: "50%", background: "#3FBF5D", border: "none", cursor: "pointer" }} title="Maximize" />}
            <span style={{ marginLeft: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--dim)", flex: 1 }}>mkhalaweh10@resume — bash</span>
          </div>
          <div
            ref={screenRef}
            className="term-screen"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13.5, lineHeight: 1.75, color: "var(--term-text)", padding: "20px 20px 0", flex: 1, overflowY: "auto" }}
          >
            {screenEntries.map((entry, i) => {
              if (entry.cls === "ascii") {
                return <pre key={i} style={{ color: "#9AABB5", margin: "0 0 14px 0", whiteSpace: "pre", overflowX: "auto", fontSize: 11, lineHeight: 1.35 }}>{entry.html}</pre>;
              }
              return (
                <div
                  key={i}
                  style={
                    entry.cls === "err"
                      ? { color: "#D98872", margin: "0 0 14px 0", whiteSpace: "pre-wrap" }
                      : entry.cls === "line"
                      ? { whiteSpace: "pre-wrap", marginBottom: 2 }
                      : { color: "#9AABB5", margin: "0 0 14px 0", whiteSpace: "pre-wrap" }
                  }
                  dangerouslySetInnerHTML={{ __html: entry.html }}
                />
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", padding: "14px 20px 20px", gap: 8, flexShrink: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 13.5 }}>
            <span style={{ color: "var(--accent)" }}>mkhalaweh10@resume:{promptPath}</span>
            <span style={{ color: "var(--dim)" }}>$</span>
            <input
              ref={inputRef}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Tab") { e.preventDefault(); handleTab(); }
                else if (e.key === "Enter") handleEnter();
                else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  const idx = histIdx > 0 ? histIdx - 1 : 0;
                  setHistIdx(idx);
                  setInputVal(historyRef.current[idx] || "");
                }
                else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  const idx = histIdx < historyRef.current.length - 1 ? histIdx + 1 : historyRef.current.length;
                  setHistIdx(idx);
                  setInputVal(historyRef.current[idx] || "");
                }
              }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              inputMode="text"
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--term-text)", fontFamily: "'JetBrains Mono', monospace", fontSize: isMobile ? 16 : 13.5 }}
            />
          </div>
        </div>
      )}
    </>
  );
}
