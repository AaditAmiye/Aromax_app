import { DeviceTransport } from './DeviceTransport';
import { LocalEspTransport } from './LocalEspTransport';
import { FirebaseTransport } from './FirebaseTransport';
import { MockTransport } from './MockTransport';
import { DeviceState, TransportMode, DeviceCommandPayload } from '../../types/device';
import { RGB } from '../../types/aroma';
import { channelsToMasks, masksToChannels } from '../hardware/maskEngine';
import { isFirebaseConfigured, db } from '../firebase/firebaseClient';
import { ref, set, get } from 'firebase/database';
import { ALL_NON_LIGHTING_CHANNEL_IDS, UNASSIGNED_CHANNEL_IDS } from '../../data/aromas';

type StateListener = (state: DeviceState) => void;

class DeviceService {
  private transport: DeviceTransport;
  private localTransport: LocalEspTransport;
  private firebaseTransport: FirebaseTransport;
  private mockTransport: MockTransport;

  private state: DeviceState;
  private listeners = new Set<StateListener>();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private testTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.localTransport = new LocalEspTransport();
    this.firebaseTransport = new FirebaseTransport();
    this.mockTransport = new MockTransport();

    // Default mode from env, localStorage, or auto-detect from origin
    const savedMode = typeof localStorage !== 'undefined' ? (localStorage.getItem('aromaxai_transport_mode') as TransportMode) : null;
    const isCloudOrigin = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    const envMode = savedMode || (import.meta.env.VITE_DEVICE_MODE as TransportMode) || (isCloudOrigin ? 'cloud' : 'local');
    const savedDeviceId = typeof localStorage !== 'undefined' ? localStorage.getItem('aromaxai_device_id') || 'ARX-000001' : 'ARX-000001';

    this.firebaseTransport = new FirebaseTransport(savedDeviceId);
    this.transport = this.selectTransport(envMode);

    const initialMasks = channelsToMasks([]);

    this.state = {
      connected: false,
      cloudConnected: isFirebaseConfigured,
      transportMode: this.transport.mode,
      deviceId: savedDeviceId,
      fanEnabled: true,
      host: this.localTransport.getHost(),
      lastSeen: null,
      activeChannels: [],
      light: { r: 0, g: 0, b: 0 },
      airflow: 'active',
      masks: initialMasks,
      telemetry: {
        purgeDeltaSeconds: 0.28,
        dispersionVelocity: 1.4,
        chamberPressureBar: 1.02,
        ambientTemperatureC: 22.4,
        fanRpm: 1840,
        airflow: 'active',
        frequencyKhz: 114
      },
      error: null,
      lastCommandTimestamp: null,
      ota: {
        status: 'idle',
        currentVersion: '1.4.0'
      }
    };

