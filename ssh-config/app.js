/* ============================================
   SSH Config Generator & Troubleshooter
   ============================================ */

(function () {
  "use strict";

  // ------------------------------------------
  // State
  // ------------------------------------------
  var hosts = [];

  // ------------------------------------------
  // DOM refs
  // ------------------------------------------
  var form = document.getElementById("host-form");
  var hostList = document.getElementById("host-list");
  var preview = document.getElementById("config-preview").querySelector("code");
  var btnCopy = document.getElementById("btn-copy");
  var btnDownload = document.getElementById("btn-download");
  var btnClearForm = document.getElementById("btn-clear-form");
  var errorSelect = document.getElementById("error-select");
  var troubleshootResult = document.getElementById("troubleshoot-result");
  var toast = document.getElementById("toast");

  // Field IDs in the form (order matters for output)
  var fieldIds = [
    "host", "hostname", "user", "port", "identityfile", "proxyjump",
    "forwardagent", "localforward", "remoteforward",
    "serveraliveinterval", "serveralivecountmax",
    "identitiesonly", "stricthostkeychecking", "compression"
  ];

  // Map field ID to SSH config directive name
  var directiveNames = {
    host: "Host",
    hostname: "HostName",
    user: "User",
    port: "Port",
    identityfile: "IdentityFile",
    proxyjump: "ProxyJump",
    forwardagent: "ForwardAgent",
    localforward: "LocalForward",
    remoteforward: "RemoteForward",
    serveraliveinterval: "ServerAliveInterval",
    serveralivecountmax: "ServerAliveCountMax",
    identitiesonly: "IdentitiesOnly",
    stricthostkeychecking: "StrictHostKeyChecking",
    compression: "Compression"
  };

  // ------------------------------------------
  // Tabs
  // ------------------------------------------
  document.querySelectorAll(".tab-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".tab-btn").forEach(function (b) {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      document.querySelectorAll(".tab-content").forEach(function (c) {
        c.classList.remove("active");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    });
  });

  // ------------------------------------------
  // Form helpers
  // ------------------------------------------
  function getFieldValue(id) {
    var el = document.getElementById("field-" + id);
    if (!el) {
      return "";
    }
    return el.value.trim();
  }

  function setFieldValue(id, val) {
    var el = document.getElementById("field-" + id);
    if (el) {
      el.value = val;
    }
  }

  function clearForm() {
    form.reset();
  }

  function getFormData() {
    var data = {};
    fieldIds.forEach(function (id) {
      var val = getFieldValue(id);
      if (val) {
        data[id] = val;
      }
    });
    return data;
  }

  // ------------------------------------------
  // Build config string
  // ------------------------------------------
  function buildConfig() {
    if (hosts.length === 0) {
      return "# Add a host block to see your config here\n# Use the form on the left, or try a Quick Add pattern";
    }

    var lines = [];
    hosts.forEach(function (h, i) {
      if (i > 0) {
        lines.push("");
      }
      lines.push("Host " + h.host);
      fieldIds.forEach(function (id) {
        if (id === "host") {
          return;
        }
        if (h[id]) {
          lines.push("    " + directiveNames[id] + " " + h[id]);
        }
      });
    });
    return lines.join("\n") + "\n";
  }

  function renderPreview() {
    preview.textContent = buildConfig();
  }

  // ------------------------------------------
  // Live preview on form input
  // ------------------------------------------
  function buildLivePreview() {
    var current = getFormData();
    var tempHosts = hosts.slice();

    if (current.host && current.hostname) {
      tempHosts.push(current);
    }

    if (tempHosts.length === 0) {
      preview.textContent = "# Add a host block to see your config here\n# Use the form on the left, or try a Quick Add pattern";
      return;
    }

    var lines = [];
    tempHosts.forEach(function (h, i) {
      if (i > 0) {
        lines.push("");
      }
      lines.push("Host " + h.host);
      fieldIds.forEach(function (id) {
        if (id === "host") {
          return;
        }
        if (h[id]) {
          lines.push("    " + directiveNames[id] + " " + h[id]);
        }
      });
    });

    preview.textContent = lines.join("\n") + "\n";
  }

  // Attach live preview to all form fields
  fieldIds.forEach(function (id) {
    var el = document.getElementById("field-" + id);
    if (el) {
      el.addEventListener("input", buildLivePreview);
      el.addEventListener("change", buildLivePreview);
    }
  });

  // ------------------------------------------
  // Host list rendering
  // ------------------------------------------
  function renderHostList() {
    if (hosts.length === 0) {
      hostList.innerHTML = "";
      return;
    }

    var html = "<h3>Added Hosts (" + hosts.length + ")</h3>";
    hosts.forEach(function (h, i) {
      html += '<div class="host-item">' +
        '<div><span class="host-item-name">' + escapeHtml(h.host) + '</span>' +
        '<span class="host-item-target"> &rarr; ' + escapeHtml(h.hostname) + '</span></div>' +
        '<div class="host-item-actions">' +
        '<button class="btn-edit" data-index="' + i + '">Edit</button>' +
        '<button class="btn-remove" data-index="' + i + '">Remove</button>' +
        '</div></div>';
    });
    hostList.innerHTML = html;
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // Host list click delegation
  hostList.addEventListener("click", function (e) {
    var btn = e.target;
    var index = parseInt(btn.dataset.index, 10);
    if (isNaN(index)) {
      return;
    }

    if (btn.classList.contains("btn-remove")) {
      hosts.splice(index, 1);
      renderHostList();
      renderPreview();
      showToast("Host removed");
    } else if (btn.classList.contains("btn-edit")) {
      var h = hosts[index];
      clearForm();
      fieldIds.forEach(function (id) {
        if (h[id]) {
          setFieldValue(id, h[id]);
        }
      });
      hosts.splice(index, 1);
      renderHostList();
      buildLivePreview();
      showToast("Editing host -- modify and re-add");
    }
  });

  // ------------------------------------------
  // Add host
  // ------------------------------------------
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = getFormData();
    if (!data.host || !data.hostname) {
      showToast("Host alias and HostName are required");
      return;
    }
    hosts.push(data);
    clearForm();
    renderHostList();
    renderPreview();
    showToast("Host \"" + data.host + "\" added");
  });

  btnClearForm.addEventListener("click", function () {
    clearForm();
    buildLivePreview();
  });

  // ------------------------------------------
  // Copy & Download
  // ------------------------------------------
  btnCopy.addEventListener("click", function () {
    var text = buildConfig();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast("Copied to clipboard");
      });
    } else {
      fallbackCopy(text);
      showToast("Copied to clipboard");
    }
  });

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }

  btnDownload.addEventListener("click", function () {
    var text = buildConfig();
    var blob = new Blob([text], { type: "text/plain" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "config";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Downloaded as \"config\"");
  });

  // ------------------------------------------
  // Quick patterns
  // ------------------------------------------
  var patterns = {
    jumphost: [
      {
        host: "bastion",
        hostname: "bastion.example.com",
        user: "admin",
        identityfile: "~/.ssh/bastion_key",
        serveraliveinterval: "60"
      },
      {
        host: "internal",
        hostname: "10.0.1.50",
        user: "deploy",
        proxyjump: "bastion",
        identityfile: "~/.ssh/internal_key"
      }
    ],
    tunnel: [
      {
        host: "db-tunnel",
        hostname: "db-server.example.com",
        user: "admin",
        localforward: "5432 localhost:5432",
        identityfile: "~/.ssh/db_key",
        serveraliveinterval: "60"
      }
    ],
    github: [
      {
        host: "github-personal",
        hostname: "github.com",
        user: "git",
        identityfile: "~/.ssh/id_personal",
        identitiesonly: "yes"
      },
      {
        host: "github-work",
        hostname: "github.com",
        user: "git",
        identityfile: "~/.ssh/id_work",
        identitiesonly: "yes"
      }
    ],
    bastion: [
      {
        host: "aws-bastion",
        hostname: "54.x.x.x",
        user: "ec2-user",
        identityfile: "~/.ssh/aws-bastion.pem",
        serveraliveinterval: "60"
      },
      {
        host: "aws-private",
        hostname: "10.0.2.15",
        user: "ec2-user",
        proxyjump: "aws-bastion",
        identityfile: "~/.ssh/aws-private.pem"
      }
    ],
    multikey: [
      {
        host: "server-a",
        hostname: "a.example.com",
        user: "deploy",
        identityfile: "~/.ssh/key_a",
        identitiesonly: "yes"
      },
      {
        host: "server-b",
        hostname: "b.example.com",
        user: "admin",
        identityfile: "~/.ssh/key_b",
        identitiesonly: "yes"
      },
      {
        host: "*",
        hostname: "",
        serveraliveinterval: "60",
        serveralivecountmax: "3"
      }
    ]
  };

  // Fix multikey wildcard -- Host * doesn't need HostName
  // We handle this in buildConfig by treating empty hostname specially
  // Actually, let's adjust: for * host, hostname is optional
  document.querySelectorAll(".pattern-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var key = btn.dataset.pattern;
      var entries = patterns[key];
      if (!entries) {
        return;
      }

      entries.forEach(function (entry) {
        // For wildcard host, hostname is not required
        if (entry.host && (entry.hostname || entry.host === "*")) {
          hosts.push(Object.assign({}, entry));
        }
      });

      clearForm();
      renderHostList();
      renderPreview();
      showToast("Added " + entries.length + " host block(s)");
    });
  });

  // Patch buildConfig to handle host * (no hostname)
  // Override the original to skip hostname if empty
  // Already handled: if h[id] is falsy, directive is skipped.

  // ------------------------------------------
  // Troubleshooter
  // ------------------------------------------
  var troubleshootData = {
    "permission-denied": {
      title: "Permission denied (publickey)",
      desc: "The server rejected your authentication. This usually means the server could not verify your identity via SSH keys.",
      steps: [
        "Verify you are using the correct username: <code>ssh -v user@host</code> and check the \"Authenticated\" line.",
        "Check that your private key exists and has correct permissions: <code>ls -la ~/.ssh/</code> -- private key should be <code>chmod 600</code>.",
        "Ensure the matching public key is in the remote server's <code>~/.ssh/authorized_keys</code> file.",
        "Check the remote <code>~/.ssh</code> directory permissions: should be <code>700</code>. The <code>authorized_keys</code> file should be <code>600</code>.",
        "If using an SSH agent, check the key is loaded: <code>ssh-add -l</code>. If not, add it: <code>ssh-add ~/.ssh/your_key</code>.",
        "If you have multiple keys, set <code>IdentitiesOnly yes</code> and specify the correct <code>IdentityFile</code> in your SSH config.",
        "Check the remote server's <code>/var/log/auth.log</code> or <code>/var/log/secure</code> for more specific error messages.",
        "Verify the server allows public key authentication: check <code>PubkeyAuthentication yes</code> in <code>/etc/ssh/sshd_config</code>."
      ]
    },
    "connection-refused": {
      title: "Connection refused",
      desc: "The client reached the server's IP, but nothing is listening on the SSH port. The connection was actively rejected.",
      steps: [
        "Verify the server's SSH daemon is running: <code>systemctl status sshd</code> or <code>service ssh status</code>.",
        "Check you are connecting to the correct port. Default is 22, but it may be different: <code>ssh -p 2222 user@host</code>.",
        "Confirm the server's firewall allows inbound connections on the SSH port: <code>sudo ufw status</code> or <code>sudo iptables -L -n</code>.",
        "If using a cloud provider, check the security group or network ACL rules allow TCP on your SSH port.",
        "Verify the IP address or hostname is correct: <code>ping host</code> or <code>nslookup host</code>.",
        "Try restarting the SSH service: <code>sudo systemctl restart sshd</code>.",
        "Check if the SSH daemon is bound to the correct interface in <code>/etc/ssh/sshd_config</code> (<code>ListenAddress</code>)."
      ]
    },
    "host-key-verification": {
      title: "Host key verification failed",
      desc: "The server's host key does not match what is stored in your known_hosts file. This can indicate a server change or a potential man-in-the-middle attack.",
      steps: [
        "Determine if the server was recently reinstalled, its IP changed, or its SSH host keys were regenerated. If so, the mismatch is expected.",
        "View the offending entry: the error message tells you the line number in <code>~/.ssh/known_hosts</code>.",
        "If you trust the change, remove the old key: <code>ssh-keygen -R hostname</code>.",
        "Reconnect and accept the new key: <code>ssh user@host</code> -- you will be prompted to confirm the new fingerprint.",
        "Verify the new fingerprint matches the server's actual key. On the server, run: <code>ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub</code>.",
        "If this is unexpected and you did NOT change the server, investigate further before connecting. This could indicate a MITM attack.",
        "For automation, consider <code>StrictHostKeyChecking accept-new</code> (accepts new keys but rejects changed keys)."
      ]
    },
    "connection-timed-out": {
      title: "Connection timed out",
      desc: "The SSH client could not reach the server at all. Packets are being dropped before reaching the SSH daemon.",
      steps: [
        "Verify basic network connectivity: <code>ping host</code>. If ping fails, the problem is network-level.",
        "Check if the host is reachable on the SSH port: <code>nc -zv host 22</code> or <code>telnet host 22</code>.",
        "Verify your local network allows outbound connections on the SSH port. Some corporate networks block port 22.",
        "Check if the remote server's firewall is dropping packets (rather than rejecting them).",
        "If using a cloud provider, verify the instance is running and the security group allows your IP.",
        "Try a different network (e.g., mobile hotspot) to rule out local network issues.",
        "Check DNS resolution: <code>nslookup host</code> or <code>dig host</code> -- ensure it resolves to the correct IP.",
        "Increase the connection timeout for debugging: <code>ssh -o ConnectTimeout=30 user@host</code>."
      ]
    },
    "too-many-auth": {
      title: "Too many authentication failures",
      desc: "SSH tried too many keys before finding the right one, and the server disconnected. This commonly happens when you have many keys loaded in your SSH agent.",
      steps: [
        "Check how many keys are loaded in your agent: <code>ssh-add -l</code>. More than 5-6 can cause this issue.",
        "Set <code>IdentitiesOnly yes</code> in your SSH config for this host, and specify the exact <code>IdentityFile</code>.",
        "Alternatively, remove unused keys from the agent: <code>ssh-add -d ~/.ssh/unused_key</code>.",
        "Connect with verbose output to see which keys are being tried: <code>ssh -v user@host</code>.",
        "Increase the server's <code>MaxAuthTries</code> in <code>/etc/ssh/sshd_config</code> (default is 6). Not recommended as a permanent fix.",
        "Specify the key directly on the command line: <code>ssh -i ~/.ssh/correct_key -o IdentitiesOnly=yes user@host</code>."
      ]
    }
  };

  errorSelect.addEventListener("change", function () {
    var key = errorSelect.value;
    if (!key || !troubleshootData[key]) {
      troubleshootResult.innerHTML = "";
      return;
    }

    var data = troubleshootData[key];
    var html = "<h3>" + data.title + "</h3>";
    html += '<p class="error-desc">' + data.desc + "</p>";
    html += '<ol class="checklist">';
    data.steps.forEach(function (step) {
      html += "<li><div>" + step + "</div></li>";
    });
    html += "</ol>";
    troubleshootResult.innerHTML = html;
  });

  // ------------------------------------------
  // Toast notification
  // ------------------------------------------
  var toastTimeout;
  function showToast(msg) {
    clearTimeout(toastTimeout);
    toast.textContent = msg;
    toast.classList.add("show");
    toastTimeout = setTimeout(function () {
      toast.classList.remove("show");
    }, 2500);
  }

  // ------------------------------------------
  // Init
  // ------------------------------------------
  renderPreview();
})();
