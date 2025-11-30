import { Module } from '@nestjs/common';
import { MixpanelService } from '../services/mixpanel.service';

@Module({
  providers: [MixpanelService],
  exports: [MixpanelService],
})
export class AnalyticsModule {}