    // Begin device ping/heartbeat checks
    this.startHeartbeat();
  }

  private selectTransport(mode: TransportMode): DeviceTransport {
    if (mode === 'cloud') return this.firebaseTransport;
    if (mode === 'mock') return this.mockTransport;
    return this.localTransport;
  }

  setTransportMode(mode: TransportMode) {
    this.transport = this.selectTransport(mode);
    this.state.transportMode = mode;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('aromaxai_transport_mode', mode);
      } catch {
        // ignore
      }
    }
    this.checkConnectivity();
    this.notify();
  }

  setEspHost(host: string) {
    this.localTransport.setHost(host);
    this.state.host = host;
    if (this.state.transportMode === 'local') {
      this.checkConnectivity();
    }
    this.notify();
  }

  getEspHost(): string {
    return this.localTransport.getHost();
  }

  setDeviceId(deviceId: string) {
    const cleanId = deviceId.trim();
    if (!cleanId) return;
    this.state.deviceId = cleanId;
    this.firebaseTransport.setDeviceId(cleanId);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('aromaxai_device_id', cleanId);
      } catch {
        // ignore
      }
    }
    this.checkConnectivity();
    this.notify();
  }

  getDeviceId(): string {
    return this.state.deviceId;
  }

  async setFan(enabled: boolean): Promise<{ success: boolean; error?: string }> {
    return this.applyState({
      channels: this.state.activeChannels,
      light: this.state.light,
      fan: enabled,
      source: 'fan-control'
    });
  }

  async toggleFan(): Promise<{ success: boolean; error?: string }> {
    return this.setFan(!this.state.fanEnabled);
  }

  async triggerOtaUpdate(): Promise<{ success: boolean; error?: string }> {
    if (!isFirebaseConfigured || !db) {
      return { success: false, error: 'Firebase not configured' };
    }
    try {
      this.state.ota = {
        ...this.state.ota,
        status: 'downloading'
      };
      this.notify();
      await set(ref(db, `devices/${this.state.deviceId}/ota/action`), 'start');
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  async claimDevice(deviceId: string, claimCode: string, ownerUid?: string): Promise<{ success: boolean; error?: string }> {
    if (!isFirebaseConfigured || !db) {
      return { success: false, error: 'Firebase not configured' };
    }
    const cleanId = deviceId.trim().toUpperCase();
    const cleanCode = claimCode.trim();
    if (!cleanId || !cleanCode) {
      return { success: false, error: 'Device ID and Claim Code are required' };
    }

    try {
      const deviceRef = ref(db, `devices/${cleanId}`);
      const snap = await get(deviceRef);
      if (!snap.exists()) {
        return { success: false, error: `Device ${cleanId} not found in database.` };
      }

      const devData = snap.val();
      if (devData.claimCode && String(devData.claimCode).trim() !== cleanCode) {
        return { success: false, error: 'Invalid Claim Code for this unit.' };
      }

      if (devData.ownerUid && devData.ownerUid !== ownerUid) {
        return { success: false, error: 'Device is already claimed by another owner.' };
      }

      const updates: Promise<any>[] = [
        set(ref(db, `devices/${cleanId}/ownerUid`), ownerUid || 'owner')
      ];
      if (ownerUid) {
        updates.push(set(ref(db, `users/${ownerUid}/devices/${cleanId}`), true));
      }
      await Promise.all(updates);

      this.setDeviceId(cleanId);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  getState(): DeviceState {
    return { ...this.state };
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const copy = { ...this.state };
    for (const listener of this.listeners) {
      try {
        listener(copy);
      } catch (err) {
        console.error('Error in device state listener:', err);
      }
    }
  }

  async checkConnectivity(): Promise<boolean> {
    try {
      const status = await this.transport.getStatus();
      const now = Date.now();
      const calculatedChannels = masksToChannels(status.masterMask, status.slaveMask);

      this.state.connected = true;
      this.state.lastSeen = now;
      this.state.error = null;
      this.state.masks = {
        masterMask: status.masterMask,
        slaveMask: status.slaveMask
      };

      // Only sync active channels if we didn't initiate another state recently
      if (!this.state.lastCommandTimestamp || now - this.state.lastCommandTimestamp > 3000) {
        this.state.activeChannels = calculatedChannels;
      }

      // Sync OTA metadata in cloud mode
      if (isFirebaseConfigured && db && this.state.transportMode === 'cloud') {
        try {
          const otaSnap = await get(ref(db, `devices/${this.state.deviceId}/ota`));
          if (otaSnap.exists()) {
            const otaData = otaSnap.val();
            this.state.ota = {
              status: otaData.status || 'idle',
              currentVersion: otaData.currentVersion || this.state.ota.currentVersion || '1.4.0',
              targetVersion: otaData.targetVersion,
              releaseNotes: otaData.releaseNotes,
              progress: otaData.progress,
              error: otaData.error
            };
          }
        } catch {
          // ignore ota fetch error
        }
      }

      this.notify();
      return true;
    } catch (err: unknown) {
      this.state.connected = false;
      const msg = err instanceof Error ? err.message : String(err);
      this.state.error = msg;
      this.notify();
      return false;
    }
  }

  startHeartbeat(intervalMs = 6000) {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.checkConnectivity();
    this.heartbeatInterval = setInterval(() => {
      this.checkConnectivity();
    }, intervalMs);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Applies an absolute state to the hardware
   */
  async applyState(payload: DeviceCommandPayload): Promise<{ success: boolean; latencyMs?: number; error?: string }> {
    // Hardware Safety Check: never allow arbitrary unvalidated channels
    const sanitizedChannels = (payload.channels || []).filter((ch) => typeof ch === 'string' && /^H\d{2}$/i.test(ch));
    const activeFan = payload.fan !== undefined ? payload.fan : this.state.fanEnabled;
    const masks = channelsToMasks(sanitizedChannels, { enforceFanOff: !activeFan });

    try {
      const res = await this.transport.sendState({
        ...payload,
        fan: activeFan,
        channels: sanitizedChannels
      });

      if (res.success) {
        this.state.activeChannels = sanitizedChannels;
        this.state.light = payload.light;
        this.state.masks = masks;
        this.state.fanEnabled = activeFan;
        this.state.airflow = activeFan ? 'active' : 'inactive';
        this.state.lastCommandTimestamp = Date.now();
        this.state.error = null;
        this.notify();
        return res;
      } else {
        this.state.error = res.error || 'Device command failed';
        this.notify();
        return res;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.state.error = msg;
      this.notify();
      return { success: false, error: msg };
    }
  }

  /**
   * Dedicated RGB light controller
   */
  async setRgbLight(r: number, g: number, b: number): Promise<{ success: boolean; error?: string }> {
    const light: RGB = {
      r: Math.max(0, Math.min(255, Math.round(r))),
      g: Math.max(0, Math.min(255, Math.round(g))),
      b: Math.max(0, Math.min(255, Math.round(b)))
    };
    return this.applyState({
      channels: this.state.activeChannels,
      light,
      source: 'device-rgb-control'
    });
  }

  async toggleLightChannel(channelId: 'H02' | 'H03' | 'H13'): Promise<{ success: boolean; error?: string }> {
    const cur = { ...this.state.light };
    if (channelId === 'H13') {
      cur.r = cur.r > 127 ? 0 : 255;
    } else if (channelId === 'H03') {
      cur.g = cur.g > 127 ? 0 : 255;
    } else if (channelId === 'H02') {
      cur.b = cur.b > 127 ? 0 : 255;
    }
    return this.setRgbLight(cur.r, cur.g, cur.b);
  }

  /**
   * Technical individual channel tester
   */
  async testChannel(channelId: string, durationSeconds: number): Promise<{ success: boolean; error?: string }> {
    if (this.testTimer) {
      clearTimeout(this.testTimer);
      this.testTimer = null;
    }

    const res = await this.applyState({
      channels: [channelId],
      light: { r: 52, g: 199, b: 89 },
      source: 'hardware-test'
    });

    if (!res.success) return res;

    // Automatic hardware safety cutoff
    this.testTimer = setTimeout(async () => {
      await this.applyState({
        channels: [],
        light: { r: 0, g: 0, b: 0 },
        source: 'test-auto-stop'
      });
      this.testTimer = null;
    }, durationSeconds * 1000);

    return { success: true };
  }

  /**
   * Toggles an individual hardware channel ON/OFF directly
   */
  async toggleChannel(channelId: string): Promise<{ success: boolean; error?: string }> {
    const cur = [...this.state.activeChannels];
    const idx = cur.indexOf(channelId);
    let next: string[];
    if (idx >= 0) {
      next = cur.filter((id) => id !== channelId);
    } else {
      next = [...cur, channelId];
    }

    return this.applyState({
      channels: next,
      light: this.state.light,
      source: `toggle-${channelId}`
    });
  }

  /**
   * Turns ON or OFF all unassigned hardware pins (H01, H12, H17, H26)
   */
  async setUnassignedPins(enable: boolean): Promise<{ success: boolean; error?: string }> {
    const unassignedSet = new Set(UNASSIGNED_CHANNEL_IDS);
    let next: string[];
    if (enable) {
      next = Array.from(new Set([...this.state.activeChannels, ...UNASSIGNED_CHANNEL_IDS]));
    } else {
      next = this.state.activeChannels.filter((id) => !unassignedSet.has(id));
    }

    return this.applyState({
      channels: next,
      light: this.state.light,
      source: enable ? 'unassigned-all-on' : 'unassigned-all-off'
    });
  }

  /**
   * Turns ON all 31-32 hardware pins/actuators across Master (H01-H17) and Slave (H18-H34) boards.
   * Strictly keeps RGB lighting (H02 Blue, H03 Green, H13 Red) OFF.
   */
  async turnAllOn(): Promise<{ success: boolean; latencyMs?: number; error?: string }> {
    if (this.testTimer) {
      clearTimeout(this.testTimer);
      this.testTimer = null;
    }

    const nonLightingChannels = [...ALL_NON_LIGHTING_CHANNEL_IDS];
    const neutralLight: RGB = { r: 0, g: 0, b: 0 };

    return this.applyState({
      channels: nonLightingChannels,
      light: neutralLight,
      fan: true,
      source: 'hardware-all-on-no-light'
    });
  }

  /**
   * Turns OFF all hardware pins/actuators and lighting across the entire board.
   */
  async turnAllOff(): Promise<{ success: boolean; error?: string }> {
    return this.stopAll();
  }

  /**
   * Global Emergency Stop & Purge
   * Resets all aroma channels, stops all test timers, resets light to neutral,
   * while strictly keeping the fan/airflow active.
   */
  async stopAll(): Promise<{ success: boolean; error?: string }> {
    if (this.testTimer) {
      clearTimeout(this.testTimer);
      this.testTimer = null;
    }

    try {
      const res = await this.transport.stopAll();
      const neutralLight: RGB = { r: 0, g: 0, b: 0 };
      const emptyMasks = channelsToMasks([], { enforceFanOff: true });

      this.state.activeChannels = [];
      this.state.light = neutralLight;
      this.state.masks = emptyMasks;
      this.state.fanEnabled = false;
      this.state.airflow = 'inactive';
      this.state.lastCommandTimestamp = Date.now();
      this.notify();

      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }
}

export const deviceService = new DeviceService();
