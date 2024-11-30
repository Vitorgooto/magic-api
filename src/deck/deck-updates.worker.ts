import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Processor('deck-updates')
export class DeckUpdatesWorker {
  constructor(private readonly notificationsGateway: NotificationsGateway) {}

  @Process('notify')
  async handleUpdate(job: Job<any>) {
    const updateData = job.data;
    try {
  
      this.notificationsGateway.sendDeckImportStatus(updateData.deckId, 'Importação concluída');
      console.log(`Notificação de conclusão enviada para o deck ${updateData.deckId}`);
    } catch (error) {
      console.error(`Erro ao enviar notificação de atualização do deck: ${error.message}`);
    }
  }
}
