import { DeviceTransport } from './DeviceTransport';
import { DeviceCommandPayload, DeviceStatusResponse, TransportMode } from '../../types/device';
import { channelToHardwareIndex, channelsToMasks, FAN_SLAVE_INDEX } from '../hardware/maskEngine';

export class LocalEspTransport implements DeviceTransport {
  readonly name = 'Local ESP32 Direct / Bridge';
  readonly mode: TransportMode = 'local';
  private espHost: string;

  constructor(host?: string) {
    const savedHost = typeof localStorage !== 'undefined' ? localStorage.getItem('aromaxai_esp_host') : null;
    this.espHost = host || savedHost || (import.meta.env.VITE_ESP32_HOST as string) || 'http://10.162.171.155';
  }

  setHost(host: string) {
    this.espHost = host.trim().replace(/\/+$/, '');
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('aromaxai_esp_host', this.espHost);
      } catch {
        // ignore
      }
    }
  }

  getHost(): string {
    return this.espHost;
  }

  /**
   * Safe fetcher that tries direct browser fetch first;
   * if blocked by Mixed Content (HTTPS -> HTTP) or CORS, falls back to server-side bridge.
   */
  private async executeRequest<T>(
    endpoint: string,
    options?: RequestInit,
    timeoutMs = 4000
  ): Promise<T> {
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // Helper for timeout
    const fetchWithTimeout = async (url: string, init?: RequestInit): Promise<Response> => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { ...init, signal: controller.signal });
        clearTimeout(id);
        return res;
      } catch (err) {
        clearTimeout(id);
        throw err;
      }
    };

    // If HTTPS, browser strictly blocks http://192.168.6.155 as Mixed Content,
    // so we route directly via backend proxy bridge.
    if (isHttps) {
      const proxyUrl = `/api/device/proxy?target=${encodeURIComponent(this.espHost)}&endpoint=${encodeURIComponent(cleanEndpoint)}`;
      const res = await fetchWithTimeout(proxyUrl, options);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Device proxy error (${res.status}): ${text || res.statusText}`);
      }
      return (await res.json()) as T;
    }

    // Otherwise, attempt direct local LAN connection first
    try {
      const directUrl = `${this.espHost}${cleanEndpoint}`;
      const res = await fetchWithTimeout(directUrl, {
        ...options,
        mode: 'cors'
      });
      if (!res.ok) {
        throw new Error(`Direct ESP32 returned status ${res.status}`);
      }
      return (await res.json()) as T;
    } catch {
      // Direct LAN failed or was blocked by CORS; route via backend bridge
      const proxyUrl = `/api/device/proxy?target=${encodeURIComponent(this.espHost)}&endpoint=${encodeURIComponent(cleanEndpoint)}`;
      const res = await fetchWithTimeout(proxyUrl, options);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Device bridge error (${res.status}): ${text || res.statusText}`);
      }
      return (await res.json()) as T;
    }
  }

  async getStatus(): Promise<DeviceStatusResponse> {
    const data = await this.executeRequest<{ masterMask?: number; slaveMask?: number; ip?: string }>(
      '/status',
      { method: 'GET' },
      3000
    );

    return {
      masterMask: typeof data.masterMask === 'number' ? data.masterMask : 0,
      slaveMask: typeof data.slaveMask === 'number' ? data.slaveMask : 0,
      ip: data.ip || '192.168.6.155'
    };
  }

  async sendState(payload: DeviceCommandPayload): Promise<{ success: boolean; latencyMs?: number; error?: string }> {
    const start = performance.now();
    try {
      const { masterMask, slaveMask } = channelsToMasks(payload.channels);

      // Attempt clean modern /state POST endpoint first (supported in upgraded firmware)
      try {
        await this.executeRequest(
          '/state',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              masterMask,
              slaveMask,
              r: payload.light.r,
              g: payload.light.g,
              b: payload.light.b
            })
          },
          3000
        );
        return { success: true, latencyMs: Math.round(performance.now() - start) };
      } catch {
        // Fallback to legacy GET firmware endpoints:
        // 1. Reset aromas: /all?state=0
        await this.executeRequest('/all?state=0', { method: 'GET' }, 2000);

        // 2. Set RGB light: /rgb?r=R&g=G&b=B
        await this.executeRequest(
          `/rgb?r=${payload.light.r}&g=${payload.light.g}&b=${payload.light.b}`,
          { method: 'GET' },
          2000
        );

        // 3. Ensure fan is on (Slave index 12)
        await this.executeRequest(
          `/toggle?board=slave&index=${FAN_SLAVE_INDEX}`,
          { method: 'GET' },
          2000
        );

        // 4. Toggle required aroma channels
        for (const chId of payload.channels) {
          const hw = channelToHardwareIndex(chId);
          if (hw && hw.index !== undefined) {
            await this.executeRequest(
              `/toggle?board=${hw.board}&index=${hw.index}`,
              { method: 'GET' },
              2000
            );
          }
        }

        return { success: true, latencyMs: Math.round(performance.now() - start) };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  async stopAll(): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Reset all channels
      await this.executeRequest('/all?state=0', { method: 'GET' }, 2500);

      // 2. Reset RGB to neutral/off
      await this.executeRequest('/rgb?r=0&g=0&b=0', { method: 'GET' }, 2500);

      // 3. Ensure fan (Slave index 12) remains ACTIVE as per hardware safety rule
      await this.executeRequest(
        `/toggle?board=slave&index=${FAN_SLAVE_INDEX}`,
        { method: 'GET' },
        2500
      );

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  async testChannel(channelId: string, durationSeconds: number): Promise<{ success: boolean; error?: string }> {
    const hw = channelToHardwareIndex(channelId);
    if (!hw) {
      return { success: false, error: `Invalid channel identifier ${channelId}` };
    }

    try {
      // Activate target channel with fan active
      await this.sendState({
        channels: [channelId],
        light: { r: 52, g: 199, b: 89 }
      });

      // Automatic stop after duration is managed by timer caller / caller orchestration
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }
}
