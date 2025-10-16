'use strict';

class DiscordWidget extends HTMLElement {
  async connectedCallback() {
    // Attributes with defaults
    const guildId = this.dataset.serverId || this.id;
    const width = this.getAttribute('width') || '400px';
    const height = this.getAttribute('height') || '500px';
    const footerText = this.getAttribute('footerText') || 'Kundun Online';
    const color = this.getAttribute('color') || '#5865f2';
    const backgroundColor = this.getAttribute('backgroundColor') || '#0c0c0d';
    const textColor = this.getAttribute('textColor') || '#ffffff';
    const statusColor = this.getAttribute('statusColor') || '#858585';

    // Create header elements
    const head = document.createElement('widget-header');
    const logo = document.createElement('widget-logo');
    const count = document.createElement('widget-header-count');
    head.append(logo, count);

    // Create body and footer
    const body = document.createElement('widget-body');
    const footer = document.createElement('widget-footer');
	const joinButton = document.createElement('widget-button-join');
	joinButton.textContent = 'Join';
	joinButton.setAttribute('role', 'button');
	joinButton.setAttribute('tabindex', '0');
	joinButton.setAttribute('aria-label', `Join ${guildId} Discord server`);

	footer.append(joinButton); // only the button, no footerInfo

    // Apply style variables
    Object.assign(this.style, { width, height });
    this.style.setProperty('--color', color);
    this.style.setProperty('--bgColor', backgroundColor);
    this.style.setProperty('--textColor', textColor);
    this.style.setProperty('--statusColor', statusColor);
    this.style.setProperty('--buttonColor', safeShade(color, -10));

    // Build widget structure
    this.append(head, body, footer);

    // Join button handler
    const handleJoin = () => {
      const href = joinButton.getAttribute('href');
      if (href) window.open(href, '_blank');
    };
    joinButton.addEventListener('click', handleJoin);
    joinButton.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleJoin();
      }
    });

    // Guild ID check
    if (!guildId) {
      body.textContent = 'No Discord server ID specified.';
      return;
    }

    // Loading state
    body.textContent = 'Loading...';

    try {
      const res = await fetch(`https://discord.com/api/guilds/${guildId}/widget.json`);
      if (!res.ok) {
        if (res.status === 403) {
          body.textContent = 'Discord widget is disabled for this server.';
        } else if (res.status === 404) {
          body.textContent = 'Discord server not found.';
        } else {
          body.textContent = `Error loading widget (${res.status}).`;
        }
        return;
      }

      const data = await res.json();
      count.innerHTML = `<strong>${data.presence_count || 0}</strong> Members Online`;

      if (data.instant_invite) {
        joinButton.setAttribute('href', data.instant_invite);
      } else {
        joinButton.remove();
      }

      if (!Array.isArray(data.members) || data.members.length === 0) {
        body.textContent = 'No members to display.';
        return;
      }

      // Clear loading message
      body.textContent = '';

      // Build members list efficiently
      const fragment = document.createDocumentFragment();
      data.members.forEach(user => {
        const member = document.createElement('widget-member');

        const leftContainer = document.createElement('div');
        leftContainer.className = 'member-left';

        const avatar = document.createElement('widget-member-avatar');
        const img = document.createElement('img');
        img.src = user.avatar_url || createDefaultAvatar();
        img.alt = `${user.username}'s avatar`;
        img.onerror = () => {
          if (!img.dataset.fallback) {
            img.src = createDefaultAvatar();
            img.dataset.fallback = 'true';
          }
        };
        avatar.appendChild(img);

        // Status indicator with safe fallback
        const validStatuses = ['online','idle','dnd','offline'];
        const statusClass = validStatuses.includes(user.status) ? user.status : 'offline';
        const status = document.createElement('div');
        status.classList.add('widget-member-status', `widget-member-status-${statusClass}`);
        avatar.appendChild(status);

        const name = document.createElement('widget-member-name');
        name.textContent = user.username;

        leftContainer.append(avatar, name);

        const statusText = document.createElement('widget-member-status-text');
        if (user.game?.name) statusText.textContent = user.game.name;

        member.append(leftContainer, statusText);
        fragment.appendChild(member);
      });

      body.appendChild(fragment);

    } catch (err) {
      console.error('Discord widget error:', err);
      body.textContent = 'Failed to load Discord data.';
    }
  }
}

// Register custom element
customElements.define('discord-widget', DiscordWidget);

// Utility: safe shade for color variants
function safeShade(hex, percent) {
  const c = hex.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(c)) return hex;
  const num = parseInt(c, 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    '#' +
    (0x1000000 + (clamp(R) << 16) + (clamp(G) << 8) + clamp(B))
      .toString(16)
      .slice(1)
  );
}

function clamp(v) {
  return Math.min(255, Math.max(0, v));
}

// Default fallback avatar (SVG)
function createDefaultAvatar() {
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23747f8d"/%3E%3Ctext x="50" y="55" text-anchor="middle" font-size="40" fill="%23fff" font-family="sans-serif"%3E?%3C/text%3E%3C/svg%3E';
}