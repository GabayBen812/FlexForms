import { Injectable, Logger } from '@nestjs/common';
import Mixpanel, { Mixpanel as MixpanelClient } from 'mixpanel';

type EventProperties = Record<string, unknown>;

@Injectable()
export class MixpanelService {
  private readonly logger = new Logger(MixpanelService.name);
  private readonly client: MixpanelClient | null = null;
  private readonly isEnabled: boolean;

  constructor() {
    const token = process.env.MIXPANEL_TOKEN;
    const debug = (process.env.MIXPANEL_DEBUG || '').toLowerCase() === 'true';

    if (!token) {
      this.isEnabled = false;
      if (debug) {
        this.logger.warn('Mixpanel token missing. Analytics disabled.');
      }
      return;
    }

    this.client = Mixpanel.init(token, {
      protocol: 'https',
    });
    this.isEnabled = true;

    if (debug) {
      this.logger.log('Mixpanel analytics enabled.');
    }
  }

  track(event: string, properties: EventProperties = {}): void {
    if (!this.canSend()) {
      return;
    }

    this.client!.track(event, properties, (err) => {
      if (err) {
        this.logger.error(`Failed to send Mixpanel event "${event}": ${err.message}`, err?.stack);
      }
    });
  }

  peopleSet(distinctId: string, properties: EventProperties = {}): void {
    if (!this.canSend()) {
      return;
    }

    this.client!.people.set(distinctId, properties, (err) => {
      if (err) {
        this.logger.error(`Failed to update Mixpanel profile "${distinctId}": ${err.message}`, err?.stack);
      }
    });
  }

  alias(distinctId: string, aliasId: string): void {
    if (!this.canSend()) {
      return;
    }

    this.client!.alias(distinctId, aliasId, (err) => {
      if (err) {
        this.logger.error(`Failed to alias Mixpanel user "${aliasId}" -> "${distinctId}": ${err.message}`, err?.stack);
      }
    });
  }

  private canSend(): boolean {
    return this.isEnabled && !!this.client;
  }
}

