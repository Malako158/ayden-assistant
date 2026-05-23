/*
 * Second Brain Ops Center — Obsidian Plugin
 * Ayden / Escalation Media
 *
 * Provides a full-panel dashboard view showing:
 *  - Scheduled tasks (Claude Code, Omi AI, Obsidian automations)
 *  - Task outputs pulled from vault folders
 *  - Project overview
 *  - Add / run tasks
 */

const { Plugin, ItemView, WorkspaceLeaf, PluginSettingTab, Setting, Notice, TFile, Modal } = require('obsidian');

// ─── Constants ────────────────────────────────────────────────────────────────

const VIEW_TYPE = 'second-brain-ops';

const DEFAULT_SETTINGS = {
  claudeOutputFolder: 'ClaudeCode/Outputs',
  omiFolder: 'Omi/Daily',
  obsidianOutputFolder: 'Outputs',
  tasks: [],
  lastRefresh: null,
};

// ─── Plugin ───────────────────────────────────────────────────────────────────

class SecondBrainPlugin extends Plugin {
  settings = {};

  async onload() {
    await this.loadSettings();

    // Register the view
    this.registerView(VIEW_TYPE, (leaf) => new OpsView(leaf, this));

    // Ribbon icon to open the panel
    this.addRibbonIcon('layout-dashboard', 'Second Brain Ops Center', () => {
      this.activateView();
    });

    // Command palette
    this.addCommand({
      id: 'open-ops-center',
      name: 'Open Ops Center',
      callback: () => this.activateView(),
    });

    this.addCommand({
      id: 'refresh-ops-center',
      name: 'Refresh Ops Center',
      callback: () => this.refreshActiveView(),
    });

    // Settings tab
    this.addSettingTab(new OpsSettingTab(this.app, this));

    // Auto-open on startup (optional — controlled by setting)
    if (this.settings.openOnStartup) {
      this.app.workspace.onLayoutReady(() => this.activateView());
    }
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
  }

  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = workspace.getRightLeaf(false);
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    workspace.revealLeaf(leaf);
  }

  refreshActiveView() {
    const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (leaf?.view instanceof OpsView) {
      leaf.view.refresh();
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    if (!Array.isArray(this.settings.tasks)) this.settings.tasks = [];
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

// ─── View ─────────────────────────────────────────────────────────────────────

class OpsView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.currentView = 'overview';
    this.outputs = [];
    this.projects = [];
  }

  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return 'Ops Center'; }
  getIcon() { return 'layout-dashboard'; }

  async onOpen() {
    await this.refresh();
  }

  async refresh() {
    this.outputs = await this.loadOutputsFromVault();
    this.projects = await this.loadProjectsFromVault();
    this.plugin.settings.lastRefresh = new Date().toISOString();
    await this.plugin.saveSettings();
    this.render();
  }

  // ── Vault readers ──────────────────────────────────────────────────────────

  async loadOutputsFromVault() {
    const outputs = [];
    const folders = [
      { folder: this.plugin.settings.claudeOutputFolder, source: 'claude' },
      { folder: this.plugin.settings.omiFolder, source: 'omi' },
      { folder: this.plugin.settings.obsidianOutputFolder, source: 'obsidian' },
    ];

    for (const { folder, source } of folders) {
      const files = this.app.vault.getMarkdownFiles()
        .filter(f => f.path.startsWith(folder + '/'))
        .sort((a, b) => b.stat.mtime - a.stat.mtime)
        .slice(0, 8);

      for (const file of files) {
        const content = await this.app.vault.read(file);
        const lines = content.split('\n').filter(l => l.trim());
        const preview = lines.slice(0, 3).join(' ').replace(/#+\s*/g, '').substring(0, 120);
        outputs.push({
          id: file.path,
          task: file.basename.replace(/-/g, ' ').replace(/_/g, ' '),
          source,
          time: this.timeAgo(file.stat.mtime),
          preview: preview || '(empty)',
          content,
          path: file.path,
          mtime: file.stat.mtime,
        });
      }
    }

    return outputs.sort((a, b) => b.mtime - a.mtime).slice(0, 20);
  }

  async loadProjectsFromVault() {
    const folderSet = new Map();
    this.app.vault.getMarkdownFiles().forEach(f => {
      const parts = f.path.split('/');
      if (parts.length > 1) {
        const top = parts[0];
        if (!folderSet.has(top)) folderSet.set(top, { name: top, count: 0, tasks: 0 });
        folderSet.get(top).count++;
        if (f.path.includes('task') || f.path.includes('Task')) {
          folderSet.get(top).tasks++;
        }
      }
    });

    const icons = { 'Escalation Media': '📹', 'ALVION': '🤝', 'Omi': '🎙', 'ClaudeCode': '◉', 'Goals': '🎯', 'Clients': '👥', 'Finance': '💰', 'Personal': '⚡', 'Outputs': '📤' };
    const colors = ['#5b8fff', '#a78bfa', '#34d399', '#fbbf24', '#f87171', '#06b6d4', '#ec4899'];
    let ci = 0;

    return Array.from(folderSet.values())
      .filter(p => !p.name.startsWith('.'))
      .map(p => ({
        ...p,
        icon: icons[p.name] || '◧',
        color: colors[ci++ % colors.length],
        completed: Math.floor(p.count * 0.6),
      }))
      .slice(0, 9);
  }

  timeAgo(mtime) {
    const diff = Date.now() - mtime;
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    return `${Math.floor(hr / 24)}d ago`;
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  render() {
    const container = this.containerEl.children[1];
    container.empty();
    container.setAttribute('style', 'padding:0; overflow:hidden; height:100%; display:flex; flex-direction:column;');

    const root = container.createEl('div', { cls: 'sbo-root' });
    this.injectStyles(root);

    const app = root.createEl('div', { cls: 'sbo-app' });
    this.buildTopbar(app);

    const body = app.createEl('div', { cls: 'sbo-body' });
    this.buildSidebar(body);

    this.mainEl = body.createEl('div', { cls: 'sbo-main' });
    this.renderView();
  }

  renderView() {
    if (!this.mainEl) return;
    this.mainEl.empty();
    const views = {
      overview: () => this.buildOverview(this.mainEl),
      tasks: () => this.buildTasksView(this.mainEl),
      outputs: () => this.buildOutputsView(this.mainEl),
      projects: () => this.buildProjectsView(this.mainEl),
    };
    (views[this.currentView] || views.overview)();
  }

  // ── Topbar ─────────────────────────────────────────────────────────────────

  buildTopbar(parent) {
    const bar = parent.createEl('div', { cls: 'sbo-topbar' });
    const left = bar.createEl('div', { cls: 'sbo-topbar-left' });
    left.createEl('div', { cls: 'sbo-logo', text: 'OPS CENTER' });
    const sep = left.createEl('div', { cls: 'sbo-sep' });
    left.createEl('div', { cls: 'sbo-subtitle', text: 'Second Brain' });

    const right = bar.createEl('div', { cls: 'sbo-topbar-right' });

    const refreshBtn = right.createEl('button', { cls: 'sbo-btn', text: '↻ Refresh' });
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.textContent = '↻ …';
      refreshBtn.disabled = true;
      await this.refresh();
      refreshBtn.textContent = '↻ Refresh';
      refreshBtn.disabled = false;
      new Notice('Ops Center refreshed');
    });

    const addBtn = right.createEl('button', { cls: 'sbo-btn sbo-btn-primary', text: '+ Task' });
    addBtn.addEventListener('click', () => this.openAddTaskModal());
  }

  // ── Sidebar ────────────────────────────────────────────────────────────────

  buildSidebar(parent) {
    const sidebar = parent.createEl('nav', { cls: 'sbo-sidebar' });

    const navItems = [
      { id: 'overview', icon: '◈', label: 'Overview' },
      { id: 'tasks', icon: '⊞', label: 'Scheduled Tasks', badge: () => String(this.plugin.settings.tasks.length) },
      { id: 'outputs', icon: '≡', label: 'Task Outputs', badge: () => String(this.outputs.length) },
      { id: 'projects', icon: '◧', label: 'Projects', badge: () => String(this.projects.length) },
    ];

    const sep = sidebar.createEl('div', { cls: 'sbo-sidebar-label', text: 'Views' });

    navItems.forEach(item => {
      const el = sidebar.createEl('div', {
        cls: `sbo-nav-item${this.currentView === item.id ? ' active' : ''}`,
      });
      el.createEl('span', { cls: 'sbo-nav-icon', text: item.icon });
      el.createEl('span', { text: item.label });
      if (item.badge) {
        const b = el.createEl('span', { cls: 'sbo-nav-badge', text: item.badge() });
      }
      el.addEventListener('click', () => {
        this.currentView = item.id;
        this.renderView();
        sidebar.querySelectorAll('.sbo-nav-item').forEach(n => n.removeClass('active'));
        el.addClass('active');
      });
    });

    sidebar.createEl('div', { cls: 'sbo-sidebar-divider' });
    sidebar.createEl('div', { cls: 'sbo-sidebar-label', text: 'Actions' });

    const addItem = sidebar.createEl('div', { cls: 'sbo-nav-item' });
    addItem.createEl('span', { cls: 'sbo-nav-icon', text: '+' });
    addItem.createEl('span', { text: 'New Task' });
    addItem.addEventListener('click', () => this.openAddTaskModal());

    const settingsItem = sidebar.createEl('div', { cls: 'sbo-nav-item' });
    settingsItem.createEl('span', { cls: 'sbo-nav-icon', text: '⚙' });
    settingsItem.createEl('span', { text: 'Settings' });
    settingsItem.addEventListener('click', () => {
      this.app.setting.open();
      this.app.setting.openTabById('second-brain-ops');
    });
  }

  // ── Overview ───────────────────────────────────────────────────────────────

  buildOverview(parent) {
    const tasks = this.plugin.settings.tasks;
    const success = tasks.filter(t => t.status === 'success').length;
    const running = tasks.filter(t => t.status === 'running').length;
    const errors = tasks.filter(t => t.status === 'error').length;

    this.buildPageHeader(parent, 'Overview',
      `${new Date().toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}`);

    // Stats
    const stats = parent.createEl('div', { cls: 'sbo-stats' });
    [
      { label: 'Total Tasks', value: tasks.length, cls: 'blue' },
      { label: 'Completed', value: success, cls: 'green' },
      { label: 'Running', value: running, cls: 'purple' },
      { label: 'Errors', value: errors, cls: 'amber' },
    ].forEach(s => {
      const card = stats.createEl('div', { cls: `sbo-stat-card ${s.cls}` });
      card.createEl('div', { cls: 'sbo-stat-label', text: s.label });
      card.createEl('div', { cls: `sbo-stat-value ${s.cls}`, text: String(s.value) });
    });

    const two = parent.createEl('div', { cls: 'sbo-two-col' });

    // Tasks panel
    const tp = this.buildPanel(two, 'Scheduled Tasks');
    this.buildTaskTable(tp, tasks.slice(0, 6));

    // Outputs panel
    const op = this.buildPanel(two, 'Recent Outputs');
    this.buildOutputLog(op, this.outputs.slice(0, 6));
  }

  // ── Tasks View ─────────────────────────────────────────────────────────────

  buildTasksView(parent) {
    this.buildPageHeader(parent, 'Scheduled Tasks', `${this.plugin.settings.tasks.length} automations`);
    const panel = this.buildPanel(parent, '');
    this.buildTaskTable(panel, this.plugin.settings.tasks);
    if (this.plugin.settings.tasks.length === 0) {
      panel.createEl('div', { cls: 'sbo-empty', text: 'No tasks yet. Click + Task to add one.' });
    }
  }

  // ── Outputs View ───────────────────────────────────────────────────────────

  buildOutputsView(parent) {
    this.buildPageHeader(parent, 'Task Outputs', `${this.outputs.length} notes from vault`);
    const panel = this.buildPanel(parent, '');
    if (this.outputs.length === 0) {
      const empty = panel.createEl('div', { cls: 'sbo-empty' });
      empty.createEl('div', { text: '○', cls: 'sbo-empty-icon' });
      empty.createEl('div', { text: `No output notes found. Check your folder settings — currently scanning: ${this.plugin.settings.claudeOutputFolder}, ${this.plugin.settings.omiFolder}` });
    } else {
      this.buildOutputLog(panel, this.outputs);
    }
  }

  // ── Projects View ──────────────────────────────────────────────────────────

  buildProjectsView(parent) {
    this.buildPageHeader(parent, 'Vault Projects', `${this.projects.length} top-level folders`);
    const panel = this.buildPanel(parent, '');
    const grid = panel.createEl('div', { cls: 'sbo-project-grid' });
    this.projects.forEach(p => {
      const card = grid.createEl('div', { cls: 'sbo-project-card' });
      const top = card.createEl('div', { cls: 'sbo-project-top' });
      top.createEl('div', { cls: 'sbo-project-icon', text: p.icon });
      card.createEl('div', { cls: 'sbo-project-name', text: p.name });
      card.createEl('div', { cls: 'sbo-project-count', text: `${p.count} notes` });
      const bar = card.createEl('div', { cls: 'sbo-bar' });
      const fill = bar.createEl('div', { cls: 'sbo-bar-fill' });
      fill.style.width = p.count > 0 ? '60%' : '0%';
      fill.style.background = p.color;
      card.addEventListener('click', () => {
        this.app.workspace.openLinkText(p.name, '', false);
      });
    });
  }

  // ── Shared builders ────────────────────────────────────────────────────────

  buildPageHeader(parent, title, desc) {
    const header = parent.createEl('div', { cls: 'sbo-page-header' });
    const left = header.createEl('div');
    left.createEl('div', { cls: 'sbo-page-title', text: title });
    if (desc) left.createEl('div', { cls: 'sbo-page-desc', text: desc });
  }

  buildPanel(parent, title) {
    const panel = parent.createEl('div', { cls: 'sbo-panel' });
    if (title) {
      const ph = panel.createEl('div', { cls: 'sbo-panel-header' });
      ph.createEl('div', { cls: 'sbo-panel-title', text: title });
    }
    return panel;
  }

  buildTaskTable(parent, tasks) {
    const table = parent.createEl('div', { cls: 'sbo-task-table' });

    // Header row
    const hr = table.createEl('div', { cls: 'sbo-task-row sbo-task-header' });
    ['', 'Task', 'Source', 'Freq', 'Last Run', 'Status', ''].forEach(h => {
      hr.createEl('div', { text: h });
    });

    if (tasks.length === 0) {
      table.createEl('div', { cls: 'sbo-empty', text: 'No tasks scheduled.' });
      return;
    }

    tasks.forEach(task => {
      const row = table.createEl('div', { cls: 'sbo-task-row' });

      // Check
      const check = row.createEl('div', { cls: `sbo-check ${task.status === 'success' ? 'done' : task.status === 'running' ? 'running' : 'pending'}` });
      check.text = task.status === 'success' ? '✓' : task.status === 'running' ? '…' : '';

      // Name + path
      const nameCell = row.createEl('div', { cls: 'sbo-task-name-cell' });
      nameCell.createEl('div', { cls: 'sbo-task-name-text', text: task.name });
      if (task.path) nameCell.createEl('div', { cls: 'sbo-task-path', text: task.path });

      // Source tag
      const srcCell = row.createEl('div');
      srcCell.createEl('span', { cls: `sbo-tag ${task.source}`, text: task.source === 'claude' ? 'Claude' : task.source === 'omi' ? 'Omi' : 'Vault' });

      // Freq
      row.createEl('div', { cls: 'sbo-cell-muted', text: task.freq || '—' });

      // Last run
      row.createEl('div', { cls: 'sbo-cell-muted', text: task.lastRun || '—' });

      // Status pill
      const sc = row.createEl('div');
      sc.createEl('span', { cls: `sbo-pill ${task.status}`, text: task.status || 'pending' });

      // Actions
      const ac = row.createEl('div', { cls: 'sbo-row-actions' });

      const runBtn = ac.createEl('button', { cls: 'sbo-icon-btn', text: '▷' });
      runBtn.title = 'Run now';
      runBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.runTask(task);
      });

      const delBtn = ac.createEl('button', { cls: 'sbo-icon-btn sbo-del', text: '✕' });
      delBtn.title = 'Delete task';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteTask(task.id);
      });
    });
  }

  buildOutputLog(parent, outputs) {
    outputs.forEach(o => {
      const entry = parent.createEl('div', { cls: 'sbo-log-entry' });
      const header = entry.createEl('div', { cls: 'sbo-log-header' });
      header.createEl('div', { cls: 'sbo-log-name', text: o.task });
      header.createEl('div', { cls: 'sbo-log-time', text: o.time });
      const meta = entry.createEl('div', { cls: 'sbo-log-meta' });
      meta.createEl('span', { cls: `sbo-tag ${o.source}`, text: o.source === 'claude' ? 'Claude' : o.source === 'omi' ? 'Omi' : 'Vault' });
      entry.createEl('div', { cls: 'sbo-log-preview', text: o.preview });

      entry.addEventListener('click', () => this.openOutputModal(o));
    });
  }

  // ── Modals ─────────────────────────────────────────────────────────────────

  openAddTaskModal() {
    const modal = new AddTaskModal(this.app, async (task) => {
      task.id = Date.now();
      task.status = 'pending';
      task.lastRun = '—';
      this.plugin.settings.tasks.push(task);
      await this.plugin.saveSettings();
      this.renderView();
      new Notice(`Task "${task.name}" added`);
    });
    modal.open();
  }

  openOutputModal(output) {
    const modal = new OutputDetailModal(this.app, output);
    modal.open();
  }

  async runTask(task) {
    task.status = 'running';
    this.renderView();
    new Notice(`Running: ${task.name}…`);

    // Write a stub output note to the vault
    await new Promise(r => setTimeout(r, 1200));

    const folder = this.plugin.settings.claudeOutputFolder;
    const date = new Date().toISOString().split('T')[0];
    const fname = `${folder}/${task.name.replace(/\s+/g, '-').toLowerCase()}-${date}.md`;
    const noteContent = `# ${task.name}\nRan: ${new Date().toLocaleString()}\nSource: ${task.source}\n\n_Task output will appear here when your automation writes to this path._\n\nPath configured: \`${task.path || folder}\`\n`;

    try {
      const existing = this.app.vault.getAbstractFileByPath(fname);
      if (existing) {
        await this.app.vault.modify(existing, noteContent);
      } else {
        // Create folder if needed
        try { await this.app.vault.createFolder(folder); } catch {}
        await this.app.vault.create(fname, noteContent);
      }
      task.status = 'success';
      task.lastRun = 'Just now';
      new Notice(`✓ ${task.name} complete — note written to vault`);
    } catch (e) {
      task.status = 'error';
      new Notice(`✗ Error running ${task.name}: ${e.message}`);
    }

    await this.plugin.saveSettings();
    await this.refresh();
  }

  async deleteTask(id) {
    this.plugin.settings.tasks = this.plugin.settings.tasks.filter(t => t.id !== id);
    await this.plugin.saveSettings();
    this.renderView();
  }

  // ── Styles ─────────────────────────────────────────────────────────────────

  injectStyles(root) {
    const style = root.createEl('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@600;700;800&display=swap');

      .sbo-root { height: 100%; overflow: hidden; display: flex; flex-direction: column; }

      .sbo-app {
        display: flex;
        flex-direction: column;
        height: 100%;
        font-family: 'DM Mono', monospace;
        font-size: 12px;
        background: var(--background-primary);
        color: var(--text-normal);
        overflow: hidden;
      }

      /* TOPBAR */
      .sbo-topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        border-bottom: 1px solid var(--background-modifier-border);
        flex-shrink: 0;
        gap: 8px;
        flex-wrap: wrap;
      }
      .sbo-topbar-left { display: flex; align-items: center; gap: 8px; }
      .sbo-logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 13px; letter-spacing: 0.06em; color: var(--text-accent); }
      .sbo-sep { width: 1px; height: 14px; background: var(--background-modifier-border); }
      .sbo-subtitle { font-size: 10px; color: var(--text-muted); letter-spacing: 0.06em; }
      .sbo-topbar-right { display: flex; align-items: center; gap: 6px; }

      /* BODY */
      .sbo-body { display: flex; flex: 1; overflow: hidden; }

      /* SIDEBAR */
      .sbo-sidebar {
        width: 160px;
        flex-shrink: 0;
        border-right: 1px solid var(--background-modifier-border);
        padding: 10px 6px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 1px;
      }
      .sbo-sidebar-label { font-size: 9px; color: var(--text-faint); letter-spacing: 0.1em; text-transform: uppercase; padding: 6px 6px 3px; }
      .sbo-sidebar-divider { height: 1px; background: var(--background-modifier-border); margin: 6px 4px; }
      .sbo-nav-item {
        display: flex; align-items: center; gap: 6px;
        padding: 6px 6px; border-radius: 5px; cursor: pointer;
        font-size: 11px; color: var(--text-muted); transition: all 0.12s;
      }
      .sbo-nav-item:hover { background: var(--background-modifier-hover); color: var(--text-normal); }
      .sbo-nav-item.active { background: var(--interactive-accent-hover); color: var(--text-accent); }
      .sbo-nav-icon { width: 13px; text-align: center; flex-shrink: 0; }
      .sbo-nav-badge {
        margin-left: auto; font-size: 9px; padding: 1px 4px;
        border-radius: 8px; background: var(--background-modifier-border);
        color: var(--text-faint);
      }

      /* MAIN */
      .sbo-main { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 12px; }

      /* BUTTONS */
      .sbo-btn {
        font-family: 'DM Mono', monospace; font-size: 11px;
        padding: 5px 10px; border-radius: 4px;
        border: 1px solid var(--background-modifier-border);
        background: var(--background-secondary);
        color: var(--text-muted); cursor: pointer; transition: all 0.12s;
      }
      .sbo-btn:hover { border-color: var(--text-accent); color: var(--text-accent); }
      .sbo-btn-primary { background: var(--interactive-accent-hover); border-color: var(--text-accent); color: var(--text-accent); }
      .sbo-icon-btn {
        font-size: 10px; padding: 2px 6px; border-radius: 3px;
        border: 1px solid transparent; background: transparent;
        cursor: pointer; color: var(--text-faint); transition: all 0.1s;
      }
      .sbo-icon-btn:hover { background: var(--background-modifier-hover); color: var(--text-normal); border-color: var(--background-modifier-border); }
      .sbo-icon-btn.sbo-del:hover { color: var(--text-error); }

      /* PAGE HEADER */
      .sbo-page-header { margin-bottom: 4px; }
      .sbo-page-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; }
      .sbo-page-desc { font-size: 10px; color: var(--text-muted); margin-top: 2px; }

      /* STATS */
      .sbo-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
      .sbo-stat-card {
        background: var(--background-secondary); border: 1px solid var(--background-modifier-border);
        border-radius: 7px; padding: 10px 12px; display: flex; flex-direction: column; gap: 4px;
      }
      .sbo-stat-label { font-size: 9px; color: var(--text-faint); letter-spacing: 0.07em; text-transform: uppercase; }
      .sbo-stat-value { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; line-height: 1; }
      .sbo-stat-value.blue, .sbo-stat-card.blue .sbo-stat-value { color: var(--text-accent); }
      .sbo-stat-value.green, .sbo-stat-card.green .sbo-stat-value { color: var(--color-green, #34d399); }
      .sbo-stat-value.purple, .sbo-stat-card.purple .sbo-stat-value { color: var(--color-purple, #a78bfa); }
      .sbo-stat-value.amber, .sbo-stat-card.amber .sbo-stat-value { color: var(--color-yellow, #fbbf24); }

      /* TWO COL */
      .sbo-two-col { display: grid; grid-template-columns: 1fr 260px; gap: 12px; }

      /* PANEL */
      .sbo-panel { background: var(--background-secondary); border: 1px solid var(--background-modifier-border); border-radius: 7px; overflow: hidden; }
      .sbo-panel-header { display: flex; align-items: center; justify-content: space-between; padding: 9px 12px; border-bottom: 1px solid var(--background-modifier-border); }
      .sbo-panel-title { font-size: 10px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: var(--text-muted); }

      /* TASK TABLE */
      .sbo-task-table { width: 100%; }
      .sbo-task-row {
        display: grid;
        grid-template-columns: 18px 1fr 60px 55px 65px 65px 50px;
        gap: 8px; align-items: center;
        padding: 8px 12px; border-bottom: 1px solid var(--background-modifier-border);
        transition: background 0.1s; font-size: 11px;
      }
      .sbo-task-row:last-child { border-bottom: none; }
      .sbo-task-row:hover { background: var(--background-modifier-hover); }
      .sbo-task-header { font-size: 9px; color: var(--text-faint); letter-spacing: 0.07em; text-transform: uppercase; }
      .sbo-task-header:hover { background: transparent; }

      .sbo-check { width: 13px; height: 13px; border: 1px solid var(--background-modifier-border); border-radius: 3px; display: flex; align-items: center; justify-content: center; font-size: 8px; flex-shrink: 0; }
      .sbo-check.done { border-color: var(--color-green, #34d399); color: var(--color-green, #34d399); }
      .sbo-check.running { border-color: var(--text-accent); color: var(--text-accent); }

      .sbo-task-name-cell { overflow: hidden; }
      .sbo-task-name-text { color: var(--text-normal); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .sbo-task-path { font-size: 9px; color: var(--text-faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .sbo-cell-muted { color: var(--text-muted); font-size: 10px; }
      .sbo-row-actions { display: flex; gap: 3px; }

      /* TAGS */
      .sbo-tag { font-size: 9px; padding: 1px 5px; border-radius: 3px; }
      .sbo-tag.claude { background: rgba(167,139,250,0.12); color: var(--color-purple, #a78bfa); }
      .sbo-tag.omi { background: rgba(52,211,153,0.1); color: var(--color-green, #34d399); }
      .sbo-tag.obsidian { background: var(--interactive-accent-hover); color: var(--text-accent); }

      /* STATUS PILLS */
      .sbo-pill { font-size: 9px; padding: 2px 7px; border-radius: 9px; }
      .sbo-pill.success { background: rgba(52,211,153,0.1); color: var(--color-green, #34d399); }
      .sbo-pill.running { background: var(--interactive-accent-hover); color: var(--text-accent); }
      .sbo-pill.pending { background: rgba(251,191,36,0.08); color: var(--color-yellow, #fbbf24); }
      .sbo-pill.error { background: rgba(248,113,113,0.1); color: var(--text-error); }

      /* OUTPUT LOG */
      .sbo-log-entry { padding: 10px 12px; border-bottom: 1px solid var(--background-modifier-border); cursor: pointer; transition: background 0.1s; }
      .sbo-log-entry:last-child { border-bottom: none; }
      .sbo-log-entry:hover { background: var(--background-modifier-hover); }
      .sbo-log-header { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 3px; }
      .sbo-log-name { font-size: 11px; color: var(--text-normal); font-weight: 500; }
      .sbo-log-time { font-size: 9px; color: var(--text-faint); flex-shrink: 0; }
      .sbo-log-meta { margin-bottom: 3px; }
      .sbo-log-preview { font-size: 10px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

      /* PROJECTS */
      .sbo-project-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 12px; }
      .sbo-project-card { background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 6px; padding: 10px; cursor: pointer; transition: all 0.15s; display: flex; flex-direction: column; gap: 6px; }
      .sbo-project-card:hover { border-color: var(--text-accent); }
      .sbo-project-icon { font-size: 18px; }
      .sbo-project-name { font-size: 12px; font-weight: 500; color: var(--text-normal); }
      .sbo-project-count { font-size: 10px; color: var(--text-faint); }
      .sbo-bar { height: 2px; background: var(--background-modifier-border); border-radius: 2px; overflow: hidden; }
      .sbo-bar-fill { height: 100%; border-radius: 2px; }

      /* EMPTY */
      .sbo-empty { padding: 30px; text-align: center; color: var(--text-faint); font-size: 11px; }
      .sbo-empty-icon { font-size: 24px; margin-bottom: 6px; opacity: 0.4; }

      /* MODAL */
      .sbo-modal-content { display: flex; flex-direction: column; gap: 12px; padding: 4px 0; }
      .sbo-field { display: flex; flex-direction: column; gap: 4px; }
      .sbo-field label { font-size: 10px; color: var(--text-muted); letter-spacing: 0.06em; text-transform: uppercase; }
      .sbo-field input, .sbo-field select, .sbo-field textarea {
        font-family: 'DM Mono', monospace; font-size: 12px;
        padding: 7px 9px; background: var(--background-primary);
        border: 1px solid var(--background-modifier-border); border-radius: 5px;
        color: var(--text-normal); width: 100%; outline: none;
      }
      .sbo-field input:focus, .sbo-field select:focus, .sbo-field textarea:focus { border-color: var(--text-accent); }
      .sbo-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .sbo-output-code {
        background: var(--background-primary); border: 1px solid var(--background-modifier-border);
        border-radius: 5px; padding: 10px; font-size: 11px; line-height: 1.6;
        color: var(--text-muted); white-space: pre-wrap; word-break: break-word;
        max-height: 260px; overflow-y: auto;
      }

      /* Scrollbar */
      .sbo-main::-webkit-scrollbar { width: 3px; }
      .sbo-main::-webkit-scrollbar-thumb { background: var(--background-modifier-border); border-radius: 3px; }
    `;
  }
}

// ─── Add Task Modal ────────────────────────────────────────────────────────────

class AddTaskModal extends Modal {
  constructor(app, onSubmit) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: 'New Scheduled Task', cls: 'modal-title' });

    const form = contentEl.createEl('div', { cls: 'sbo-modal-content' });

    const nameF = form.createEl('div', { cls: 'sbo-field' });
    nameF.createEl('label', { text: 'Task Name' });
    const nameInput = nameF.createEl('input', { type: 'text', placeholder: 'e.g. Daily client recap' });

    const row1 = form.createEl('div', { cls: 'sbo-field-row' });

    const srcF = row1.createEl('div', { cls: 'sbo-field' });
    srcF.createEl('label', { text: 'Source' });
    const srcSel = srcF.createEl('select');
    [['claude', 'Claude Code'], ['omi', 'Omi AI'], ['obsidian', 'Obsidian']].forEach(([v, l]) => {
      const o = srcSel.createEl('option', { value: v, text: l });
    });

    const freqF = row1.createEl('div', { cls: 'sbo-field' });
    freqF.createEl('label', { text: 'Frequency' });
    const freqSel = freqF.createEl('select');
    [['daily','Daily'], ['weekdays','Weekdays'], ['weekly','Weekly'], ['hourly','Hourly'], ['manual','Manual']].forEach(([v, l]) => {
      freqSel.createEl('option', { value: v, text: l });
    });

    const row2 = form.createEl('div', { cls: 'sbo-field-row' });

    const timeF = row2.createEl('div', { cls: 'sbo-field' });
    timeF.createEl('label', { text: 'Run Time' });
    const timeInput = timeF.createEl('input', { type: 'time', value: '08:00' });

    const pathF = row2.createEl('div', { cls: 'sbo-field' });
    pathF.createEl('label', { text: 'Output Path' });
    const pathInput = pathF.createEl('input', { type: 'text', placeholder: 'e.g. Outputs/Daily' });

    const descF = form.createEl('div', { cls: 'sbo-field' });
    descF.createEl('label', { text: 'Description' });
    const descInput = descF.createEl('textarea', { placeholder: 'What should this task do?' });
    descInput.rows = 3;

    const footer = contentEl.createEl('div', { cls: 'modal-button-container' });
    const cancelBtn = footer.createEl('button', { text: 'Cancel', cls: 'mod-warning' });
    cancelBtn.addEventListener('click', () => this.close());
    const submitBtn = footer.createEl('button', { text: 'Create Task', cls: 'mod-cta' });
    submitBtn.addEventListener('click', () => {
      const name = nameInput.value.trim();
      if (!name) { nameInput.focus(); return; }
      this.onSubmit({
        name,
        source: srcSel.value,
        freq: freqSel.value,
        time: timeInput.value,
        path: pathInput.value.trim(),
        desc: descInput.value.trim(),
      });
      this.close();
    });
  }

  onClose() { this.contentEl.empty(); }
}

// ─── Output Detail Modal ───────────────────────────────────────────────────────

class OutputDetailModal extends Modal {
  constructor(app, output) {
    super(app);
    this.output = output;
  }

  onOpen() {
    const { contentEl } = this;
    const o = this.output;
    contentEl.createEl('h2', { text: o.task });

    const body = contentEl.createEl('div', { cls: 'sbo-modal-content' });

    const row = body.createEl('div', { cls: 'sbo-field-row' });
    const sf = row.createEl('div', { cls: 'sbo-field' });
    sf.createEl('label', { text: 'Source' });
    sf.createEl('div', { text: o.source === 'claude' ? 'Claude Code' : o.source === 'omi' ? 'Omi AI' : 'Obsidian' });

    const tf = row.createEl('div', { cls: 'sbo-field' });
    tf.createEl('label', { text: 'Time' });
    tf.createEl('div', { text: o.time });

    const pf = body.createEl('div', { cls: 'sbo-field' });
    pf.createEl('label', { text: 'Content' });
    pf.createEl('div', { cls: 'sbo-output-code', text: o.content });

    const pathF = body.createEl('div', { cls: 'sbo-field' });
    pathF.createEl('label', { text: 'Vault Path' });
    pathF.createEl('div', { text: o.path, cls: 'sbo-cell-muted' });

    const footer = contentEl.createEl('div', { cls: 'modal-button-container' });
    const closeBtn = footer.createEl('button', { text: 'Close' });
    closeBtn.addEventListener('click', () => this.close());
    const openBtn = footer.createEl('button', { text: 'Open Note', cls: 'mod-cta' });
    openBtn.addEventListener('click', () => {
      this.app.workspace.openLinkText(o.path, '', false);
      this.close();
    });
  }

  onClose() { this.contentEl.empty(); }
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

class OpsSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'Second Brain Ops Center' });

    new Setting(containerEl)
      .setName('Claude Code output folder')
      .setDesc('Folder in your vault where Claude Code writes output notes.')
      .addText(t => t.setPlaceholder('ClaudeCode/Outputs').setValue(this.plugin.settings.claudeOutputFolder)
        .onChange(async v => { this.plugin.settings.claudeOutputFolder = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName('Omi AI notes folder')
      .setDesc('Folder where Omi writes daily conversation captures.')
      .addText(t => t.setPlaceholder('Omi/Daily').setValue(this.plugin.settings.omiFolder)
        .onChange(async v => { this.plugin.settings.omiFolder = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName('Obsidian outputs folder')
      .setDesc('Additional folder to scan for task output notes.')
      .addText(t => t.setPlaceholder('Outputs').setValue(this.plugin.settings.obsidianOutputFolder)
        .onChange(async v => { this.plugin.settings.obsidianOutputFolder = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName('Open on startup')
      .setDesc('Automatically open the Ops Center when Obsidian launches.')
      .addToggle(t => t.setValue(this.plugin.settings.openOnStartup || false)
        .onChange(async v => { this.plugin.settings.openOnStartup = v; await this.plugin.saveSettings(); }));
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────

module.exports = SecondBrainPlugin;
