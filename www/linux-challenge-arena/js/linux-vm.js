(function(){
  class StackForgeLinuxVM {
    constructor({terminal, onStatus}) {
      this.term = terminal;
      this.onStatus = onStatus || (()=>{});
      this.emulator = null;
      this.ready = false;
      this.busy = false;
      this.capture = null;
      this.bootText = '';
      this.bootTimer = null;
      this.term.onData(data => {
        if (this.ready && !this.busy && this.emulator) this.emulator.serial0_send(data);
      });
    }

    boot() {
      this.onStatus('booting');
      this.term.writeln('\x1b[1;32mStackForge Linux VM\x1b[0m');
      this.term.writeln('Booting an isolated browser-based Linux environment…\r\n');

      try {
        this.emulator = new V86({
        wasm_path: 'assets/v86/v86.wasm',
        memory_size: 96 * 1024 * 1024,
        vga_memory_size: 2 * 1024 * 1024,
        bios: { url: 'assets/v86/seabios.bin' },
        vga_bios: { url: 'assets/v86/vgabios.bin' },
        bzimage: { url: 'assets/v86/buildroot-bzimage68.bin', async: false },
        filesystem: {},
        cmdline: 'tsc=reliable mitigations=off random.trust_cpu=on',
        autostart: true,
        disable_keyboard: true,
        disable_mouse: true,
        disable_speaker: true
        });
      } catch (error) {
        this._failBoot(error.message);
        return;
      }

      this.emulator.add_listener('serial0-output-byte', byte => this._onByte(byte));
      this.emulator.add_listener('download-error', event => {
        const file = event && (event.file_name || event.file_index);
        this._failBoot(`Could not load VM asset${file !== undefined ? ` (${file})` : ''}.`);
      });
      this.bootTimer = setTimeout(() => {
        if (!this.ready) this._failBoot('The Linux guest did not reach its shell prompt in time.');
      }, 90000);
    }

    _failBoot(message) {
      if (this.ready) return;
      clearTimeout(this.bootTimer);
      this.term.writeln(`\r\n\x1b[1;31mVM boot failed:\x1b[0m ${message}`);
      this.term.writeln('Reload the page to try again.');
      this.onStatus('error', message);
    }

    _onByte(byte) {
      if (byte === 13) return;
      const ch = String.fromCharCode(byte);

      if (this.capture) {
        this.capture.data += ch;
        if (this.capture.data.includes(this.capture.end)) {
          const current = this.capture;
          this.capture = null;
          this.busy = false;
          const startAt = current.data.indexOf(current.begin);
          const endAt = current.data.indexOf(current.end);
          let body = startAt >= 0 ? current.data.slice(startAt + current.begin.length, endAt) : current.data.slice(0, endAt);
          const rcMatch = body.match(new RegExp(current.rc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\d+)'));
          const code = rcMatch ? Number(rcMatch[1]) : 0;
          if (rcMatch) body = body.replace(rcMatch[0], '');
          body = body.replace(/^\s+|\s+$/g, '');
          current.resolve({ output: body, code });
        }
        return;
      }

      this.term.write(ch);
      this.bootText = (this.bootText + ch).slice(-5000);
      if (!this.ready && (this.bootText.endsWith('~% ') || this.bootText.endsWith('# '))) {
        this.ready = true;
        clearTimeout(this.bootTimer);
        this.term.clear();
        this.term.writeln('\x1b[1;32mStackForge Linux Challenge Arena\x1b[0m');
        this.term.writeln('\x1b[2mReal Linux guest · isolated in your browser · workspace /root/lab\x1b[0m\r\n');
        this.emulator.serial0_send("export PS1='root@stackforge:\\w# '; mkdir -p /root/lab; cd /root/lab; clear\n");
        setTimeout(() => this.onStatus('ready'), 120);
      }
    }

    async runCommand(command) {
      if (!this.ready) throw new Error('Linux VM is not ready yet.');
      while (this.busy) await new Promise(r => setTimeout(r, 40));
      this.busy = true;
      const id = Math.random().toString(36).slice(2, 10);
      const begin = `__SF_BEGIN_${id}__`;
      const rc = `__SF_RC_${id}__`;
      const end = `__SF_END_${id}__`;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          if (this.capture && this.capture.end === end) this.capture = null;
          this.busy = false;
          reject(new Error('Linux command timed out. Reset the task and try again.'));
        }, 12000);
        this.capture = {
          begin, rc, end, data: '',
          resolve: result => { clearTimeout(timer); resolve(result); }
        };
        const wrapped = `printf '__SF_BEGIN_%s__\\n' '${id}'; { ${command}; }; __sf_rc=$?; printf '\\n__SF_RC_%s__%s\\n__SF_END_%s__\\n' '${id}' "$__sf_rc" '${id}'\n`;
        this.emulator.serial0_send(wrapped);
      });
    }

    sendLine(command) {
      if (!this.ready || this.busy) return false;
      this.emulator.serial0_send(command + '\n');
      return true;
    }

    interrupt() {
      if (!this.ready || !this.emulator) return false;
      this.emulator.serial0_send('\x03');
      return true;
    }

    focus() { this.term.focus(); }
  }

  window.StackForgeLinuxVM = StackForgeLinuxVM;
})();
