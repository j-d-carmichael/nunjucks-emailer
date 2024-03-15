import fs from 'fs-extra';
import EmailerSetup from '@/emailerSetup';
import { EmailerConstructor } from '@/interfaces/EmailerContructor';

export default (emailerConstructor: EmailerConstructor): void => {
  EmailerSetup(emailerConstructor);
  fs.ensureDirSync(global.OPENAPI_NODEGEN_EMAILER_SETTINGS.logPath);
};
